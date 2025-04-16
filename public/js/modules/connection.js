/**
 * Connection Module
 * Handles WhatsApp connection functionality
 */

const Connection = (function() {
    // Module state
    const state = {
      connected: false
    };
    
    // Element references
    let startBtn, stopBtn, qrContainer, qrCode, senderNumber, saveSenderBtn;
    
    // Initialize the module
    function init() {
      // Get UI elements
      startBtn = document.getElementById('start-btn');
      stopBtn = document.getElementById('stop-btn');
      qrContainer = document.getElementById('qr-container');
      qrCode = document.getElementById('qr-code');
      senderNumber = document.getElementById('sender-number');
      saveSenderBtn = document.getElementById('save-sender-btn');
      
      // Set up event listeners
      if (startBtn) startBtn.addEventListener('click', startWhatsAppService);
      if (stopBtn) stopBtn.addEventListener('click', stopWhatsAppService);
      if (saveSenderBtn) saveSenderBtn.addEventListener('click', saveSenderDetails);
      if (senderNumber) senderNumber.addEventListener('input', validateSenderNumber);
      
      // Load sender details
      loadSenderDetails();
      
      // Set up socket listeners
      setupSocketListeners();
    }
    
    // Set up Socket.io event listeners
    function setupSocketListeners() {
      const socket = io();
      
      // WhatsApp QR code
      socket.on('qr', (data) => {
        showQRCode(data.qrDataUrl);
        UI.updateConnectionStatus('connecting');
        UI.showToast('QR Code received. Please scan with your WhatsApp', 'info');
      });
      
      // WhatsApp status updates
      socket.on('status', (data) => {
        handleStatusUpdate(data);
      });
    }
    
    // Validate sender phone number input
    function validateSenderNumber() {
      const phoneNumber = senderNumber.value.trim();
      const phoneRegex = /^\d+$/;
      
      if (phoneNumber === '') {
        senderNumber.classList.remove('valid', 'invalid');
        return false;
      }
      
      if (phoneRegex.test(phoneNumber) && phoneNumber.length >= 10 && phoneNumber.length <= 15) {
        senderNumber.classList.add('valid');
        senderNumber.classList.remove('invalid');
        return true;
      } else {
        senderNumber.classList.add('invalid');
        senderNumber.classList.remove('valid');
        return false;
      }
    }
  
    // Save sender details to local storage and update API
    function saveSenderDetails() {
      if (!validateSenderNumber()) {
        UI.showToast('Please enter a valid phone number', 'error');
        return;
      }
      
      const phoneNumber = senderNumber.value.trim();
      
      // Save to local storage
      localStorage.setItem('whatsapp_sender_number', phoneNumber);
      
      // Send to server
      fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          WHATSAPP_CLIENT_ID: phoneNumber
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          UI.showToast('Sender details saved successfully', 'success');
          UI.updateStatusMessage('Sender number configured: +' + phoneNumber, 'success');
        } else {
          UI.showToast(data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error saving sender details:', error);
        UI.showToast('Failed to save sender details', 'error');
      });
    }
  
    // Load sender details from local storage
    function loadSenderDetails() {
      const savedNumber = localStorage.getItem('whatsapp_sender_number');
      if (savedNumber && senderNumber) {
        senderNumber.value = savedNumber;
        validateSenderNumber();
        UI.updateStatusMessage('Sender number configured: +' + savedNumber, 'success');
      }
    }
    
    // Start the WhatsApp service
    function startWhatsAppService() {
      // Get the sender number if available
      const sender = senderNumber ? senderNumber.value.trim() : '';
      const savedSender = localStorage.getItem('whatsapp_sender_number') || '';
      
      fetch('/api/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderNumber: sender || savedSender
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (startBtn) startBtn.disabled = true;
          if (stopBtn) stopBtn.disabled = false;
          UI.updateStatusMessage('Connecting to WhatsApp...', 'warning');
        } else {
          UI.showToast(data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error starting WhatsApp service:', error);
        UI.showToast('Failed to start WhatsApp service', 'error');
      });
    }
    
    // Stop the WhatsApp service
    function stopWhatsAppService() {
      fetch('/api/stop', {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          if (startBtn) startBtn.disabled = false;
          if (stopBtn) stopBtn.disabled = true;
          UI.updateConnectionStatus('disconnected');
          UI.updateStatusMessage('WhatsApp disconnected', 'error');
          if (qrContainer) qrContainer.style.display = 'none';
          
          state.connected = false;
          
          // Notify other modules
          document.dispatchEvent(new CustomEvent('connection-status-changed', { 
            detail: { connected: false }
          }));
        } else {
          UI.showToast(data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error stopping WhatsApp service:', error);
        UI.showToast('Failed to stop WhatsApp service', 'error');
      });
    }
    
    // Handle WhatsApp status updates
    function handleStatusUpdate(data) {
      switch (data.status) {
        case 'authenticated':
          UI.updateConnectionStatus('connecting');
          UI.updateStatusMessage('WhatsApp authenticated, initializing...', 'warning');
          if (qrContainer) qrContainer.style.display = 'none';
          break;
          
        case 'ready':
          UI.updateConnectionStatus('connected');
          UI.updateStatusMessage('WhatsApp connected and ready to send messages', 'success');
          if (startBtn) startBtn.disabled = true;
          if (stopBtn) stopBtn.disabled = false;
          state.connected = true;
          
          // Notify other modules
          document.dispatchEvent(new CustomEvent('connection-status-changed', { 
            detail: { connected: true }
          }));
          
          UI.showToast('WhatsApp connected successfully', 'success');
          break;
          
        case 'disconnected':
          UI.updateConnectionStatus('disconnected');
          UI.updateStatusMessage(`WhatsApp disconnected: ${data.reason || 'Unknown reason'}`, 'error');
          if (startBtn) startBtn.disabled = false;
          if (stopBtn) stopBtn.disabled = true;
          state.connected = false;
          
          // Notify other modules
          document.dispatchEvent(new CustomEvent('connection-status-changed', { 
            detail: { connected: false }
          }));
          
          UI.showToast('WhatsApp disconnected', 'error');
          break;
          
        case 'auth_failure':
          UI.updateConnectionStatus('disconnected');
          UI.updateStatusMessage(`Authentication failed: ${data.message}`, 'error');
          if (startBtn) startBtn.disabled = false;
          if (stopBtn) stopBtn.disabled = true;
          UI.showToast('WhatsApp authentication failed', 'error');
          break;
      }
    }
    
    // Show QR code for WhatsApp connection
    function showQRCode(qrDataUrl) {
      if (qrContainer) qrContainer.style.display = 'flex';
      if (qrCode) qrCode.innerHTML = `<img src="${qrDataUrl}" alt="WhatsApp QR Code">`;
      UI.updateStatusMessage('Please scan the QR code with your WhatsApp app', 'warning');
    }
    
    // Get connection status
    function isConnected() {
      return state.connected;
    }
    
    // Public API
    return {
      init,
      isConnected
    };
  })();
  
  // Initialize Connection module when DOM is loaded
  document.addEventListener('DOMContentLoaded', Connection.init);