// Function to get the sender for a message element
function findSender(element) {
  let current = element;
  while (current && current !== document.body) {
    // Look for the lowest common ancestor of the sender and the content within `current`
    const msgDiv = current.querySelector?.('div.x78zum5.xdt5ytf.x1n2onr6[role="gridcell"]');
    if (msgDiv) {
      const senderSpan = msgDiv.querySelector('span');
      if (senderSpan) {
        const sender = senderSpan.textContent.trim();
        if (sender.toLowerCase().includes('you sent')) {
          return 'You';
        }
        return sender;
      }
    }
    current = current.parentElement;
  }
  return 'Unknown';
}

// Function to get messages from the current conversation
function getMessages() {
  const messages = [];
  // Select all message bubbles by class pattern (Messenger uses obfuscated class names, but 'xexx8yu' seems stable)
  const messageElements = document.querySelectorAll('div.xexx8yu[dir="auto"]');

  // console.log('Found message elements:', messageElements.length);

  for (const element of messageElements) {
    const messageText = element.textContent;
    if (messageText && messageText.trim().length > 0) {
      const sender = findSender(element);
      messages.push({
        sender,
        text: messageText.trim(),
        time: null // We'll improve this later
      });
    }
  }

  // console.log('Total messages collected:', messages.length);
  return messages;
}

// Function to find the last message sent by the current user
function findLastUserMessage() {
  const messages = getMessages();
  // Try different selectors for current user
  const currentUser = document.querySelector('span[data-ad-preview="sender"]')?.textContent ||
                     document.querySelector('span[data-ad-comet-preview="sender"]')?.textContent ||
                     document.querySelector('div[aria-label*="You"]')?.getAttribute('aria-label')?.replace('You', '').trim();
  
  // console.log('Current user:', currentUser);
  
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === currentUser) {
      // console.log('Found last user message:', messages[i]);
      return messages[i].time;
    }
  }
  
  // console.log('No last user message found');
  return null;
}

// Function to create ChatGPT prompt
function createPrompt(messages) {
  const conversationText = messages.map(msg => 
    `${msg.sender}: ${msg.text}`
  ).join('\n');

  return `Please summarize the following Facebook Messenger conversation:\n\n${conversationText}\n\n`;
}

// Function to open ChatGPT with the prompt
function openChatGPT() {
  const chatGPTUrl = `https://chat.openai.com/chat`;
  window.open(chatGPTUrl, '_blank');
}

// Helper: sleep for ms milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: get a unique key for a message (text + sender + index)
function getMessageKey(msg, idx) {
  return `${msg.sender}|||${msg.text}|||${idx}`;
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
  let maxIdle = 10; // max idle loops before giving up
  let idleCount = 0;

  while (!atBottom && idleCount < maxIdle) {
    // Collect messages currently in DOM
    const messageElements = document.querySelectorAll('div.xexx8yu[dir="auto"]');
    messageElements.forEach((element, idx) => {
      const messageText = element.textContent;
      if (messageText && messageText.trim().length > 0) {
        const sender = findSender(element);
        const msg = { sender, text: messageText.trim(), time: null };
        const key = getMessageKey(msg, idx);
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allMessages.push(msg);
        }
      }
    });

    // Scroll down
    let prevScrollTop = chatContainer.scrollTop;
    chatContainer.scrollTop += scrollStep;
    await sleep(200);

    // Check if we've reached the bottom
    if (chatContainer.scrollTop === prevScrollTop || (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 5)) {
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

  // Summarize all collected messages
  if (allMessages.length === 0) {
    sendResponse({ error: 'No messages found.' });
    return;
  }
  const prompt = createPrompt(allMessages);
  sendResponse({ prompt });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.log('Received message:', request);

  if (request.action === 'summarize') {
    const messages = getMessages();
    if (messages.length === 0) {
      sendResponse({ error: 'No messages found.' });
      return;
    }
    const prompt = createPrompt(messages);
    sendResponse({ prompt });
  } else if (request.action === 'openChatGPT') {
    openChatGPT();
  } else if (request.action === 'autoScrollAndSummarize') {
    autoScrollAndSummarize(sendResponse);
    return true; // async
  }
  return true;
}); 