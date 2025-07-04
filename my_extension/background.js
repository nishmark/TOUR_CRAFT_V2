// Tour Builder Background Script
chrome.runtime.onInstalled.addListener(() => {
  console.log("Tour Builder Extension installed");
});

// Handle messages between popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("🔄 Background script received message:", request.action);

  if (request.action === "stepRecorded") {
    // Forward step updates to popup
    chrome.runtime.sendMessage(request);
    return;
  }

  if (
    request.action === "startTourBuilding" ||
    request.action === "stopTourBuilding" ||
    request.action === "getTourStatus"
  ) {
    // Forward message to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request, sendResponse);
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });
    return true; // Keep the message channel open for async response
  }
});
