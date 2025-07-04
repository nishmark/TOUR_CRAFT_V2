// Tour Builder Content Script
let isTourBuilding = false;
let highlightedElement = null;
let stepCounter = 0;

// API endpoint configuration
function getApiEndpoint() {
  // Production URL - always use this for hosted app
  const productionUrl = "https://tour-craft-v1.vercel.app/api/Buildtour";
  
  console.log("🚀 Using production Vercel API:", productionUrl);
  return productionUrl;
  
  // For local development, uncomment the line below and comment out the return above:
  // return "http://localhost:3000/api/Buildtour";
}

const API_ENDPOINT = getApiEndpoint();

console.log("🎯 Using API endpoint:", API_ENDPOINT);

// Create highlight overlay
function createHighlightOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "tour-builder-highlight";
  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "999999";
  overlay.style.border = "3px solid #ff6b6b";
  overlay.style.backgroundColor = "rgba(255, 107, 107, 0.1)";
  overlay.style.display = "none";
  overlay.style.borderRadius = "4px";
  overlay.style.transition = "all 0.2s ease";
  document.body.appendChild(overlay);
  return overlay;
}

// Get element position and dimensions
function getElementRect(element) {
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
    width: rect.width,
    height: rect.height,
    viewportTop: rect.top,
    viewportLeft: rect.left,
  };
}

