/**
 * Excel Service
 * Handles all Excel-related functionality including file loading,
 * validation, and status updates.
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { ExcelRow, ValidationResult } from '../types/excel.types';

// Define the default sheet name to look for
const DEFAULT_SHEET_NAME = 'WhatsApp Messages';

export class ExcelService {
  private workbookCache: XLSX.WorkBook | null = null;
  private cacheFilePath: string | null = null;
  private statusColumnIndex: number = -1;
  private pendingWrites: number = 0;
  private writeTimer: NodeJS.Timeout | null = null;

  /**
   * Load and parse Excel file
   */
  public async loadExcelFile(filePath: string): Promise<ExcelRow[]> {
    try {
      logger.info(`Loading Excel file: ${filePath}`);
      
      // Validate file existence
      if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
      }
      
      // Use cached workbook if available
      let workbook: XLSX.WorkBook;
      
      if (this.workbookCache && this.cacheFilePath === filePath) {
        workbook = this.workbookCache;
      } else {
        // Read with optimized options to reduce memory usage
        const options: XLSX.ParsingOptions = {
          cellDates: true,
          cellNF: false,  // Skip number formatting to save memory
          cellStyles: false  // Skip cell styles to save memory
        };
        
        workbook = XLSX.readFile(filePath, options);
        this.workbookCache = workbook;
        this.cacheFilePath = filePath;
        this.statusColumnIndex = -1; // Reset for new file
      }
      
      // Try to find the default sheet name
      let sheetName = DEFAULT_SHEET_NAME;
      
      // Check if the default sheet exists
      if (!workbook.SheetNames.includes(sheetName)) {
        logger.warn(`Default sheet "${DEFAULT_SHEET_NAME}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
        
        // If not, use the first sheet
        sheetName = workbook.SheetNames[0];
        logger.info(`Using first sheet instead: "${sheetName}"`);
      } else {
        logger.info(`Using sheet: "${sheetName}"`);
      }
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Ensure Status column exists
      this.ensureStatusColumn(workbook, worksheet, filePath);
      
      // Convert sheet to JSON
      const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
      
      logger.info(`Excel file loaded with ${data.length} rows from sheet "${sheetName}"`);
      return data;
    } catch (error) {
      const err = error as Error;
      logger.error('Excel loading failed:', err);
      throw err;
    }
  }

  /**
   * Validate Excel file structure
   */
  public async validateExcelStructure(filePath: string): Promise<ValidationResult> {
    try {
      logger.info(`Validating Excel structure: ${filePath}`);
      
      // Validate file existence
      if (!fs.existsSync(filePath)) {
        return {
          valid: false,
          message: 'Excel file not found',
          errors: [`File not found: ${filePath}`]
        };
      }
      
      // Read with minimal options for validation
      const options: XLSX.ParsingOptions = {
        cellNF: false,
        cellStyles: false
      };
      
      const workbook = XLSX.readFile(filePath, options);
      
      // Validate sheet existence
      if (workbook.SheetNames.length === 0) {
        return {
          valid: false,
          message: 'Excel file does not contain any sheets',
          errors: ['No sheets found in the Excel file']
        };
      }
      
      // Try to use the default sheet name
      let sheetName = DEFAULT_SHEET_NAME;
      
      // Check if the default sheet exists
      if (!workbook.SheetNames.includes(sheetName)) {
        // If not, use the first sheet
        sheetName = workbook.SheetNames[0];
        logger.info(`Default sheet "${DEFAULT_SHEET_NAME}" not found. Using first sheet: "${sheetName}"`);
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
      
      if (data.length === 0) {
        return {
          valid: false,
          message: `Sheet "${sheetName}" does not contain any data`,
          errors: [`No data rows found in sheet "${sheetName}"`]
        };
      }
      
      // Validate required columns
      const requiredColumns = ['Number', 'Type', 'Message/Caption'];
      const firstRow = data[0];
      const missingColumns: string[] = [];
      
      for (const column of requiredColumns) {
        if (!(column in firstRow)) {
          missingColumns.push(column);
        }
      }
      
      if (missingColumns.length > 0) {
        return {
          valid: false,
          message: 'Excel file is missing required columns',
          errors: [`Missing columns: ${missingColumns.join(', ')}`]
        };
      }
      
      // Validate data types and required fields
      const errors: string[] = [];
      const MAX_ERRORS = 20; // Limit number of errors to avoid overwhelming UI
      
      for (let index = 0; index < data.length && errors.length < MAX_ERRORS; index++) {
        const row = data[index];
        const rowNum = index + 2; // Excel is 1-indexed with header row
        
        // Validate phone number
        if (!row.Number) {
          errors.push(`Row ${rowNum}: Phone number is required`);
        } else {
          // Clean number for validation
          const cleaned = String(row.Number).replace(/\D/g, '');
          
          // Simple validation for phone numbers
          if (cleaned.length < 10 || cleaned.length > 15) {
            errors.push(`Row ${rowNum}: Invalid phone number format: ${row.Number}. Should be 10-15 digits.`);
          }
        }
        
        // Validate message type
        if (!row.Type) {
          errors.push(`Row ${rowNum}: Message type is required`);
        } else if (!['message', 'document', 'media'].includes(row.Type)) {
          errors.push(`Row ${rowNum}: Invalid message type: ${row.Type}. Must be "message", "document", or "media"`);
        }
        
        // Validate message/caption based on type
        if (row.Type === 'message' && !row['Message/Caption']) {
          errors.push(`Row ${rowNum}: Message content is required for text messages`);
        }
        
        // Validate file path for document/media
        if ((row.Type === 'document' || row.Type === 'media') && !row.Link) {
          errors.push(`Row ${rowNum}: File path is required for ${row.Type} type`);
        } else if ((row.Type === 'document' || row.Type === 'media') && row.Link) {
          // Only check first 10 files to avoid excessive I/O
          if (index < 10) {
            if (!fs.existsSync(row.Link)) {
              errors.push(`Row ${rowNum}: File not found: ${row.Link}`);
            }
          }
        }
      }
      
      if (errors.length > 0) {
        // If we hit the error limit, add a message
        if (errors.length === MAX_ERRORS && data.length > MAX_ERRORS) {
          errors.push(`...and possibly more errors. Showing first ${MAX_ERRORS} only.`);
        }
        
        return {
          valid: false,
          message: 'Excel data validation failed',
          errors
        };
      }
      
      return {
        valid: true,
        message: `Excel structure is valid (using sheet: ${sheetName})`,
        errors: []
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Excel validation failed:', err);
      return {
        valid: false,
        message: `Excel validation error: ${err.message}`,
        errors: [err.message]
      };
    }
  }

  /**
   * Ensure Status column exists in the Excel file
   */
  private ensureStatusColumn(workbook: XLSX.WorkBook, worksheet: XLSX.WorkSheet, filePath: string): void {
    try {
      const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
      
      // Check if Status column exists
      if (this.statusColumnIndex === -1) {
        for (let i = 0; i <= range.e.c; i++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
          const cell = worksheet[cellAddress];
          if (cell && cell.v === 'Status') {
            this.statusColumnIndex = i;
            break;
          }
        }
      }

      // If no Status column found, add it
      if (this.statusColumnIndex === -1) {
        this.statusColumnIndex = range.e.c + 1;
        const statusColumnLetter = XLSX.utils.encode_col(this.statusColumnIndex);
        
        // Add header
        worksheet[`${statusColumnLetter}1`] = { v: 'Status', t: 's' };
        
        // Add status column to all rows
        for (let row = 2; row <= range.e.r + 1; row++) {
          worksheet[`${statusColumnLetter}${row}`] = {
            v: 'pending',
            t: 's'
          };
        }

        // Update worksheet reference
        worksheet['!ref'] = XLSX.utils.encode_range({
          s: { c: 0, r: 0 },
          e: { c: this.statusColumnIndex, r: range.e.r }
        });
        
        // Save the updated file
        XLSX.writeFile(workbook, filePath);
        logger.info('Status column added to Excel file');
      }
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to ensure Status column:', err);
    }
  }

  /**
   * Update status in Excel file for a specific row
   */
  public updateExcelStatus(filePath: string, rowIndex: number, status: string, errorMessage: string = ''): boolean {
    try {
      // Use cached workbook if possible
      let workbook: XLSX.WorkBook;
      let worksheet: XLSX.WorkSheet;
      
      if (this.workbookCache && this.cacheFilePath === filePath) {
        workbook = this.workbookCache;
        
        // Try to find the default sheet name
        let sheetName = DEFAULT_SHEET_NAME;
        
        // Check if the default sheet exists
        if (!workbook.SheetNames.includes(sheetName)) {
          // If not, use the first sheet
          sheetName = workbook.SheetNames[0];
        }
        
        worksheet = workbook.Sheets[sheetName];
      } else {
        workbook = XLSX.readFile(filePath);
        
        // Try to find the default sheet name
        let sheetName = DEFAULT_SHEET_NAME;
        
        // Check if the default sheet exists
        if (!workbook.SheetNames.includes(sheetName)) {
          // If not, use the first sheet
          sheetName = workbook.SheetNames[0];
        }
        
        worksheet = workbook.Sheets[sheetName];
        this.workbookCache = workbook;
        this.cacheFilePath = filePath;
        this.statusColumnIndex = -1; // Reset column index for new file
      }
      
      // Find Status column if not cached
      if (this.statusColumnIndex === -1) {
        const range = XLSX.utils.decode_range(worksheet['!ref'] as string);
        
        for (let i = 0; i <= range.e.c; i++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
          const cell = worksheet[cellAddress];
          if (cell && cell.v === 'Status') {
            this.statusColumnIndex = i;
            break;
          }
        }
        
        if (this.statusColumnIndex === -1) {
          throw new Error('Status column not found');
        }
      }
      
      // Update status
      const statusColumnLetter = XLSX.utils.encode_col(this.statusColumnIndex);
      const cellAddress = `${statusColumnLetter}${rowIndex}`;
      const statusText = errorMessage ? `Failed: ${errorMessage}` : status;
      
      worksheet[cellAddress] = {
        v: statusText,
        t: 's'
      };
      
      // Track pending writes and use debounced save
      this.pendingWrites++;
      
      // Save file after a batch of updates or timeout
      if (this.pendingWrites >= 10) {
        this.saveWorkbook(workbook, filePath);
      } else if (!this.writeTimer) {
        // Set a timer to save if no more updates come in
        this.writeTimer = setTimeout(() => {
          if (this.pendingWrites > 0) {
            this.saveWorkbook(workbook, filePath);
          }
        }, 1000); // 1 second debounce
      }
      
      return true;
    } catch (error) {
      const err = error as Error;
      logger.error(`Failed to update Excel status for row ${rowIndex}:`, err);
      return false;
    }
  }
  
  /**
   * Save workbook to file and reset counters
   */
  private saveWorkbook(workbook: XLSX.WorkBook, filePath: string): void {
    try {
      // Save the workbook
      XLSX.writeFile(workbook, filePath);
      logger.debug(`Saved Excel file with ${this.pendingWrites} pending changes`);
      
      // Reset counters
      this.pendingWrites = 0;
      
      // Clear timer
      if (this.writeTimer) {
        clearTimeout(this.writeTimer);
        this.writeTimer = null;
      }
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to save workbook:', err);
    }
  }
  
  /**
   * Clean up resources - should be called on shutdown
   */
  public cleanup(): void {
    // Save any pending changes
    if (this.workbookCache && this.cacheFilePath && this.pendingWrites > 0) {
      this.saveWorkbook(this.workbookCache, this.cacheFilePath);
    }
    
    // Clear cache
    this.workbookCache = null;
    this.cacheFilePath = null;
    
    // Clear timer
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    
    logger.debug('Excel service cleaned up');
  }
}

export default ExcelService;
