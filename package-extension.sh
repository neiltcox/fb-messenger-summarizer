#!/bin/bash

# Facebook Messenger Summarizer - Extension Packaging Script
# This script creates a ZIP file ready for Chrome Web Store submission

echo "🚀 Packaging Facebook Messenger Summarizer for Chrome Web Store..."

# Set variables
EXTENSION_NAME="facebook-messenger-summarizer"
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
ZIP_NAME="${EXTENSION_NAME}-v${VERSION}.zip"

echo "📦 Extension version: $VERSION"
echo "📁 Creating ZIP: $ZIP_NAME"

# Remove existing ZIP if it exists
if [ -f "$ZIP_NAME" ]; then
    echo "🗑️  Removing existing ZIP file..."
    rm "$ZIP_NAME"
fi

# Create ZIP file with all necessary files
zip -r "$ZIP_NAME" \
    manifest.json \
    content.js \
    popup.html \
    popup.js \
    styles.css \
    icons/ \
    README.md \
    privacy-policy.md \
    store-description.md \
    -x "*.DS_Store" \
    -x "*.git*" \
    -x "package-extension.sh"

# Check if ZIP was created successfully
if [ -f "$ZIP_NAME" ]; then
    ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
    echo "✅ Successfully created $ZIP_NAME ($ZIP_SIZE)"
    echo ""
    echo "📋 Files included in ZIP:"
    unzip -l "$ZIP_NAME" | grep -E "\.(json|js|html|css|png|md)$" | head -20
    echo ""
    echo "🎯 Next steps:"
    echo "1. Upload $ZIP_NAME to Chrome Web Store Developer Dashboard"
    echo "2. Add screenshots and promotional images"
    echo "3. Use the content from store-description.md for your listing"
    echo "4. Include privacy-policy.md content in your privacy policy"
    echo ""
    echo "🔗 Chrome Web Store Developer Dashboard:"
    echo "https://chrome.google.com/webstore/devconsole/"
else
    echo "❌ Failed to create ZIP file"
    exit 1
fi 