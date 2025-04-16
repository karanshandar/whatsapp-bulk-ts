/**
 * Configuration type definitions for WhatsApp Bulk Messenger
 */

export interface AppConfig {
    DELAY_BETWEEN_MESSAGES: number;
    EXCEL_FILE: string;
    STATUS_FILE: string;
    SUPPORTED_TYPES: string[];
    MAX_RETRIES: number;
    RETRY_DELAY: number;
    DATA_DIR: string;
    WHATSAPP_CLIENT_ID: string;
  }
  
  export interface MessageStatus {
    [key: string]: {
      status: 'pending' | 'sent' | 'failed';
      timestamp: string;
      error?: string;
    };
  }