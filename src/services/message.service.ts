/**
 * Message Service
 * Handles message delivery and retry logic
 */

import fs from 'fs';
import { logger } from '../utils/logger';
import { MessageResult } from '../types/whatsapp.types';
import { AppConfig } from '../types/config.types';

export class MessageService {
  private config: AppConfig;
  private client: any; // whatsapp-web.js client
  private isReady: boolean = false;
  
  constructor(config: AppConfig) {
    this.config = config;
  }

  /**
   * Set the WhatsApp client instance
   */
  public setClient(client: any, isReady: boolean): void {
    this.client = client;
    this.isReady = isReady;
  }
  
  /**
   * Validate a phone number
   */
  public async validatePhoneNumber(phone: string, countryCode: string = '91'): Promise<string> {
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }
      
      // Clean the phone number
      let normalized = phone.toString().replace(/[^\d+]/g, '');
      
      // Check if number already has country code
      if (!normalized.startsWith('+')) {
        if (!normalized.startsWith(countryCode)) {
          normalized = countryCode + normalized;
        }
      } else {
        // Remove the + if present
        normalized = normalized.substring(1);
      }
      
      // Validate length
      if (normalized.length < 10 || normalized.length > 15) {
        throw new Error('Invalid phone number length');
      }
      
      return normalized;
    } catch (error) {
      const err = error as Error;
      logger.error(`Phone validation failed for ${phone}:`, err);
      throw err;
    }
  }

  /**
   * Send a text message with retry logic
   */
  public async sendMessage(phone: string, message: string, retryCount: number = 0): Promise<MessageResult> {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp client is not ready');
      }

      const normalizedPhone = await this.validatePhoneNumber(phone);
      const chat = await this.client.getChatById(`${normalizedPhone}@c.us`);
      
      await chat.sendMessage(message.toString());
      logger.info(`Message sent to ${normalizedPhone}`);
      
      return {
        success: true,
        phone: normalizedPhone,
        message,
        timestamp: new Date()
      };
    } catch (error) {
      const err = error as Error;
      logger.error(`Failed to send message to ${phone}:`, err);
      
      if (retryCount < this.config.MAX_RETRIES) {
        logger.info(`Retrying message to ${phone} (Attempt ${retryCount + 1}/${this.config.MAX_RETRIES})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.RETRY_DELAY));
        return this.sendMessage(phone, message, retryCount + 1);
      }
      
      return {
        success: false,
        phone,
        error: err.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Send media with an optional caption
   */
  public async sendMediaWithCaption(
    phone: string, 
    filePath: string, 
    caption: string, 
    type: 'document' | 'media', 
    retryCount: number = 0
  ): Promise<MessageResult> {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp client is not ready');
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const normalizedPhone = await this.validatePhoneNumber(phone);
      const chat = await this.client.getChatById(`${normalizedPhone}@c.us`);
      
      // Using MessageMedia from whatsapp-web.js
      const MessageMedia = require('whatsapp-web.js').MessageMedia;
      const media = MessageMedia.fromFilePath(filePath);
      await chat.sendMessage(media, { caption: caption || '' });
      
      logger.info(`${type} sent to ${normalizedPhone} with caption`);
      
      return {
        success: true,
        phone: normalizedPhone,
        message: caption,
        timestamp: new Date()
      };
    } catch (error) {
      const err = error as Error;
      logger.error(`Failed to send ${type} to ${phone}:`, err);
      
      if (retryCount < this.config.MAX_RETRIES) {
        logger.info(`Retrying ${type} to ${phone} (Attempt ${retryCount + 1}/${this.config.MAX_RETRIES})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.RETRY_DELAY));
        return this.sendMediaWithCaption(phone, filePath, caption, type, retryCount + 1);
      }
      
      return {
        success: false,
        phone,
        error: err.message,
        timestamp: new Date()
      };
    }
  }
}

export default MessageService;