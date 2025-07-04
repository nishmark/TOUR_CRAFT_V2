"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TourStep {
  // Basic element identification
  elementType: string;
  id: string | null;
  className: string | null;
  selector: string;

  // Element content
  textContent: string;
  innerHTML: string;
  value: string | null;

  // All HTML attributes
  attributes: Record<string, string>;

  // Form-specific data (if applicable)
  formData?: {
    type?: string;
    value?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    checked?: boolean;
    selectedIndex?: number;
    options?: Array<{
      text: string;
      value: string;
      selected: boolean;
    }>;
    rows?: number;
    cols?: number;
  } | null;

  // Element position and dimensions
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  viewportPosition: {
    x: number;
    y: number;
  };

  // Element visibility and state
  isVisible: boolean;
  isClickable: boolean;

  // Element hierarchy
  parent: {
    tagName: string;
    id: string;
    className: string;
  } | null;
  children: Array<{
    tagName: string;
    id: string;
    className: string;
    textContent: string;
  }>;

  // Computed styles (key ones)
  styles: {
    backgroundColor: string;
    color: string;
    fontSize: string;
    fontFamily: string;
    border: string;
    borderRadius: string;
    display: string;
    position: string;
    zIndex: string;
    cursor: string;
  };

  // Page context
  url: string;
  pageTitle: string;

  // Tour metadata
  timestamp: string;
  stepNumber: number;

  // Additional element properties
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
  offsetWidth: number;
  offsetHeight: number;

  // Accessibility information
  accessibility: {
    role: string | null;
    ariaLabel: string | null;
    ariaDescribedBy: string | null;
    tabIndex: number;
    title: string;
  };

  metadata?: {
    userAgent: string;
    url: string;
    title: string;
  };

  // User message for this step
  MessageToUser?: string;
}

