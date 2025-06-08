// Helper functions for sender identification
function findSender(element) {
  const messageContainer = element.closest('div[role="row"]');
  if (!messageContainer) return 'Unknown';

  // Check for reply context
  const replyHeader = messageContainer.querySelector('h5, span');
  if (replyHeader) {
    const replyText = replyHeader.textContent.trim();
    const match = replyText.match(/^(.*?) replied to (.*)$/);
    if (match) {
      const sender = match[1].trim();
      return `${sender === 'You' ? 'You' : sender} (replied to ${match[2].trim()})`;
    }
  }

  // Check for own message indicator
  if (Array.from(messageContainer.querySelectorAll('span.x1lziwak.xexx8yu'))
      .some(span => span.textContent.trim() === 'You sent')) {
    return 'You';
  }

  // Look for sender name
  const allSpans = messageContainer.querySelectorAll('span.x1lziwak.xexx8yu');
  for (const span of allSpans) {
    const text = span.textContent.trim();
    if (!text || text === 'You sent') continue;
    if (span.querySelector('div')) continue; // Skip if contains div (likely message content)
    if (text.includes('·') || text.includes('at') || text.match(/^\d+:\d+/) || text.match(/^[A-Za-z]+, \d+$/)) continue; // Skip timestamps
    return text; // Likely sender name
  }

  // Fallback for outgoing messages
  return messageContainer.textContent.includes('You sent') ? 'You' : 'Unknown';
}

// Extract messages from the DOM
function getMessages() {
  const messages = [];
  const messageElements = document.querySelectorAll('div.xexx8yu[dir="auto"]');

  for (const element of messageElements) {
    const messageText = element.textContent.trim();
    if (!messageText || messageText.match(/^.*? replied to .*?$/i)) continue;
    
    messages.push({
      sender: findSender(element),
      text: messageText,
      time: null,
      timestamp: Date.now()
    });
  }

  return messages;
}

// Create ChatGPT prompt from messages
function createPrompt(messages) {
  const conversationText = messages.map(msg => 
    `${msg.sender}: ${msg.text}`
  ).join('\n');

  return `Please summarize the following Facebook Messenger conversation:\n\n${conversationText}\n\n`;
}

// Helper: sleep for ms milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: get a unique key for a message
function getMessageKey(msg) {
  return `${msg.sender}|||${msg.text}`;
}

// Main auto-scroll and summarize function
async function autoScrollAndSummarize(sendResponse) {
  // Find the scrollable chat container
  const chatContainer = document.querySelector('div[role="none"].x78zum5.xdt5ytf');
  if (!chatContainer) {
    sendResponse({ error: 'Could not find chat container.' });
    return;
  }

  let lastScrollTop = -1;
  let atBottom = false;
  let allMessages = [];
  let seenKeys = new Set();
  let scrollStep = 1000;
  let maxIdle = 10;
  let idleCount = 0;

  while (!atBottom && idleCount < maxIdle) {
    // Collect messages currently in DOM
    const currentMessages = getMessages();
    currentMessages.forEach(msg => {
      const key = getMessageKey(msg);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        allMessages.push(msg);
      }
    });

    // Scroll down
    let prevScrollTop = chatContainer.scrollTop;
    chatContainer.scrollTop += scrollStep;
    await sleep(200);

    // Check if we've reached the bottom
    if (chatContainer.scrollTop === prevScrollTop || 
        (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 5)) {
      atBottom = true;
    }

    // If no new messages loaded, increment idle
    if (chatContainer.scrollTop === lastScrollTop) {
      idleCount++;
    } else {
      idleCount = 0;
    }
    lastScrollTop = chatContainer.scrollTop;
  }

  // Sort messages by timestamp to maintain conversation order
  allMessages.sort((a, b) => a.timestamp - b.timestamp);

  // Summarize all collected messages
  if (allMessages.length === 0) {
    sendResponse({ error: 'No messages found.' });
    return;
  }
  sendResponse({ prompt: createPrompt(allMessages) });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'summarize') {
    const messages = getMessages();
    if (messages.length === 0) {
      sendResponse({ error: 'No messages found.' });
      return;
    }
    sendResponse({ prompt: createPrompt(messages) });
  } else if (request.action === 'openChatGPT') {
    window.open('https://chat.openai.com/chat', '_blank');
  } else if (request.action === 'autoScrollAndSummarize') {
    autoScrollAndSummarize(sendResponse);
    return true; // async
  }
  return true;
}); 