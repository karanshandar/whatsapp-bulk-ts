/**
 * Configuration management for WhatsApp Bulk Messenger
 * Handles loading, saving, and providing default configurations
 */

import fs from 'fs';
import path from 'path';
import { AppConfig } from '../types/config.types';
import { logger } from '../utils/logger';

// Default configuration
const defaultConfig: AppConfig = {
  DELAY_BETWEEN_MESSAGES: 3000, // 3 seconds delay between messages
  EXCEL_FILE: '', // Path to Excel file (will be set when uploaded)
  STATUS_FILE: 'message_status.json',
  SUPPORTED_TYPES: ['message', 'document', 'media'],
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds delay before retry
  DATA_DIR: path.join(process.cwd(), 'data'),
  WHATSAPP_CLIENT_ID: '' // WhatsApp sender number
};

// Path to config file
const configPath = path.join(process.cwd(), 'config.json');

/**
 * Load configuration from file or use defaults
 */
export const getConfig = (): AppConfig => {
  let config: AppConfig = { ...defaultConfig };
  
  // Override with environment variables if present
  Object.keys(defaultConfig).forEach(key => {
    const typedKey = key as keyof AppConfig;
    if (process.env[key]) {
      const value = process.env[key];
      
      if (value) {
        if (typeof defaultConfig[typedKey] === 'number') {
          // Handle numeric properties
          config = {
            ...config,
            [typedKey]: parseInt(value, 10)
          };
        } else if (Array.isArray(defaultConfig[typedKey])) {
          // Handle array properties
          config = {
            ...config,
            [typedKey]: value.split(',')
          };
        } else {
          // Handle string properties
          config = {
            ...config,
            [typedKey]: value
          };
        }
      }
    }
  });
  
  // Try to load from config file if it exists
  if (fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...fileConfig };
      logger.debug('Configuration loaded from config.json');
    } catch (error) {
      logger.error('Failed to load configuration file:', error);
    }
  } else {
    // Create default config file if it doesn't exist
    try {
      if (!fs.existsSync(path.dirname(configPath))) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      logger.info('Default configuration file created');
    } catch (error) {
      logger.error('Failed to create default configuration file:', error);
    }
  }
  
  // Ensure required directories exist
  ensureDirectories(config);
  
  return config;
};

/**
 * Save configuration to file
 */
export const saveConfig = (config: AppConfig): boolean => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.debug('Configuration saved to config.json');
    return true;
  } catch (error) {
    logger.error('Failed to save configuration:', error);
    return false;
  }
};

/**
 * Ensure all required directories exist
 */
const ensureDirectories = (config: AppConfig): void => {
  if (!fs.existsSync(config.DATA_DIR)) {
    fs.mkdirSync(config.DATA_DIR, { recursive: true });
  }
};