export default function BuildTourPage() {
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [tourName, setTourName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [autoStart, setAutoStart] = useState(false);

  // Function to update user message for a specific step (local only)
  const updateUserMessage = (stepIndex: number, message: string) => {
    const updatedSteps = [...tourSteps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      MessageToUser: message,
    };
    setTourSteps(updatedSteps);
  };

  // Fetch function for getting tour steps
  const fetchTourSteps = useCallback(async () => {
    try {
      const response = await fetch("/api/Buildtour");
      if (response.ok) {
        const data = await response.json();
        const newSteps = data.steps || [];

        // Preserve user messages from current state when updating with new data
        setTourSteps((prevSteps) => {
          return newSteps.map((newStep: TourStep, index: number) => {
            const existingStep = prevSteps[index];
            return {
              ...newStep,
              // Preserve the user message if it exists in the current state
              MessageToUser:
                existingStep?.MessageToUser || newStep.MessageToUser || "",
            };
          });
        });

        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Failed to fetch tour steps:", error);
      setIsConnected(false);
    }
  }, []);

  // Initial data fetch on component mount
  useEffect(() => {
    // Fetch data once when component mounts
    fetchTourSteps();
  }, [fetchTourSteps]);

  const clearSteps = async () => {
    try {
      // Call the DELETE API to clear steps from backend
      const response = await fetch("/api/Buildtour", {
        method: "DELETE",
      });

      if (response.ok) {
        // Clear the UI state
        setTourSteps([]);

        console.log("✅ Tour steps cleared successfully");
      } else {
        console.error("❌ Failed to clear tour steps");
      }
    } catch (error) {
      console.error("❌ Error clearing tour steps:", error);
    }
  };

  const moveStepUp = (index: number) => {
    if (index > 0) {
      const newSteps = [...tourSteps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index - 1];
      newSteps[index - 1] = temp;
      setTourSteps(newSteps);
      saveReorderedSteps(newSteps);
    }
  };

  const moveStepDown = (index: number) => {
    if (index < tourSteps.length - 1) {
      const newSteps = [...tourSteps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index + 1];
      newSteps[index + 1] = temp;
      setTourSteps(newSteps);
      saveReorderedSteps(newSteps);
    }
  };

  const saveReorderedSteps = async (steps: TourStep[]) => {
    try {
      const response = await fetch("/api/Buildtour", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tourcraft1234",
        },
        body: JSON.stringify({ steps }),
      });

      if (response.ok) {
        console.log("✅ Steps reordered and saved successfully");
      } else {
        console.error("❌ Failed to save reordered steps");
      }
    } catch (error) {
      console.error("❌ Error saving reordered steps:", error);
    }
  };

  const saveTourToDatabase = async () => {
    if (!tourName.trim()) {
      alert("Please enter a tour name");
      return;
    }

    if (tourSteps.length === 0) {
      alert("No steps to save");
      return;
    }

    setIsSaving(true);
    try {
      // Get the mother URL from the first step
      const motherUrl = tourSteps[0]?.url || "unknown";

      // Prepare step data in the format you specified
      const formattedSteps = tourSteps.map((step, index) => ({
        stepNumber: index + 1,
        textContent: step.textContent || "No text content",
        elementType: step.elementType,
        elementId: step.id || "No ID",
        selector: step.selector,
        url: step.url,
        clickable: step.isClickable ? "Yes" : "No",
        MessageToUser: step.MessageToUser || "", // Include the user message
      }));

      const tourData = {
        name: tourName.trim(),
        motherUrl: motherUrl,
        totalSteps: tourSteps.length,
        stepsOrder: tourSteps.map((_, index) => index + 1), // Step numbers in order
        steps: formattedSteps,
        autoStart: autoStart,
      };

      const response = await fetch("/api/Buildtour/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer tourcraft1234",
        },
        body: JSON.stringify(tourData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Tour saved successfully:", result);
        alert(`Tour "${tourName}" saved successfully with all messages!`);
        setShowSaveModal(false);
        setTourName("");
        setAutoStart(false);
        // Optionally clear the steps after saving
        // await clearSteps();
      } else {
        const error = await response.json();
        console.error("❌ Failed to save tour:", error);
        alert("Failed to save tour. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error saving tour:", error);
      alert("Error saving tour. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Tour Builder Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Use the Chrome extension to start building guided tours. Click
            elements on any website to record tour steps.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Extension Status
                </h3>
                <p className="text-gray-600">
                  {isConnected
                    ? "Connected - Use Refresh button to load new steps"
                    : "Connecting to tour data..."}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                {tourSteps.length}
              </div>
              <div className="text-sm text-gray-500">Steps Recorded</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            How to Use
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Install Extension</p>
                  <p className="text-gray-600 text-sm">
                    Load the Chrome extension in developer mode
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Start Building</p>
                  <p className="text-gray-600 text-sm">
                    Click the extension icon and start tour building
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Navigate & Click</p>
                  <p className="text-gray-600 text-sm">
                    Go to your website and click elements to record
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900">Monitor Progress</p>
                  <p className="text-gray-600 text-sm">
                    Watch tour steps appear here in real-time
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tour Steps */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Recorded Tour Steps
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={fetchTourSteps}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Refresh
              </button>
              {tourSteps.length > 0 && (
                <>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    💾 Save Tour
                  </button>
                  <button
                    onClick={clearSteps}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Clear Steps
                  </button>
                </>
              )}
            </div>
          </div>

          {tourSteps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No tour steps recorded yet
              </h4>
              <p className="text-gray-600">
                Start using the Chrome extension to record tour steps
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tourSteps.map((step, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-indigo-100 text-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => moveStepUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded ${
                              index === 0
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-blue-600 hover:bg-blue-100 hover:text-blue-800"
                            }`}
                            title="Move step up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveStepDown(index)}
                            disabled={index === tourSteps.length - 1}
                            className={`p-1 rounded ${
                              index === tourSteps.length - 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-blue-600 hover:bg-blue-100 hover:text-blue-800"
                            }`}
                            title="Move step down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      <div className="ml-11 space-y-2">
                        <p className="text-gray-600 text-sm">
                          <span className="font-semibold">
                            Text In This Element:
                          </span>{" "}
                          {step.textContent ? (
                            <span>
                              &quot;{step.textContent.substring(0, 100)}
                              {step.textContent.length > 100 ? "..." : ""}&quot;
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">
                              No text content
                            </span>
                          )}
                        </p>

                        <p className="text-gray-600 text-sm">
                          <span className="font-semibold">Element Type:</span>{" "}
                          {step.elementType}
                        </p>

                        <p className="text-gray-600 text-sm">
                          <span className="font-semibold">Element ID:</span>{" "}
                          {step.id ? (
                            <span>{step.id}</span>
                          ) : (
                            <span className="text-gray-400 italic">No ID</span>
                          )}
                        </p>

                        <p className="text-gray-600 text-sm">
                          <span className="font-semibold">Selector:</span>{" "}
                          {step.selector}
                        </p>

                        <p className="text-gray-600 text-sm truncate">
                          <span className="font-semibold">URL:</span> {step.url}
                        </p>

                        <p className="text-gray-600 text-sm">
                          <span className="font-semibold">Clickable:</span>{" "}
                          {step.isClickable ? "Yes" : "No"}
                        </p>

                        {/* User Message Input */}
                        <div className="mt-3">
                          <label className="block text-sm font-bold text-blue-600 mb-1">
                            Write message for user:
                          </label>
                          <input
                            key={`message-input-${index}-${step.stepNumber}`}
                            type="text"
                            value={step.MessageToUser || ""}
                            onChange={(e) =>
                              updateUserMessage(index, e.target.value)
                            }
                            placeholder="Enter a message to guide the user for this step..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          />
                        </div>

                        {/* DEBUG: Show raw data */}
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                            🔍 Debug: Show Raw Data
                          </summary>
                          <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(step, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>

                    <div className="text-right text-xs text-gray-500">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Status */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            API Endpoint:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              POST /api/Buildtour
            </code>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Click the Refresh button above to load the latest tour steps
          </p>
        </div>
      </div>

      {/* Save Tour Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Save Tour
            </h3>

            <div className="mb-4">
              <label
                htmlFor="tourName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tour Name *
              </label>
              <input
                type="text"
                id="tourName"
                value={tourName}
                onChange={(e) => setTourName(e.target.value)}
                placeholder="Enter tour name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                autoFocus
              />
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Tour Summary:</strong>
              </p>
              <p className="text-sm text-gray-600">
                • Total Steps: {tourSteps.length}
              </p>
              <p className="text-sm text-gray-600">
                • Mother URL: {tourSteps[0]?.url || "Unknown"}
              </p>
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoStart}
                  onChange={(e) => setAutoStart(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Start tour automatically when page loads
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                If enabled, the tour will start immediately without requiring
                user interaction
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setTourName("");
                  setAutoStart(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveTourToDatabase}
                disabled={isSaving || !tourName.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save Tour"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
