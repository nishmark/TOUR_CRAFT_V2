// Tour Builder Debug Utilities
window.tourBuilderDebug = {
  // Test API connectivity
  async testApiConnection() {
    console.log("🔍 Testing API connection...");

    const endpoints = [
      "http://localhost:3000/api/Buildtour",
      "https://tour-craft-v1.vercel.app/api/Buildtour",
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing endpoint: ${endpoint}`);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tourData: { test: true },
            metadata: { debug: true },
          }),
        });

        console.log(
          `✅ ${endpoint}: ${response.status} ${response.statusText}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Error response: ${errorText}`);
        } else {
          const responseData = await response.json();
          console.log(`✅ Response data:`, responseData);
        }
      } catch (error) {
        console.error(`❌ ${endpoint}: ${error.message}`);
      }
    }
  },

  // Check extension status
  checkExtensionStatus() {
    console.log("🔍 Checking extension status...");

    const checks = {
      chromeRuntime: typeof chrome !== "undefined" && chrome.runtime,
      tourBuilderLoaded: window.tourBuilderLoaded,
      isTourBuilding: window.isTourBuilding || false,
      stepCounter: window.stepCounter || 0,
    };

    console.table(checks);
    return checks;
  },

  // Simulate tour building
  simulateTourBuilding() {
    console.log("🎯 Simulating tour building...");

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(
        { action: "startTourBuilding" },
        (response) => {
          console.log("Tour building started:", response);
        }
      );
    } else {
      console.error("Chrome runtime not available");
    }
  },

  // Get current page info
  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent,
    };
  },

  // Test element data extraction
  testElementExtraction(element) {
    if (!element) {
      console.error("No element provided");
      return;
    }

    console.log("🔍 Testing element data extraction...");
    console.log("Element:", element);

    // Simulate the extraction logic from content.js
    const elementData = {
      elementType: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.trim(),
      position: element.getBoundingClientRect(),
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {}),
    };

    console.log("Extracted data:", elementData);
    return elementData;
  },

  // Test API endpoints
  testEndpoints() {
    console.log("🔍 Testing API endpoints...");

    const endpoints = [
      "http://localhost:3000/api/Buildtour",
      "https://tour-craft-v1.vercel.app/api/Buildtour",
    ];

    endpoints.forEach((endpoint, index) => {
      console.log(`Endpoint ${index + 1}: ${endpoint}`);
    });

    return {
      endpoints,
      count: endpoints.length,
    };
  },
};

console.log("🔧 Tour Builder Debug utilities loaded");
console.log("Available commands:");
console.log("- window.tourBuilderDebug.testApiConnection()");
console.log("- window.tourBuilderDebug.checkExtensionStatus()");
console.log("- window.tourBuilderDebug.simulateTourBuilding()");
console.log("- window.tourBuilderDebug.getPageInfo()");
console.log("- window.tourBuilderDebug.testElementExtraction(element)");
console.log("- window.tourBuilderDebug.testEndpoints()");
