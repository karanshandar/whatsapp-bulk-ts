/**
 * Excel service type definitions
 */

export interface ExcelRow {
    Number: string;
    Type: 'message' | 'document' | 'media';
    'Message/Caption': string;
    Link?: string;
    Status?: string;
  }
  
  export interface ValidationResult {
    valid: boolean;
    message: string;
    errors: string[];
  }