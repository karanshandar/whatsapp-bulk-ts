/**
 * UI Module
 * Handles common UI operations and toast notifications
 */

const UI = (function() {
    // Element references
    let toastContainer;
  
    // Initialize UI elements
    function init() {
      toastContainer = document.getElementById('toast-container');
      
      // Initialize accordions if they exist
      const accordionHeaders = document.querySelectorAll('.accordion-header');
      if (accordionHeaders.length > 0) {
        initAccordion(accordionHeaders);
      }
    }
  
    // Initialize accordion functionality
    function initAccordion(headers) {
      headers.forEach(header => {
        header.addEventListener('click', toggleAccordion);
      });
    }
  
    // Toggle accordion
    function toggleAccordion(event) {
      const accordionItem = event.currentTarget.parentElement;
      accordionItem.classList.toggle('active');
    }
  
    // Show a toast notification
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      let icon = '';
      switch (type) {
        case 'success':
          icon = '<i class="fas fa-check-circle toast-icon"></i>';
          break;
        case 'error':
          icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
          break;
        case 'warning':
          icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
          break;
        case 'info':
          icon = '<i class="fas fa-info-circle toast-icon"></i>';
          break;
      }
      
      toast.innerHTML = `
        ${icon}
        <div class="toast-content">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
      `;
      
      toastContainer.appendChild(toast);
      
      // Remove after 4 seconds
      setTimeout(() => {
        toast.remove();
      }, 4000);
    }
  
    // Switch to a different tab
    function switchTab(tabId) {
      const navItems = document.querySelectorAll('.nav-menu li');
      const tabContents = document.querySelectorAll('.tab-content');
      
      // Update navigation items
      navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      
      // Update tab content visibility
      tabContents.forEach(content => {
        if (content.id === tabId) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
      
      // Additional actions when switching to specific tabs
      if (tabId === 'stats') {
        const event = new CustomEvent('refresh-statistics');
        document.dispatchEvent(event);
      }
    }
  
    // Update connection status indicator
    function updateConnectionStatus(status) {
      const statusIndicator = document.querySelector('.status-indicator');
      const statusText = document.querySelector('.status-text');
      
      if (!statusIndicator || !statusText) return;
      
      statusIndicator.className = 'status-indicator';
      statusIndicator.classList.add(status);
      
      switch (status) {
        case 'disconnected':
          statusText.textContent = 'Disconnected';
          break;
        case 'connecting':
          statusText.textContent = 'Connecting...';
          break;
        case 'connected':
          statusText.textContent = 'Connected';
          break;
      }
    }
  
    // Update the status message
    function updateStatusMessage(message, type = '') {
      const statusMessage = document.getElementById('status-message');
      if (!statusMessage) return;
      
      statusMessage.className = 'status-message';
      if (type) {
        statusMessage.classList.add(type);
      }
      statusMessage.innerHTML = `<p>${message}</p>`;
    }
  
    // Add a message to the message log
    function logMessage(message, type = 'info') {
      const messageLog = document.getElementById('message-log');
      if (!messageLog) return;
      
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry ${type}`;
      logEntry.textContent = `[${timestamp}] ${message}`;
      
      messageLog.appendChild(logEntry);
      messageLog.scrollTop = messageLog.scrollHeight;
    }
  
    // Clear the message log
    function clearMessageLog() {
      const messageLog = document.getElementById('message-log');
      if (messageLog) {
        messageLog.innerHTML = '';
      }
    }
  
    // Update progress UI
    function updateProgress(current, total, percent) {
      const progressBar = document.getElementById('progress-bar');
      const progressText = document.getElementById('progress-text');
      
      if (progressBar) {
        progressBar.style.width = `${percent}%`;
      }
      
      if (progressText) {
        progressText.textContent = `${current}/${total} messages processed (${percent}%)`;
      }
    }
  
    // Public API
    return {
      init,
      showToast,
      switchTab,
      updateConnectionStatus,
      updateStatusMessage,
      logMessage,
      clearMessageLog,
      updateProgress
    };
  })();
  
  // Initialize UI when DOM is loaded
  document.addEventListener('DOMContentLoaded', UI.init);