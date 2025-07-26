# Facebook Messenger Summarizer

A Chrome extension that helps you summarize your Facebook Messenger conversations by copying them to your clipboard, ready to be pasted into any LLM of your choice.

## Features

- Works on https://messenger.com
- Copies prompt + conversation text to your clipboard with a single click

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the project directory

## Usage

1. Navigate to any conversation on https://messenger.com
2. Click the extension icon in your browser toolbar
3. Scroll up in the conversation from where you want the summary to start
3. The prompt + conversation will be automatically added to your clipboard
4. Paste the conversation into your preferred LLM for summarization

## Chrome Web Store Preparation

### Creating Screenshots
To create screenshots for the Chrome Web Store (1280x800 format):

```bash
magick "Screenshot.png" -resize 1280x800 -background white -gravity center -extent 1280x800 output.jpg
```

### Packaging Extension
Run the packaging script to create a ZIP file ready for submission:

```bash
./package-extension.sh
```