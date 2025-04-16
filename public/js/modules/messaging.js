/**
 * Messaging Module
 * Handles WhatsApp messaging functionality
 */

const Messaging = (function() {
    // Module state
    const state = {
      processing: false
    };
    
    // Element references
    let startMessagingBtn, stopMessagingBtn, excelStatus, progressBar, progressText;
    
    // Initialize the module
    function init() {
      // Get UI elements
      startMessagingBtn = document.getElementById('start-messaging-btn');
      stopMessagingBtn = document.getElementById('stop-messaging-btn');
      excelStatus = document.getElementById('excel-status');
      progressBar = document.getElementById('progress-bar');
      progressText = document.getElementById('progress-text');
      
      // Set up event listeners
      if (startMessagingBtn) startMessagingBtn.addEventListener('click', startMessaging);
      if (stopMessagingBtn) stopMessagingBtn.addEventListener('click', stopMessaging);
      
      // Update Excel status
      if (excelStatus) {
        Excel.updateExcelStatus(excelStatus);
      }
      
      // Listen for connection status changes
      document.addEventListener('connection-status-changed', updateMessagingControls);
      document.addEventListener('excel-status-changed', updateMessagingControls);
      
      // Set up socket listeners
      setupSocketListeners();
      
      // Initial update of messaging controls
      updateMessagingControls();
    }
    
    // Set up Socket.io event listeners
    function setupSocketListeners() {
      const socket = io();
      
      // Message status updates
      socket.on('message_status', (data) => {
        logMessageStatus(data);
      });
      
      // Row status updates
      socket.on('row_status', (data) => {
        updateRowStatus(data);
      });
      
      // Process start
      socket.on('process_start', (data) => {
        startProcessingUI(data);
      });
      
      // Process progress
      socket.on('process_progress', (data) => {
        updateProgressUI(data);
      });
      
      // Process complete
      socket.on('process_complete', (data) => {
        completeProcessingUI(data);
      });
      
      // Process error
      socket.on('process_error', (data) => {
        handleProcessError(data);
      });
      
      // Process stopped
      socket.on('process_stopped', (data) => {
        handleProcessStopped(data);
      });
    }
    
    // Update messaging controls based on application state
    function updateMessagingControls(event) {
      const isConnected = Connection.isConnected();
      const isExcelUploaded = Excel.isExcelUploaded();
      
      if (startMessagingBtn) {
        startMessagingBtn.disabled = !(isConnected && isExcelUploaded && !state.processing);
      }
      
      if (stopMessagingBtn) {
        stopMessagingBtn.disabled = !(isConnected && state.processing);
      }
    }
    
    // Start the messaging process
    function startMessaging() {
      fetch('/api/start-messaging', {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          state.processing = true;
          updateMessagingControls();
          UI.clearMessageLog();
          UI.logMessage('Starting messaging process...', 'info');
          UI.showToast('Started messaging process', 'success');
        } else {
          UI.showToast(data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error starting messaging:', error);
        UI.showToast('Failed to start messaging process', 'error');
      });
    }
    
    // Stop the messaging process
    function stopMessaging() {
      fetch('/api/stop-messaging', {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          UI.logMessage('Stopping messaging process...', 'warning');
          if (stopMessagingBtn) stopMessagingBtn.disabled = true;
          UI.showToast('Stopping messaging process...', 'warning');
        } else {
          UI.showToast(data.message, 'error');
        }
      })
      .catch(error => {
        console.error('Error stopping messaging:', error);
        UI.showToast('Failed to stop messaging process', 'error');
      });
    }
    
    // Log message status updates
    function logMessageStatus(data) {
      let message = '';
      
      switch (data.status) {
        case 'sent':
          message = `Message sent to ${data.phone}${data.type ? ` (${data.type})` : ''}`;
          UI.logMessage(message, 'success');
          break;
          
        case 'failed':
          message = `Failed to send to ${data.phone}: ${data.error}`;
          UI.logMessage(message, 'error');
          break;
          
        case 'retrying':
          message = `Retrying message to ${data.phone} (Attempt ${data.attempt}/${data.maxRetries})`;
          UI.logMessage(message, 'warning');
          break;
      }
    }
    
    // Update row status in the UI
    function updateRowStatus(data) {
      let message = '';
      
      switch (data.status) {
        case 'processing':
          message = `Processing row ${data.row}`;
          UI.logMessage(message, 'info');
          break;
          
        case 'sent':
          message = `Row ${data.row} processed successfully`;
          //UI.logMessage(message, 'success'); // Uncomment if you want detailed logs
          break;
          
        case 'failed':
          message = `Row ${data.row} failed: ${data.error}`;
          UI.logMessage(message, 'error');
          break;
      }
    }
    
    // Start the processing UI
    function startProcessingUI(data) {
      state.processing = true;
      updateMessagingControls();
      
      if (progressBar) progressBar.style.width = '0%';
      if (progressText) progressText.textContent = `0/${data.total} messages processed (0%)`;
      
      UI.logMessage(`Starting to process ${data.total} messages`, 'info');
    }
    
    // Update the progress UI
    function updateProgressUI(data) {
      UI.updateProgress(data.current, data.total, data.percent);
    }
    
    // Complete the processing UI
    function completeProcessingUI(data) {
      state.processing = false;
      updateMessagingControls();
      
      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = `${data.total}/${data.total} messages processed (100%)`;
      
      UI.logMessage(`Processing complete: ${data.success} successful, ${data.failed} failed`, 'success');
      UI.showToast(`Processing complete: ${data.success} successful, ${data.failed} failed`, 'success');
      
      // Refresh statistics
      document.dispatchEvent(new CustomEvent('refresh-statistics'));
    }
    
    // Handle processing errors
    function handleProcessError(data) {
      state.processing = false;
      updateMessagingControls();
      
      UI.logMessage(`Error: ${data.error}`, 'error');
      UI.showToast(`Processing error: ${data.error}`, 'error');
    }
    
    // Handle process stopped event
    function handleProcessStopped(data) {
      state.processing = false;
      updateMessagingControls();
      
      UI.logMessage(`Processing stopped: ${data.processed}/${data.total} messages processed`, 'warning');
      UI.showToast(`Processing stopped: ${data.success} successful, ${data.failed} failed`, 'warning');
      
      // Refresh statistics
      document.dispatchEvent(new CustomEvent('refresh-statistics'));
    }
    
    // Public API
    return {
      init
    };
  })();
  
  // Initialize Messaging module when DOM is loaded
  document.addEventListener('DOMContentLoaded', Messaging.init);