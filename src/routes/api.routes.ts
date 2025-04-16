/**
 * API Routes for WhatsApp Bulk Messenger
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { UploadedFile } from 'express-fileupload';
import { logger } from '../utils/logger';
import { getConfig, saveConfig } from '../config/config';
import { whatsAppService } from '../server';
import ExcelService from '../services/excel.service';
import { createExampleTemplate } from '../utils/template-generator';

const router = express.Router();
const excelService = new ExcelService();

/**
 * Start WhatsApp service
 */
router.post('/start', async (req, res) => {
  try {
    // Get sender number from request if available
    const senderNumber = req.body.senderNumber || '';
    
    // If a sender number is provided, update the config
    if (senderNumber) {
      const config = getConfig();
      config.WHATSAPP_CLIENT_ID = senderNumber;
      saveConfig(config);
      
      // Initialize WhatsApp service with the updated client ID
      whatsAppService.setClientId(senderNumber);
    }
    
    whatsAppService.start();
    res.json({ success: true, message: 'WhatsApp service started' });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to start WhatsApp service:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Stop WhatsApp service
 */
router.post('/stop', async (req, res) => {
  try {
    await whatsAppService.stop();
    res.json({ success: true, message: 'WhatsApp service stopped' });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to stop WhatsApp service:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Upload Excel file
 */
router.post('/upload-excel', async (req, res) => {
  try {
    if (!req.files || !req.files.excel) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const excelFile = req.files.excel as UploadedFile;
    const filename = `template_${Date.now()}.xlsx`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, filename);

    // Move the file to uploads directory
    await excelFile.mv(filePath);

    // Validate the Excel file
    const validation = await excelService.validateExcelStructure(filePath);
    if (!validation.valid) {
      fs.unlinkSync(filePath); // Delete invalid file
      return res.status(400).json({ 
        success: false, 
        message: validation.message,
        errors: validation.errors 
      });
    }

    // Update configuration with new Excel file path
    const config = getConfig();
    config.EXCEL_FILE = filePath;
    saveConfig(config);

    res.json({ 
      success: true, 
      message: 'Excel file uploaded and validated successfully',
      filename: filename
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Excel upload failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Validate Excel structure
 */
router.post('/validate-excel', async (req, res) => {
  try {
    if (!req.files || !req.files.excel) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const excelFile = req.files.excel as UploadedFile;
    const tempPath = path.join(process.cwd(), 'uploads', 'temp', `temp_${Date.now()}.xlsx`);

    // Save file temporarily
    await excelFile.mv(tempPath);

    // Validate the Excel file
    const validation = await excelService.validateExcelStructure(tempPath);
    
    // Clean up temp file
    fs.unlinkSync(tempPath);

    if (validation.valid) {
      res.json({ valid: true });
    } else {
      res.json({ 
        valid: false, 
        message: validation.message,
        errors: validation.errors 
      });
    }
  } catch (error) {
    const err = error as Error;
    logger.error('Excel validation failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Start sending messages
 */
router.post('/start-messaging', async (req, res) => {
  try {
    const config = getConfig();
    if (!config.EXCEL_FILE || !fs.existsSync(config.EXCEL_FILE)) {
      return res.status(400).json({ 
        success: false, 
        message: 'No Excel file has been uploaded or file does not exist' 
      });
    }

    if (!whatsAppService.isReady) {
      return res.status(400).json({ 
        success: false, 
        message: 'WhatsApp client is not ready. Please connect first.' 
      });
    }

    // Start processing in background
    whatsAppService.processExcelFile(config.EXCEL_FILE)
      .catch(error => {
        const err = error as Error;
        logger.error('Excel processing failed:', err);
      });

    res.json({ success: true, message: 'Started messaging process' });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to start messaging:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Stop messaging process
 */
router.post('/stop-messaging', async (req, res) => {
  try {
    whatsAppService.stopProcessing();
    res.json({ success: true, message: 'Messaging process stopped' });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to stop messaging:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get application settings
 */
router.get('/settings', (req, res) => {
  try {
    const config = getConfig();
    res.json({ 
      success: true, 
      settings: {
        DELAY_BETWEEN_MESSAGES: config.DELAY_BETWEEN_MESSAGES,
        MAX_RETRIES: config.MAX_RETRIES,
        RETRY_DELAY: config.RETRY_DELAY,
        WHATSAPP_CLIENT_ID: config.WHATSAPP_CLIENT_ID || ''
      } 
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to get settings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Update settings
 */
router.post('/settings', (req, res) => {
  try {
    const config = getConfig();
    
    // Update settings from request
    if (req.body.DELAY_BETWEEN_MESSAGES) {
      config.DELAY_BETWEEN_MESSAGES = parseInt(req.body.DELAY_BETWEEN_MESSAGES);
    }
    if (req.body.MAX_RETRIES) {
      config.MAX_RETRIES = parseInt(req.body.MAX_RETRIES);
    }
    if (req.body.RETRY_DELAY) {
      config.RETRY_DELAY = parseInt(req.body.RETRY_DELAY);
    }
    if (req.body.WHATSAPP_CLIENT_ID) {
      config.WHATSAPP_CLIENT_ID = req.body.WHATSAPP_CLIENT_ID;
    }
    
    saveConfig(config);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to update settings:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Download template
 */
router.get('/download-template', (req, res) => {
  const templatePath = path.join(process.cwd(), 'public', 'template_example.xlsx');
  
  if (fs.existsSync(templatePath)) {
    res.download(templatePath, 'whatsapp_message_template.xlsx');
  } else {
    // If template doesn't exist, create it on the fly
    try {
      const newPath = createExampleTemplate();
      res.download(newPath, 'whatsapp_message_template.xlsx');
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to create template for download:', err);
      res.status(500).send('Failed to generate template file');
    }
  }
});

export default router;