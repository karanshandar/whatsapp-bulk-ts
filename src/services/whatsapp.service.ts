/**
 * WhatsApp Service
 * Handles WhatsApp connection and session management
 */

import path from 'path';
import qrcode from 'qrcode';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import { getConfig } from '../config/config';
import { AppConfig } from '../types/config.types';
import { ProcessResult, StatusUpdate, MessageStatusEvent } from '../types/whatsapp.types';
import { ExcelRow } from '../types/excel.types';
import ExcelService from './excel.service';
import MessageService from './message.service';

// Import WhatsApp web library using require since it doesn't have proper TypeScript typings
// In a more comprehensive TypeScript setup, we would create proper type definitions
const { Client, LocalAuth } = require('whatsapp-web.js');

export class WhatsAppService {
  private io: SocketIOServer;
  private config: AppConfig;
  private clientId: string;
  private client: any; // whatsapp-web.js client
  private _isReady: boolean = false; // changed to _isReady to support the getter
  private stopRequested: boolean = false;
  private processingActive: boolean = false;
  private excelService: ExcelService;
  private messageService: MessageService;

  /**
   * Get the ready state of the WhatsApp client
   */
  public get isReady(): boolean {
    return this._isReady;
  }
  
  /**
   * Constructor
   */
  constructor(socketIo: SocketIOServer) {
    this.io = socketIo;
    this.config = getConfig();
    this.clientId = this.config.WHATSAPP_CLIENT_ID || `client-${Date.now()}`;
    this.excelService = new ExcelService();
    this.messageService = new MessageService(this.config);
  }

  /**
   * Set the client ID for WhatsApp authentication
   */
  public setClientId(clientId: string): void {
    if (clientId && clientId.trim() !== '') {
      this.clientId = clientId.trim();
      logger.info(`WhatsApp client ID set to: ${this.clientId}`);
    }
  }

