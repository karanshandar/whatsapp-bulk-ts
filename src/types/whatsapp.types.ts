/**
 * WhatsApp service type definitions
 */

export interface MessageResult {
    success: boolean;
    phone: string;
    message?: string;
    error?: string;
    timestamp: Date;
  }
  
  export interface ProcessResult {
    total: number;
    success: number;
    failed: number;
    stopped?: boolean;
  }
  
  export interface StatusUpdate {
    status: 'authenticated' | 'ready' | 'disconnected' | 'auth_failure';
    message?: string;
    reason?: string;
  }
  
  export interface MessageStatusEvent {
    phone: string;
    status: 'sent' | 'failed' | 'retrying';
    timestamp?: Date;
    type?: string;
    error?: string;
    attempt?: number;
    maxRetries?: number;
  }