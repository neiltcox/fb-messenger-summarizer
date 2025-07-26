document.addEventListener('DOMContentLoaded', function() {
  const summarizeAllButton = document.getElementById('summarizeAll');
  const notification = document.getElementById('notification');

  // Function to show notification
  function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.classList.remove('hidden');
    
    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 300);
    }, 3000);
  }

  summarizeAllButton.addEventListener('click', async function() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on messenger.com
      if (!tab.url.includes('messenger.com')) {
        showNotification('Please navigate to Facebook Messenger first.', true);
        return;
      }

      // Inject content script if not already injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (err) {
        // Content script might already be injected, continue
      }

      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { action: 'autoScrollAndSummarize' }, async (response) => {
        if (chrome.runtime.lastError) {
          showNotification('Please refresh the page and try again.', true);
          return;
        }
        
        if (response && response.prompt) {
          try {
            await navigator.clipboard.writeText(response.prompt);
            showNotification('Prompt copied to clipboard! Paste (Cmd+V) into ChatGPT.');
          } catch (err) {
            showNotification('Failed to copy prompt to clipboard.', true);
          }
        } else {
          showNotification(response && response.error ? response.error : 'Failed to generate summary prompt.', true);
        }
      });
    } catch (err) {
      showNotification('An error occurred. Please try again.', true);
    }
  });
}); 