  /**
   * Initialize the WhatsApp client
   */
  private initialize(): void {
    if (this.client) {
      logger.info('WhatsApp client already initialized');
      return;
    }

    logger.info(`Initializing WhatsApp client with ID: ${this.clientId}`);
    
    // Create whatsapp-web.js client
    this.client = new Client({
      authStrategy: new LocalAuth({ 
        clientId: this.clientId,
        dataPath: path.join(this.config.DATA_DIR, `.wwebjs_auth_${this.clientId}`),
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventListeners();
  }

  /**
   * Set up event listeners for the WhatsApp client
   */
  private setupEventListeners(): void {
    this.client.on('qr', async (qr: string) => {
      logger.info('QR Code received');
      
      try {
        // Convert QR code to data URL for display in the web UI
        const qrDataUrl = await qrcode.toDataURL(qr);
        // Emit the QR code to connected clients
        this.io.emit('qr', { qrDataUrl });
      } catch (error) {
        const err = error as Error;
        logger.error('Failed to generate QR code:', err);
      }
    });

    this.client.on('authenticated', () => {
      logger.info('WhatsApp authentication successful');
      const statusUpdate: StatusUpdate = { status: 'authenticated' };
      this.io.emit('status', statusUpdate);
    });

    this.client.on('auth_failure', (msg: string) => {
      logger.error('Authentication failure:', msg);
      const statusUpdate: StatusUpdate = { status: 'auth_failure', message: msg };
      this.io.emit('status', statusUpdate);
    });

    this.client.on('ready', () => {
      logger.info('WhatsApp client is ready');
      this._isReady = true; // Using _isReady instead of isReady
      const statusUpdate: StatusUpdate = { status: 'ready' };
      this.io.emit('status', statusUpdate);
      
      // Share client with message service
      this.messageService.setClient(this.client, this._isReady); // Using _isReady
    });

    this.client.on('disconnected', (reason: string) => {
      logger.warn('WhatsApp client disconnected:', reason);
      this._isReady = false; // Using _isReady
      const statusUpdate: StatusUpdate = { status: 'disconnected', reason };
      this.io.emit('status', statusUpdate);
      
      // Update message service
      this.messageService.setClient(this.client, this._isReady); // Using _isReady
    });
  }

  /**
   * Start the WhatsApp client
   */
  public start(): void {
    logger.info('Starting WhatsApp client');
    this.initialize();
    this.client.initialize();
  }

  /**
   * Stop the WhatsApp client
   */
  public async stop(): Promise<void> {
    if (this.client) {
      logger.info('Stopping WhatsApp client');
      await this.client.destroy();
      this.client = null;
      this._isReady = false; // Using _isReady
      const statusUpdate: StatusUpdate = { 
        status: 'disconnected', 
        reason: 'User initiated disconnect' 
      };
      this.io.emit('status', statusUpdate);
    }
  }

  /**
   * Stop the current processing operation
   */
  public stopProcessing(): void {
    logger.info('Stopping message processing');
    this.stopRequested = true;
    this.io.emit('process_status', { status: 'stopping' });
  }

  /**
   * Process a single row from the Excel file
   */
  private async processRow(row: ExcelRow, rowNum: number): Promise<boolean> {
    try {
      // Update row status to processing
      this.io.emit('row_status', {
        row: rowNum,
        status: 'processing'
      });
      
      // Validate phone number
      const phone = await this.messageService.validatePhoneNumber(row.Number);
      
      // Process based on message type
      let result;
      if (row.Type === 'message') {
        result = await this.messageService.sendMessage(phone, row['Message/Caption']);
      } 
      else if (row.Type === 'document' || row.Type === 'media') {
        result = await this.messageService.sendMediaWithCaption(
          phone,
          row.Link || '',
          row['Message/Caption'] || '',
          row.Type
        );
      }
      else {
        throw new Error(`Unsupported message type: ${row.Type}`);
      }
      
      // Send status event based on result
      if (result.success) {
        // Update row status to sent
        this.excelService.updateExcelStatus(this.config.EXCEL_FILE, rowNum, 'sent');
        this.io.emit('row_status', {
          row: rowNum,
          status: 'sent'
        });
        
        const statusEvent: MessageStatusEvent = {
          phone: result.phone,
          status: 'sent',
          type: row.Type,
          timestamp: new Date()
        };
        this.io.emit('message_status', statusEvent);
        
        return true;
      } else {
        // Update row status to failed
        this.excelService.updateExcelStatus(this.config.EXCEL_FILE, rowNum, 'failed', result.error);
        this.io.emit('row_status', {
          row: rowNum,
          status: 'failed',
          error: result.error
        });
        
        const statusEvent: MessageStatusEvent = {
          phone: result.phone,
          status: 'failed',
          type: row.Type,
          error: result.error,
          timestamp: new Date()
        };
        this.io.emit('message_status', statusEvent);
        
        return false;
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`Processing failed for row ${rowNum}:`, err);
      
      // Update row status to failed
      this.excelService.updateExcelStatus(this.config.EXCEL_FILE, rowNum, 'failed', err.message);
      this.io.emit('row_status', {
        row: rowNum,
        status: 'failed',
        error: err.message
      });
      
      return false;
    }
  }

  /**
   * Process Excel file and send messages
   */
  public async processExcelFile(excelPath: string): Promise<ProcessResult> {
    try {
      if (!this._isReady) { // Using _isReady instead of isReady
        throw new Error('WhatsApp client is not ready');
      }

      if (this.processingActive) {
        throw new Error('Message processing already in progress');
      }

      this.processingActive = true;
      this.stopRequested = false;

      // Load Excel data
      const excelData = await this.excelService.loadExcelFile(excelPath);
      
      logger.info(`Processing Excel file with ${excelData.length} rows`);
      this.io.emit('process_start', { total: excelData.length });
      
      let success = 0;
      let failed = 0;
      
      for (let i = 0; i < excelData.length; i++) {
        // Check if stop was requested
        if (this.stopRequested) {
          logger.info('Processing stopped by user request');
          this.io.emit('process_stopped', { 
            processed: i,
            total: excelData.length,
            success,
            failed
          });
          this.processingActive = false;
          this.stopRequested = false;
          return { success, failed, total: excelData.length, stopped: true };
        }

        try {
          const row = excelData[i];
          const rowNum = i + 2; // Excel is 1-indexed and has header row
          
          // Update progress
          this.io.emit('process_progress', {
            current: i + 1,
            total: excelData.length,
            percent: Math.round(((i + 1) / excelData.length) * 100)
          });
          
          // Process the row
          const result = await this.processRow(row, rowNum);
          
          if (result) {
            success++;
          } else {
            failed++;
          }
          
          // Add delay between messages
          await new Promise(resolve => setTimeout(resolve, this.config.DELAY_BETWEEN_MESSAGES));
        } catch (error) {
          failed++;
          const err = error as Error;
          logger.error(`Error processing row ${i + 2}:`, err);
        }
      }
      
      // Emit process complete event
      this.io.emit('process_complete', {
        total: excelData.length,
        success,
        failed
      });
      
      logger.info(`Excel processing complete: ${success} successful, ${failed} failed`);
      this.processingActive = false;
      return { success, failed, total: excelData.length };
    } catch (error) {
      const err = error as Error;
      logger.error('Excel processing failed:', err);
      this.io.emit('process_error', { error: err.message });
      this.processingActive = false;
      throw err;
    }
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Stop active processing
    if (this.processingActive) {
      this.stopProcessing();
    }
    
    // Clean up Excel service
    this.excelService.cleanup();
  }
}

export default WhatsAppService;