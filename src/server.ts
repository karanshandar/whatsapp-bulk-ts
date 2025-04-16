/**
 * WhatsApp Bulk Messenger
 * Main server file that initializes Express, Socket.IO and API routes
 */

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import app from './app';
import { logger } from './utils/logger';
import { createExampleTemplate } from './utils/template-generator';
import WhatsAppService from './services/whatsapp.service';

// Load environment variables
dotenv.config();

// Initialize HTTP server with Express
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Ensure required directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize services
const whatsAppService = new WhatsAppService(io);

// Ensure example template exists
try {
  createExampleTemplate();
  logger.info('Example Excel template created successfully');
} catch (error) {
  logger.error('Failed to create example template:', error);
}

// Socket.io connection
io.on('connection', (socket) => {
  logger.info('Client connected');
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`WhatsApp Bulk Messenger server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  try {
    await whatsAppService.stop();
    whatsAppService.cleanup();
  } catch (error) {
    const err = error as Error;
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
});

// Export for use in routes
export { io, whatsAppService };