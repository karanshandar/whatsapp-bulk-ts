/**
 * Excel Module
 * Handles Excel file uploads and validation
 */

const Excel = (function() {
    // Module state
    const state = {
      excelUploaded: false
    };
    
    // Element references
    let excelFile, fileName, uploadBtn, validationResults;
    
    // Initialize the module
    function init() {
      // Get UI elements
      excelFile = document.getElementById('excel-file');
      fileName = document.getElementById('file-name');
      uploadBtn = document.getElementById('upload-btn');
      validationResults = document.getElementById('validation-results');
      
      // Set up event listeners
      if (excelFile) excelFile.addEventListener('change', handleFileSelection);
      if (uploadBtn) uploadBtn.addEventListener('click', uploadExcelFile);
    }
    
    // Handle file selection for Excel upload
    function handleFileSelection() {
      if (!excelFile) return;
      
      const displayName = excelFile.files[0] ? excelFile.files[0].name : 'Choose Excel File';
      if (fileName) fileName.textContent = displayName;
      
      // Reset validation results
      if (validationResults) {
        validationResults.className = 'validation-results';
        validationResults.style.display = 'none';
        validationResults.innerHTML = '';
      }
    }
    
    // Upload Excel file to the server
    function uploadExcelFile() {
      if (!excelFile || !excelFile.files[0]) {
        UI.showToast('Please select an Excel file', 'warning');
        return;
      }
      
      const formData = new FormData();
      formData.append('excel', excelFile.files[0]);
      
      // First validate the Excel file
      fetch('/api/validate-excel', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          // If valid, proceed with upload
          uploadValidExcel(formData);
        } else {
          // Display validation errors
          showValidationErrors(data);
        }
      })
      .catch(error => {
        console.error('Error validating Excel:', error);
        UI.showToast('Failed to validate Excel file', 'error');
      });
    }
    
    // Upload a validated Excel file
    function uploadValidExcel(formData) {
      fetch('/api/upload-excel', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showValidationSuccess('Excel file uploaded successfully');
          state.excelUploaded = true;
          
          // Notify other modules
          document.dispatchEvent(new CustomEvent('excel-status-changed', { 
            detail: { uploaded: true }
          }));
          
          UI.showToast('Excel file uploaded successfully', 'success');
        } else {
          showValidationErrors(data);
        }
      })
      .catch(error => {
        console.error('Error uploading Excel:', error);
        UI.showToast('Failed to upload Excel file', 'error');
      });
    }
    
    // Show validation success message
    function showValidationSuccess(message) {
      if (!validationResults) return;
      
      validationResults.className = 'validation-results success';
      validationResults.style.display = 'block';
      validationResults.innerHTML = `<p>${message}</p>`;
    }
    
    // Show validation errors
    function showValidationErrors(data) {
      if (!validationResults) return;
      
      validationResults.className = 'validation-results error';
      validationResults.style.display = 'block';
      
      let html = `<p>${data.message || 'Validation failed'}</p>`;
      
      if (data.errors && data.errors.length > 0) {
        html += '<div class="validation-errors"><ul>';
        data.errors.forEach(error => {
          html += `<li>${error}</li>`;
        });
        html += '</ul></div>';
      }
      
      validationResults.innerHTML = html;
    }
    
    // Update Excel status information
    function updateExcelStatus(element) {
      if (!element) return;
      
      if (state.excelUploaded) {
        element.innerHTML = '<p class="success">Excel file is loaded and ready</p>';
      } else {
        element.innerHTML = '<p class="warning">No Excel file uploaded</p>';
      }
    }
    
    // Check if Excel is uploaded
    function isExcelUploaded() {
      return state.excelUploaded;
    }
    
    // Public API
    return {
      init,
      isExcelUploaded,
      updateExcelStatus
    };
  })();
  
  // Initialize Excel module when DOM is loaded
  document.addEventListener('DOMContentLoaded', Excel.init);