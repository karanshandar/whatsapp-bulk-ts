const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'WhatsAppBulkMessenger',
  script: path.join(__dirname, 'dist', 'server.js')
});

// Listen for uninstall events
svc.on('uninstall', function() {
  console.log('Service uninstalled successfully!');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

// Uninstall the service
console.log('Uninstalling WhatsApp Bulk Messenger Windows service...');
svc.uninstall();