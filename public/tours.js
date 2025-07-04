// TourCraft Tour Execution Script
// This script is loaded on client websites to execute tours

(function () {
  "use strict";

  // Configuration
  const API_KEY = "tourcraft1234";
  const API_BASE_URL = "https://tour-craft-v2-6u9h.vercel.app/api"; // Update this to your actual API URL

  // Tour execution state
  let currentTour = null;
  let currentStepIndex = 0;
  let isTourActive = false;
  let highlightElement = null;
  let tourOverlay = null;
  let stepModal = null;
  let isLoading = false;

  // Utility functions
  function getCurrentDomain() {
    return window.location.hostname;
  }

  function getCurrentPath() {
    return window.location.pathname;
  }

  function getCurrentUrl() {
    return window.location.href;
  }

  function findElement(selector) {
    try {
      return document.querySelector(selector);
    } catch (e) {
      console.warn("TourCraft: Invalid selector:", selector);
      return null;
    }
  }

  // API functions
  async function fetchToursFromAPI() {
    try {
      console.log("TourCraft: Fetching tours for current domain...");

      const response = await fetch(
        `${API_BASE_URL}/public-tours?key=${API_KEY}&domain=${getCurrentDomain()}&url=${encodeURIComponent(
          getCurrentUrl()
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("TourCraft: Tours fetched successfully:", data);
      return data;
    } catch (error) {
      console.error("TourCraft: Failed to fetch tours:", error);
      return null;
    }
  }

  function findMatchingTour(toursData, currentDomain, currentUrl) {
    if (!toursData || !toursData.tours) {
      return null;
    }

    // Find tour that matches current domain and URL
    return toursData.tours.find((tour) => {
      // Check if domain matches
      if (tour.domain !== currentDomain) {
        return false;
      }

      // If tour has specific URL, check if it matches
      if (tour.url && tour.url !== currentUrl) {
        // Also try matching without protocol and www
        const normalizeUrl = (url) =>
          url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
        if (normalizeUrl(tour.url) !== normalizeUrl(currentUrl)) {
          return false;
        }
      }

      return true;
    });
  }

  // UI Creation functions (keeping your existing excellent UI code)
  function createHighlight(element) {
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const highlight = document.createElement("div");

    highlight.style.cssText = `
        position: fixed;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        border: 3px solid #3b82f6;
        border-radius: 4px;
        background: rgba(59, 130, 246, 0.1);
        pointer-events: none;
        z-index: 10000;
        animation: tourPulse 2s infinite;
      `;

    // Add pulse animation (only once)
    if (!document.getElementById("tourcraft-styles")) {
      const style = document.createElement("style");
      style.id = "tourcraft-styles";
      style.textContent = `
          @keyframes tourPulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          
          .tourcraft-loading {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
      document.head.appendChild(style);
    }

    return highlight;
  }

  function createTourOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "tourcraft-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        pointer-events: none;
      `;
    return overlay;
  }

  function createStepModal(step) {
    const modal = document.createElement("div");
    modal.id = "tourcraft-modal";
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

    modal.innerHTML = `
        <div style="margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
            Step ${step.stepNumber || currentStepIndex + 1}
          </h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            ${step.textContent || step.description || "Tour step"}
          </p>
        </div>
        ${
          step.MessageToUser || step.message
            ? `
          <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              💡 ${step.MessageToUser || step.message}
            </p>
          </div>
        `
            : ""
        }
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="tourcraft-prev" style="
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Previous</button>
          <button id="tourcraft-next" style="
            padding: 8px 16px;
            border: none;
            background: #3b82f6;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Next</button>
          <button id="tourcraft-close" style="
            padding: 8px 16px;
            border: none;
            background: #ef4444;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Close Tour</button>
        </div>
      `;

    return modal;
  }

  function createLoadingIndicator() {
    const loading = document.createElement("div");
    loading.id = "tourcraft-loading";
    loading.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-size: 24px;
      `;
    loading.innerHTML = '<div class="tourcraft-loading">⏳</div>';
    return loading;
  }

  function createTourTrigger(tour) {
    // Remove existing trigger if any
    const existingTrigger = document.getElementById("tourcraft-trigger");
    if (existingTrigger) {
      existingTrigger.remove();
    }

    const trigger = document.createElement("div");
    trigger.id = "tourcraft-trigger";
    trigger.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-size: 24px;
        transition: transform 0.2s;
      `;
    trigger.innerHTML = "🎯";
    trigger.title = `Start ${tour.name || "Tour"}`;

    trigger.addEventListener("click", () => {
      startTour(tour);
    });

    trigger.addEventListener("mouseenter", () => {
      trigger.style.transform = "scale(1.1)";
    });

    trigger.addEventListener("mouseleave", () => {
      trigger.style.transform = "scale(1)";
    });

    document.body.appendChild(trigger);
    console.log(
      `🎯 TourCraft: Tour trigger created for "${tour.name || "Unnamed Tour"}"`
    );
  }

  // Tour execution functions (keeping your existing logic)
  function showStep(stepIndex) {
    if (
      !currentTour ||
      !currentTour.steps ||
      stepIndex >= currentTour.steps.length
    ) {
      endTour();
      return;
    }

    const step = currentTour.steps[stepIndex];
    const element = findElement(step.selector);

    // Clear previous highlight
    if (highlightElement) {
      highlightElement.remove();
      highlightElement = null;
    }

    // Create overlay if not exists
    if (!tourOverlay) {
      tourOverlay = createTourOverlay();
      document.body.appendChild(tourOverlay);
    }

    // Highlight element if found
    if (element) {
      highlightElement = createHighlight(element);
      document.body.appendChild(highlightElement);

      // Scroll element into view
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      console.warn(
        `TourCraft: Element not found for selector: ${step.selector}`
      );
    }

    // Show step modal
    if (stepModal) {
      stepModal.remove();
    }
    stepModal = createStepModal(step);
    document.body.appendChild(stepModal);

    // Add event listeners
    const prevBtn = stepModal.querySelector("#tourcraft-prev");
    const nextBtn = stepModal.querySelector("#tourcraft-next");
    const closeBtn = stepModal.querySelector("#tourcraft-close");

    prevBtn.addEventListener("click", () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        showStep(currentStepIndex);
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentStepIndex < currentTour.steps.length - 1) {
        currentStepIndex++;
        showStep(currentStepIndex);
      } else {
        endTour();
      }
    });

    closeBtn.addEventListener("click", endTour);

    // Update button states
    prevBtn.disabled = currentStepIndex === 0;
    nextBtn.textContent =
      currentStepIndex === currentTour.steps.length - 1 ? "Finish" : "Next";

    // Disable previous button visually
    if (currentStepIndex === 0) {
      prevBtn.style.opacity = "0.5";
      prevBtn.style.cursor = "not-allowed";
    }
  }

  function startTour(tourData) {
    if (isTourActive) return;

    console.log("TourCraft: Starting tour:", tourData);
    currentTour = tourData;
    currentStepIndex = 0;
    isTourActive = true;

    // Remove trigger button
    const trigger = document.getElementById("tourcraft-trigger");
    if (trigger) {
      trigger.remove();
    }

    showStep(0);
  }

  function endTour() {
    console.log("TourCraft: Ending tour");

    if (highlightElement) {
      highlightElement.remove();
      highlightElement = null;
    }
    if (tourOverlay) {
      tourOverlay.remove();
      tourOverlay = null;
    }
    if (stepModal) {
      stepModal.remove();
      stepModal = null;
    }

    currentTour = null;
    currentStepIndex = 0;
    isTourActive = false;

    // Restore trigger button after a short delay
    setTimeout(checkForTour, 1000);
  }

  // Main initialization function
  async function checkForTour() {
    if (isLoading || isTourActive) return;

    console.log("TourCraft: Checking for tours...");
    isLoading = true;

    // Show loading indicator
    const loading = createLoadingIndicator();
    document.body.appendChild(loading);

    try {
      // Fetch tours from API
      const toursData = await fetchToursFromAPI();

      if (toursData) {
        const currentDomain = getCurrentDomain();
        const currentUrl = getCurrentUrl();

        console.log(`TourCraft: Looking for tours on ${currentDomain}`);

        // Find matching tour for current page
        const tour = findMatchingTour(toursData, currentDomain, currentUrl);

        if (tour && tour.steps && tour.steps.length > 0) {
          console.log(
            `🎯 TourCraft: Found tour "${tour.name}" with ${tour.steps.length} steps`
          );
          
          // Check if tour should start automatically
          if (tour.autoStart) {
            console.log("🚀 TourCraft: Auto-starting tour...");
            // Small delay to ensure page is fully loaded
            setTimeout(() => startTour(tour), 1000);
          } else {
            createTourTrigger(tour);
          }
        } else {
          console.log("TourCraft: No matching tours found for current page");
        }
      }
    } catch (error) {
      console.error("TourCraft: Error checking for tours:", error);
    } finally {
      // Remove loading indicator
      if (loading) {
        loading.remove();
      }
      isLoading = false;
    }
  }

  // Initialize when DOM is ready
  function initialize() {
    console.log("🎯 TourCraft: Initializing...");

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", checkForTour);
    } else {
      // Small delay to ensure page is fully rendered
      setTimeout(checkForTour, 500);
    }

    // Also check when URL changes (for SPA support)
    let currentUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log("TourCraft: URL changed, checking for new tours...");
        setTimeout(checkForTour, 1000);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Expose functions globally for external use
  window.TourCraft = {
    startTour,
    endTour,
    checkForTour,
    initialize,
    version: "1.0.0",
    apiKey: API_KEY,
  };

  // Auto-initialize
  initialize();
})();