// Generate CSS selector for element
function generateSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className) {
    const classes = element.className.split(" ").filter((c) => c.trim());
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join(".")}`;
    }
  }

  // Fallback to nth-child selector
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    return `${generateSelector(
      parent
    )} > ${element.tagName.toLowerCase()}:nth-child(${index})`;
  }

  return element.tagName.toLowerCase();
}

// Extract element data
function extractElementData(element) {
  const rect = getElementRect(element);
  const attributes = {};
  const computedStyles = window.getComputedStyle(element);

  // Get all attributes
  for (let attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }

  // Get form-specific data
  const formData = {};
  if (element.tagName.toLowerCase() === "input") {
    formData.type = element.type;
    formData.value = element.value;
    formData.placeholder = element.placeholder;
    formData.required = element.required;
    formData.disabled = element.disabled;
    formData.checked = element.checked;
  } else if (element.tagName.toLowerCase() === "select") {
    formData.value = element.value;
    formData.selectedIndex = element.selectedIndex;
    formData.options = Array.from(element.options).map((opt) => ({
      text: opt.text,
      value: opt.value,
      selected: opt.selected,
    }));
  } else if (element.tagName.toLowerCase() === "textarea") {
    formData.value = element.value;
    formData.placeholder = element.placeholder;
    formData.rows = element.rows;
    formData.cols = element.cols;
  }

  // Get element hierarchy
  const parentInfo = element.parentElement
    ? {
        tagName: element.parentElement.tagName.toLowerCase(),
        id: element.parentElement.id,
        className: element.parentElement.className,
      }
    : null;

  // Get children info
  const childrenInfo = Array.from(element.children).map((child) => ({
    tagName: child.tagName.toLowerCase(),
    id: child.id,
    className: child.className,
    textContent: child.textContent?.trim().substring(0, 50) || "",
  }));

  return {
    // Basic element identification
    elementType: element.tagName.toLowerCase(), // div, button, input, etc.
    id: element.id || null, // Element ID
    className: element.className || null, // CSS classes
    selector: generateSelector(element), // Generated CSS selector

    // Element content
    textContent: element.textContent?.trim() || "", // All text inside element
    innerHTML: element.innerHTML?.substring(0, 500) || "", // HTML content (truncated)
    value: element.value || null, // For form elements

    // All HTML attributes
    attributes: attributes,

    // Form-specific data (if applicable)
    formData: Object.keys(formData).length > 0 ? formData : null,

    // Element position and dimensions
    position: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    },
    viewportPosition: {
      x: rect.viewportLeft,
      y: rect.viewportTop,
    },

    // Element visibility and state
    isVisible:
      computedStyles.display !== "none" &&
      computedStyles.visibility !== "hidden",
    isClickable:
      element.tagName.toLowerCase() === "button" ||
      element.tagName.toLowerCase() === "a" ||
      element.tagName.toLowerCase() === "input" ||
      element.onclick !== null ||
      computedStyles.cursor === "pointer",

    // Element hierarchy
    parent: parentInfo,
    children: childrenInfo.slice(0, 5), // Limit to first 5 children

    // Computed styles (key ones)
    styles: {
      backgroundColor: computedStyles.backgroundColor,
      color: computedStyles.color,
      fontSize: computedStyles.fontSize,
      fontFamily: computedStyles.fontFamily,
      border: computedStyles.border,
      borderRadius: computedStyles.borderRadius,
      display: computedStyles.display,
      position: computedStyles.position,
      zIndex: computedStyles.zIndex,
      cursor: computedStyles.cursor,
    },

    // Page context
    url: window.location.href,
    pageTitle: document.title,

    // Tour metadata
    timestamp: new Date().toISOString(),
    stepNumber: stepCounter + 1, // Use stepCounter + 1 instead of ++stepCounter

    // Additional element properties
    scrollTop: element.scrollTop,
    scrollLeft: element.scrollLeft,
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,

    // Accessibility information
    accessibility: {
      role: element.getAttribute("role"),
      ariaLabel: element.getAttribute("aria-label"),
      ariaDescribedBy: element.getAttribute("aria-describedby"),
      tabIndex: element.tabIndex,
      title: element.title,
    },
  };
}

// Send data to API with retry mechanism
async function sendTourData(elementData, retryCount = 0) {
  const maxRetries = 3;
  const retryDelay = 1000 * (retryCount + 1); // Exponential backoff

  console.log("🚀 Sending tour data to:", API_ENDPOINT);
  console.log("📊 Element data being sent:", elementData);

  const payload = {
    tourData: elementData,
    metadata: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      title: document.title,
    },
  };

  console.log("📦 Full payload:", payload);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Increment step counter only after successful API call
      stepCounter++;
      console.log("✅ Tour data sent successfully! Step:", stepCounter);
      showNotification(`Step ${stepCounter} recorded! ✅`, "success");

      // Notify popup about the new step
      chrome.runtime.sendMessage({
        action: "stepRecorded",
        stepCount: stepCounter,
      });
    } else {
      console.error("❌ API error:", response.status, response.statusText);

      // Retry on server errors (5xx) or rate limiting (429)
      if (
        (response.status >= 500 || response.status === 429) &&
        retryCount < maxRetries
      ) {
        console.log(
          `🔄 Retrying in ${retryDelay}ms... (attempt ${
            retryCount + 1
          }/${maxRetries})`
        );
        showNotification(`Retrying step ${elementData.stepNumber}...`, "info");

        setTimeout(() => {
          sendTourData(elementData, retryCount + 1);
        }, retryDelay);
        return;
      }

      showNotification(
        `Step ${elementData.stepNumber} failed (API error: ${response.status})`,
        "error"
      );
    }
  } catch (error) {
    console.error("❌ Network error:", error);

    // Retry on network errors
    if (retryCount < maxRetries) {
      console.log(
        `🔄 Retrying in ${retryDelay}ms... (attempt ${
          retryCount + 1
        }/${maxRetries})`
      );
      showNotification(`Retrying step ${elementData.stepNumber}...`, "info");

      setTimeout(() => {
        sendTourData(elementData, retryCount + 1);
      }, retryDelay);
      return;
    }

    showNotification(
      `Step ${elementData.stepNumber} failed (network error)`,
      "error"
    );
  }
}

// Show notification
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3"
    };
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 1000000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateX(0)";
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateX(100%)";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize highlight overlay
const highlightOverlay = createHighlightOverlay();

// Mouse over handler
function handleMouseOver(event) {
  if (!isTourBuilding) return;

  const element = event.target;
  if (element === highlightOverlay) return;

  const rect = getElementRect(element);
  highlightOverlay.style.display = "block";
  highlightOverlay.style.top = rect.top + "px";
  highlightOverlay.style.left = rect.left + "px";
  highlightOverlay.style.width = rect.width + "px";
  highlightOverlay.style.height = rect.height + "px";

  highlightedElement = element;
}

// Mouse out handler
function handleMouseOut(event) {
  if (!isTourBuilding) return;
  highlightOverlay.style.display = "none";
  highlightedElement = null;
}

// Click handler
function handleClick(event) {
  if (!isTourBuilding) return;

  event.preventDefault();
  event.stopPropagation();

  const element = event.target;
  if (element === highlightOverlay) return;

  const elementData = extractElementData(element);
  sendTourData(elementData);
}

// Start tour building
function startTourBuilding() {
  isTourBuilding = true;
  stepCounter = 0;
  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("mouseout", handleMouseOut, true);
  document.addEventListener("click", handleClick, true);
  showNotification(
    "Tour building started! Hover and click elements to record steps.",
    "success"
  );

  // Add body class for styling
  document.body.classList.add("tour-building-active");
}

// Stop tour building
function stopTourBuilding() {
  isTourBuilding = false;
  document.removeEventListener("mouseover", handleMouseOver, true);
  document.removeEventListener("mouseout", handleMouseOut, true);
  document.removeEventListener("click", handleClick, true);
  highlightOverlay.style.display = "none";
  showNotification("Tour building stopped.", "info");

  // Remove body class
  document.body.classList.remove("tour-building-active");
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startTourBuilding") {
    startTourBuilding();
    sendResponse({ success: true });
  } else if (request.action === "stopTourBuilding") {
    stopTourBuilding();
    sendResponse({ success: true });
  } else if (request.action === "getTourStatus") {
    sendResponse({ isTourBuilding: isTourBuilding, stepCount: stepCounter });
  }
});

console.log("🎯 Tour Builder content script loaded on:", window.location.href);

// Add global flag for debugging
window.tourBuilderLoaded = true;

// Add manual test function
window.testTourAPI = async function () {
  console.log("🧪 Manual API Test");

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tourData: { test: true, stepNumber: 999 },
        metadata: { debug: true },
      }),
    });

    console.log("📡 Response Status:", response.status);
    console.log("📡 Response Status Text:", response.statusText);

    const responseText = await response.text();
    console.log("📡 Response Body:", responseText);

    if (response.ok) {
      console.log("✅ API Test Successful!");
    } else {
      console.log("❌ API Test Failed!");
    }
  } catch (error) {
    console.error("❌ API Test Error:", error);
  }
};

// Load debug utilities
if (typeof window.tourBuilderDebug === "undefined") {
  console.log("🔧 Loading debug utilities...");

  // Create debug script element
  const debugScript = document.createElement("script");
  debugScript.src = chrome.runtime.getURL("debug-extension.js");
  debugScript.onload = function () {
    console.log("✅ Debug utilities loaded successfully");
  };
  debugScript.onerror = function () {
    console.error("❌ Failed to load debug utilities");
  };
  document.head.appendChild(debugScript);
}

// Verify content script is working
if (typeof chrome !== "undefined" && chrome.runtime) {
  console.log("✅ Chrome runtime available");
} else {
  console.error("❌ Chrome runtime not available");
}

// Test message listener
console.log("📡 Setting up message listener...");
