/**
 * Express application setup for WhatsApp Bulk Messenger
 */

import express from 'express';
import path from 'path';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import { logger } from './utils/logger';
import apiRoutes from './routes/api.routes';
import errorHandler from './middleware/error-handler';
import { createExampleTemplate } from './utils/template-generator';

// Initialize Express app
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: path.join(__dirname, '../uploads/temp')
}));

// Ensure required directories exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const tempDir = path.join(uploadsDir, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

// Special route for template download
app.get('/download-template', (req, res) => {
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

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// Fallback route for 404s
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

export default app;