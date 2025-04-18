const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'WhatsAppBulkMessenger',
  description: 'WhatsApp Bulk Messenger Service',
  script: path.join(__dirname, 'dist', 'server.js'),
  nodeOptions: [],
  workingDirectory: __dirname,
  // Allow service to interact with desktop (important for browser automation)
  allowServiceInteraction: true
});

// Listen for service install events
svc.on('install', function() {
  console.log('Service installed successfully!');
  svc.start();
});

svc.on('start', function() {
  console.log('Service started successfully!');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

// Install the service
console.log('Installing WhatsApp Bulk Messenger as a Windows service...');
svc.install();