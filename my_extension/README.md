# 🎯 Tour Builder Chrome Extension

A Chrome extension for building guided tours by tracking user interactions on any website.

## ✨ Features

- **Cross-domain compatibility**: Works on both localhost and production (Vercel)
- **Real-time recording**: Click elements to record tour steps instantly
- **Visual feedback**: Hover highlighting and click notifications
- **Comprehensive data capture**: Records element properties, styles, and context
- **Dashboard integration**: Sends data to your Tour Craft dashboard

## 🚀 Quick Start

### 1. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select the `my_extension` folder
4. The extension icon should appear in your toolbar

### 2. Test the Extension

1. Open the test page: `my_extension/test-extension.html`
2. Click the extension icon and click "Start Tour Building"
3. Click on any elements on the page
4. Check your dashboard: https://tour-craft-v1.vercel.app/Buildtour

## 🔧 How It Works

### Dynamic API Endpoint Detection

The extension automatically detects your environment:

- **Development**: Uses `http://localhost:3000/api/Buildtour`
- **Production**: Uses `https://tour-craft-v1.vercel.app/api/Buildtour`

### Data Flow

1. **Content Script** (`content.js`): Injected into web pages
2. **Event Listeners**: Capture mouse hover and click events
3. **Data Extraction**: Collects comprehensive element information
4. **API Communication**: Sends data to your backend
5. **Visual Feedback**: Shows notifications and highlights

## 🛠️ Troubleshooting

### Extension Not Working?

1. **Check Console**: Open DevTools (F12) and look for errors
2. **Reload Extension**: Go to `chrome://extensions/` and click the refresh icon
3. **Check Permissions**: Ensure the extension has access to the current site
4. **Test API**: Use the debug script to test connectivity

### Debug Commands

Open the browser console and run:

```javascript
// Test API connectivity
window.tourBuilderDebug.testApiConnection();

// Check extension status
window.tourBuilderDebug.checkExtensionStatus();

// Simulate tour building
window.tourBuilderDebug.simulateTourBuilding();
```

### Common Issues

#### "Content script not responding"

- Refresh the page
- Check if the site allows content scripts
- Try a different website

#### "API error"

- Check your internet connection
- Verify the API endpoint is correct
- Check browser console for CORS errors

#### "Extension not loading"

- Ensure Developer mode is enabled
- Check for syntax errors in extension files
- Reload the extension

## 📁 File Structure

```
my_extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── content.js            # Content script (injected into pages)
├── background.js         # Background service worker
├── highlight.css         # Styling for hover effects
├── test-extension.html   # Test page for debugging
├── debug-extension.js    # Debug utilities
└── README.md            # This file
```

## 🔒 Security

- **API Key**: Uses `tourcraft1234` for basic authentication
- **CORS**: Configured to allow cross-origin requests
- **Permissions**: Only requests necessary permissions

⚠️ **Security Note**: The API key is currently hardcoded in the extension. For production use, consider implementing a more secure authentication method.

## 🌐 Supported Environments

- ✅ Localhost development
- ✅ Vercel production deployment
- ✅ Any website with content script permissions
- ✅ Chrome, Edge, and other Chromium-based browsers

## 📊 Data Captured

For each clicked element, the extension captures:

- **Basic Info**: Element type, ID, classes, selector
- **Content**: Text content, HTML, form values
- **Position**: Coordinates, dimensions, viewport position
- **Styles**: Computed CSS properties
- **Hierarchy**: Parent and child elements
- **Accessibility**: ARIA attributes, roles
- **Context**: Page URL, title, timestamp

## 🔄 Development

### Making Changes

1. Edit the files in `my_extension/`
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test on a new page

### Adding Features

- **New UI**: Edit `popup.html` and `popup.js`
- **New Functionality**: Edit `content.js`
- **Styling**: Edit `highlight.css`
- **Background Tasks**: Edit `background.js`

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Use the debug commands above
3. Test with the provided test page
4. Verify your API endpoints are working

## 🎉 Success Indicators

- ✅ Extension icon appears in toolbar
- ✅ "Start Tour Building" button works
- ✅ Hover effects appear on elements
- ✅ Click notifications show up
- ✅ Data appears in your dashboard
- ✅ Console shows "Tour data sent successfully!"

---

**Happy Tour Building! 🎯**
