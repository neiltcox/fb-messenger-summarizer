# Facebook Messenger Summarizer

A Chrome extension that helps you summarize your Facebook Messenger conversations by copying them to your clipboard, ready to be pasted into any LLM of your choice.

## Features

- Works on messenger.com
- Copies conversation text to your clipboard with a single click
- Clean and minimal interface
- Use with any LLM of your choice (ChatGPT, Claude, etc.)

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project directory

## Usage

1. Navigate to any conversation on messenger.com
2. Click the extension icon in your browser toolbar
3. Click "Copy" to copy the conversation to your clipboard
4. Paste the conversation into your preferred LLM for summarization

## Development

```bash
# Install dependencies
npm install

# Generate icons
node generate_icons.js
```

## License

MIT 