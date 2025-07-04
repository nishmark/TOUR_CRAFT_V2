document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("startTour");
  const stopButton = document.getElementById("stopTour");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const stepCounter = document.getElementById("stepCounter");
  const messageDiv = document.getElementById("message");

  let isTourBuilding = false;
  let stepCount = 0;

  // Update UI based on tour building status
  function updateUI(tourStatus) {
    isTourBuilding = tourStatus.isTourBuilding;
    stepCount = tourStatus.stepCount || 0;

    if (isTourBuilding) {
      statusDot.classList.add("active");
      statusText.textContent = "Building tour...";
      startButton.disabled = true;
      stopButton.disabled = false;
      showMessage(
        "Tour building is active! Go to your website and start clicking elements.",
        "success"
      );
    } else {
      statusDot.classList.remove("active");
      statusText.textContent = "Ready to build";
      startButton.disabled = false;
      stopButton.disabled = true;
      if (stepCount > 0) {
        showMessage(
          `Tour building stopped. Recorded ${stepCount} steps.`,
          "info"
        );
      }
    }

    stepCounter.textContent = `Steps recorded: ${stepCount}`;
  }

  // Show message to user
  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;

    // Clear message after 5 seconds
    setTimeout(() => {
      messageDiv.textContent = "";
      messageDiv.className = "message";
    }, 5000);
  }

  // Listen for step updates from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stepRecorded") {
      stepCount = request.stepCount;
      stepCounter.textContent = `Steps recorded: ${stepCount}`;
      console.log("📊 Step recorded:", stepCount);
    }
  });

  // Send message to content script with better error handling
  function sendMessageToContentScript(action) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          const activeTab = tabs[0];

          // Check if the tab URL is valid for content scripts
          if (
            activeTab.url.startsWith("chrome://") ||
            activeTab.url.startsWith("chrome-extension://") ||
            activeTab.url.startsWith("edge://") ||
            activeTab.url.startsWith("about:")
          ) {
            resolve({
              error: "Content scripts cannot run on this page",
              details: `Cannot inject content script into ${activeTab.url}`,
            });
            return;
          }

          chrome.tabs.sendMessage(
            activeTab.id,
            { action: action },
            async (response) => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Chrome runtime error:",
                  chrome.runtime.lastError
                );

                // Try to inject content script programmatically as fallback
                try {
                  console.log("🔄 Attempting to inject content script...");
                  await chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ["content.js"],
                  });

                  // Wait a bit for script to load, then retry
                  setTimeout(() => {
                    chrome.tabs.sendMessage(
                      activeTab.id,
                      { action: action },
                      (retryResponse) => {
                        if (chrome.runtime.lastError) {
                          resolve({
                            error: "Content script injection failed",
                            details: chrome.runtime.lastError.message,
                            tabUrl: activeTab.url,
                          });
                        } else {
                          resolve(retryResponse);
                        }
                      }
                    );
                  }, 1000);
                } catch (injectionError) {
                  console.error("Script injection failed:", injectionError);
                  resolve({
                    error: "Content script not responding",
                    details: chrome.runtime.lastError.message,
                    tabUrl: activeTab.url,
                  });
                }
              } else {
                resolve(response);
              }
            }
          );
        } else {
          resolve({ error: "No active tab found" });
        }
      });
    });
  }

  // Start tour building
  startButton.addEventListener("click", async function () {
    startButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      startButton.style.transform = "scale(1)";
    }, 100);

    const response = await sendMessageToContentScript("startTourBuilding");
    if (response && response.success) {
      stepCount = 0; // Reset step count when starting
      updateUI({ isTourBuilding: true, stepCount: 0 });
    } else {
      let errorMessage = "Failed to start tour building.";
      if (response && response.error) {
        if (response.error.includes("Content scripts cannot run")) {
          errorMessage =
            "Please navigate to a regular website (not chrome:// or extension pages)";
        } else if (response.error.includes("Content script not responding")) {
          errorMessage = "Content script not loaded. Try refreshing the page.";
        } else {
          errorMessage = `Error: ${response.details || response.error}`;
        }
      }
      showMessage(errorMessage, "error");
      console.error("Full error details:", response);
    }
  });

  // Stop tour building
  stopButton.addEventListener("click", async function () {
    stopButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      stopButton.style.transform = "scale(1)";
    }, 100);

    const response = await sendMessageToContentScript("stopTourBuilding");
    if (response && response.success) {
      // Get final status
      const status = await sendMessageToContentScript("getTourStatus");
      updateUI(status || { isTourBuilding: false, stepCount: stepCount });
    } else {
      showMessage("Failed to stop tour building.", "error");
    }
  });

  // Get initial status when popup opens
  async function initializeStatus() {
    const status = await sendMessageToContentScript("getTourStatus");
    if (status) {
      updateUI(status);
    } else {
      updateUI({ isTourBuilding: false, stepCount: 0 });
    }
  }

  // Initialize on popup open
  initializeStatus();

  // Update status every 2 seconds while popup is open and tour is building
  let statusInterval = null;

  function startStatusUpdates() {
    if (statusInterval) clearInterval(statusInterval);
    statusInterval = setInterval(async () => {
      if (isTourBuilding) {
        const status = await sendMessageToContentScript("getTourStatus");
        if (status) {
          stepCount = status.stepCount || stepCount;
          stepCounter.textContent = `Steps recorded: ${stepCount}`;
        }
      } else {
        // Stop updates if tour is not building
        stopStatusUpdates();
      }
    }, 2000);
  }

  function stopStatusUpdates() {
    if (statusInterval) {
      clearInterval(statusInterval);
      statusInterval = null;
    }
  }

  // Clean up interval when popup closes
  window.addEventListener("beforeunload", () => {
    stopStatusUpdates();
  });

  // Start updates when tour building begins
  const originalUpdateUI = updateUI;
  updateUI = function (tourStatus) {
    originalUpdateUI(tourStatus);
    if (tourStatus.isTourBuilding) {
      startStatusUpdates();
    } else {
      stopStatusUpdates();
    }
  };
});
