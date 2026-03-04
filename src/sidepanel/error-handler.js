// Global error handler for side panel
window.addEventListener('error', function(event) {
  console.error('Side panel error:', event.error);
  
  try {
    var errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ef4444; color: white; padding: 8px; font-size: 12px; z-index: 10000; font-family: monospace;';
    errorDiv.textContent = 'Error: ' + event.error.message;
    document.body.appendChild(errorDiv);
    
    setTimeout(function() {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  } catch (cleanupError) {
    console.error('Error in error handler:', cleanupError);
  }
});

console.log('Error handler loaded');
