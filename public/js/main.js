/**
 * WhatsApp Bulk Messenger
 * Main JavaScript File
 */

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tab navigation
    initTabNavigation();
    
    // Initialize settings form
    initSettingsForm();
    
    // Initialize statistics
    initStatistics();
  });
  
  // Initialize tab navigation
  function initTabNavigation() {
    const navItems = document.querySelectorAll('.nav-menu li');
    
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = item.getAttribute('data-tab');
        UI.switchTab(tabId);
      });
    });
  }
  
  // Initialize settings form
  function initSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    const delayInput = document.getElementById('delay-between-messages');
    const retriesInput = document.getElementById('max-retries');
    const retryDelayInput = document.getElementById('retry-delay');
    
    // Load current settings
    fetch('/api/settings')
      .then(response => response.json())
      .then(data => {
        if (data.success && delayInput && retriesInput && retryDelayInput) {
          const settings = data.settings;
          delayInput.value = settings.DELAY_BETWEEN_MESSAGES;
          retriesInput.value = settings.MAX_RETRIES;
          retryDelayInput.value = settings.RETRY_DELAY;
        }
      })
      .catch(error => {
        console.error('Error loading settings:', error);
      });
    
    // Handle settings form submission
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!delayInput || !retriesInput || !retryDelayInput) return;
        
        const settings = {
          DELAY_BETWEEN_MESSAGES: parseInt(delayInput.value),
          MAX_RETRIES: parseInt(retriesInput.value),
          RETRY_DELAY: parseInt(retryDelayInput.value)
        };
        
        // Add sender number if available from connection module
        const senderNumber = document.getElementById('sender-number');
        if (senderNumber && senderNumber.value.trim()) {
          settings.WHATSAPP_CLIENT_ID = senderNumber.value.trim();
        }
        
        fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            UI.showToast('Settings saved successfully', 'success');
          } else {
            UI.showToast(data.message, 'error');
          }
        })
        .catch(error => {
          console.error('Error saving settings:', error);
          UI.showToast('Failed to save settings', 'error');
        });
      });
    }
  }
  
  // Initialize statistics
  function initStatistics() {
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    const statsChart = document.getElementById('stats-chart');
    let chart = null;
    
    // Listen for refresh event
    document.addEventListener('refresh-statistics', refreshStatistics);
    
    // Add click event to refresh button
    if (refreshStatsBtn) {
      refreshStatsBtn.addEventListener('click', refreshStatistics);
    }
    
    function refreshStatistics() {
      // In a production app, this would fetch from the server
      // For demo purposes, use random data if Excel is uploaded
      const excelUploaded = Excel.isExcelUploaded();
      
      if (excelUploaded) {
        // Simulate statistics
        const stats = {
          total: 50,
          sent: Math.floor(Math.random() * 35) + 10,
          pending: Math.floor(Math.random() * 10),
          failed: Math.floor(Math.random() * 5)
        };
        
        updateStatistics(stats);
      } else {
        // No Excel file, just show zeros
        updateStatistics({
          total: 0,
          sent: 0,
          pending: 0,
          failed: 0
        });
      }
    }
    
    function updateStatistics(stats) {
      // Update stat cards
      updateStatCard('stat-total', stats.total);
      updateStatCard('stat-sent', stats.sent);
      updateStatCard('stat-pending', stats.pending);
      updateStatCard('stat-failed', stats.failed);
      
      // Update chart if available
      updateStatsChart(stats);
    }
    
    function updateStatCard(id, value) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }
    
    function updateStatsChart(stats) {
      if (!statsChart) return;
      
      // Destroy existing chart if it exists
      if (chart) {
        chart.destroy();
      }
      
      // Create new chart
      const ctx = statsChart.getContext('2d');
      chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Sent', 'Pending', 'Failed'],
          datasets: [{
            data: [stats.sent, stats.pending, stats.failed],
            backgroundColor: [
              'rgba(76, 175, 80, 0.8)',
              'rgba(255, 193, 7, 0.8)',
              'rgba(244, 67, 54, 0.8)'
            ],
            borderColor: [
              'rgba(76, 175, 80, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(244, 67, 54, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = stats.total;
                  const percentage = Math.round((value / total) * 100) || 0;
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
  }