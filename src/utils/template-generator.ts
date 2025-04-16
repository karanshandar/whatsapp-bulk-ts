/**
 * Template Generator
 * Creates an example Excel template for WhatsApp Bulk Messenger
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Create an example Excel template
 */
export const createExampleTemplate = (): string => {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const templatePath = path.join(publicDir, 'template_example.xlsx');
    
    // Sample data
    const data = [
      {
        'Number': '919876543210',
        'Type': 'message',
        'Message/Caption': 'Hello! This is a sample text message.',
        'Link': ''
      },
      {
        'Number': '919876543211',
        'Type': 'document',
        'Message/Caption': 'Please find the attached document.',
        'Link': 'C:/Documents/sample.pdf'
      },
      {
        'Number': '919876543212',
        'Type': 'media',
        'Message/Caption': 'Check out this image!',
        'Link': 'C:/Images/sample.jpg'
      },
      {
        'Number': '919876543213',
        'Type': 'message',
        'Message/Caption': 'Another sample message with emoji 😊',
        'Link': ''
      }
    ];
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add column widths for better readability
    worksheet['!cols'] = [
      { wch: 15 },  // Number
      { wch: 10 },  // Type
      { wch: 40 },  // Message/Caption
      { wch: 30 }   // Link
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'WhatsApp Messages');
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write to file
    XLSX.writeFile(workbook, templatePath);
    
    logger.info(`Example template created at: ${templatePath}`);
    return templatePath;
  } catch (error) {
    logger.error('Failed to create example template:', error);
    throw error;
  }
};