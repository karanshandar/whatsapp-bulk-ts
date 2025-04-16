/**
 * Error Handler Middleware
 * Provides consistent error handling for API routes
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Interface for structured API errors
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Middleware to handle API errors consistently
 */
export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  
  // Log the error
  logger.error(`API Error [${statusCode}]: ${err.message}`, {
    path: req.path,
    method: req.method,
    body: req.body,
    stack: err.stack
  });
  
  // Send appropriate response
  res.status(statusCode).json({
    success: false,
    message: err.message,
    code: err.code || 'INTERNAL_SERVER_ERROR'
  });
};

/**
 * Create an API error with status code
 */
export const createApiError = (message: string, statusCode = 400, code?: string): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
};

export default errorHandler;