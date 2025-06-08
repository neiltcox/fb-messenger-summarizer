// Function to get the sender for a message element
function findSender(element) {
  // Find the closest message container
  const messageContainer = element.closest('div[role="row"]');
  if (!messageContainer) {
    console.log('No message container found for element:', element);
    return 'Unknown';
  }

  // 0. Check for reply context in h5 or span
  const replyHeader = messageContainer.querySelector('h5, span');
  if (replyHeader) {
    const replyText = replyHeader.textContent.trim();
    // Match patterns like 'You replied to X' or 'X replied to Y'
    const match = replyText.match(/^(.*?) replied to (.*)$/);
    if (match) {
      const sender = match[1].trim();
      const repliedTo = match[2].trim();
      // Normalize 'You' for your own replies
      const senderLabel = sender === 'You' ? 'You' : sender;
      return `${senderLabel} (replied to ${repliedTo})`;
    }
  }

  // 1. Look for a span with 'You sent' (your own message)
  const youSentSpan = Array.from(messageContainer.querySelectorAll('span.x1lziwak.xexx8yu'))
    .find(span => span.textContent.trim() === 'You sent');
  if (youSentSpan) {
    return 'You';
  }

  // 2. Look for a sender name (not message text)
  // We'll skip spans that are deeply nested (likely message text) or empty
  const allSpans = messageContainer.querySelectorAll('span.x1lziwak.xexx8yu');
  for (const span of allSpans) {
    const text = span.textContent.trim();
    if (!text || text === 'You sent') continue;
    // Heuristic: skip if this span contains a div or is deeply nested (likely message text)
    if (span.querySelector('div')) continue;
    // Skip if text looks like a timestamp or metadata
    if (text.includes('·') || text.includes('at') || text.match(/^\d+:\d+/) || text.match(/^[A-Za-z]+, \d+$/)) continue;
    // If it passes all checks, it's likely the sender name
    return text;
  }

  // 3. Fallback: If this is an outgoing message (your message), set sender to 'You'
  const outgoing = messageContainer.textContent.includes('You sent');
  if (outgoing) {
    return 'You';
  }

  // 4. If still not found, return 'Unknown'
  console.log('Could not find sender in message container:', messageContainer);
  return 'Unknown';
}

// Function to get messages from the current conversation
function getMessages() {
  const messages = [];
  // Select all message bubbles by class pattern (Messenger uses obfuscated class names, but 'xexx8yu' seems stable)
  const messageElements = document.querySelectorAll('div.xexx8yu[dir="auto"]');

  console.log('Found message elements:', messageElements.length);

  for (const element of messageElements) {
    // Get the actual message text, excluding any reply headers
    const messageText = element.textContent.trim();
    if (messageText && messageText.trim().length > 0) {
      // Skip if this is just a reply header
      if (messageText.match(/^.*? replied to .*?$/i)) {
        continue;
      }
      
      const sender = findSender(element);
      console.log('Message:', messageText.trim(), 'Sender:', sender);
      messages.push({
        sender,
        text: messageText.trim(),
        time: null // We'll improve this later
      });
    }
  }

  console.log('Total messages collected:', messages.length);
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

// Helper: get a unique key for a message (text + sender)
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
  let maxIdle = 10; // max idle loops before giving up
  let idleCount = 0;

  while (!atBottom && idleCount < maxIdle) {
    // Collect messages currently in DOM
    const messageElements = document.querySelectorAll('div.xexx8yu[dir="auto"]');
    messageElements.forEach((element) => {
      const messageText = element.textContent;
      if (messageText && messageText.trim().length > 0) {
        const sender = findSender(element);
        const msg = { 
          sender, 
          text: messageText.trim(), 
          time: null,
          timestamp: Date.now() // Add timestamp for ordering
        };
        const key = getMessageKey(msg);
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

  // Sort messages by timestamp to maintain conversation order
  allMessages.sort((a, b) => a.timestamp - b.timestamp);

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