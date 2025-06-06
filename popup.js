document.addEventListener('DOMContentLoaded', function() {
  const summarizeAllButton = document.getElementById('summarizeAll');

  summarizeAllButton.addEventListener('click', async function() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'autoScrollAndSummarize' }, async (response) => {
      if (response && response.prompt) {
        try {
          await navigator.clipboard.writeText(response.prompt);
          alert('Prompt copied to clipboard! Paste (Cmd+V) into ChatGPT.');
        } catch (err) {
          alert('Failed to copy prompt to clipboard.');
        }
      } else {
        alert(response && response.error ? response.error : 'Failed to generate summary prompt.');
      }
    });
  });
}); 