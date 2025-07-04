"use client";

import { useState, useEffect } from "react";

interface SelectedElement {
  timestamp: number;
  tagName: string;
  id: string | null;
  className: string | null;
  textContent: string | null;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cssSelector: string;
  url: string;
  xpath?: string;
}

export default function CraftTourPage() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>(
    []
  );
  const [isListening, setIsListening] = useState(false);

  // Generate the bookmarklet code
  const generateBookmarklet = () => {
    const inspectorCode = `javascript:(function(){
  if(window.tourcraftActive) {
    alert('Already active!');
    return;
  }
  window.tourcraftActive = true;
 
  let overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute;background:rgba(59,130,246,0.3);border:2px solid #3b82f6;pointer-events:none;z-index:10000;border-radius:4px;display:none;';
  document.body.appendChild(overlay);
 
  function highlight(e) {
    let rect = e.target.getBoundingClientRect();
    overlay.style.top = (rect.top + window.scrollY) + 'px';
    overlay.style.left = (rect.left + window.scrollX) + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';
  }
 
  function click(e) {
    e.preventDefault();
    e.stopPropagation();
   
    let rect = e.target.getBoundingClientRect();
    let data = {
      timestamp: Date.now(),
      tagName: e.target.tagName.toLowerCase(),
      id: e.target.id || null,
      className: e.target.className || null,
      textContent: e.target.textContent?.trim().substring(0, 100) || null,
      position: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      cssSelector: e.target.id ? '#' + e.target.id : e.target.tagName.toLowerCase(),
      url: window.location.href
    };
   
    // Save to localStorage
    let stored = JSON.parse(localStorage.getItem('tourcraft-elements') || '[]');
    stored.push(data);
    localStorage.setItem('tourcraft-elements', JSON.stringify(stored));
   
    console.log('Element selected:', data);
   
    // Visual feedback
    overlay.style.background = 'rgba(34,197,94,0.3)';
    setTimeout(() => overlay.style.background = 'rgba(59,130,246,0.3)', 500);
  }
 
  document.addEventListener('mouseover', highlight, true);
  document.addEventListener('click', click, true);
 
  // Add banner
  let banner = document.createElement('div');
  banner.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;background:#1e40af;color:white;padding:12px;text-align:center;z-index:10001;font-family:Arial;">🎯 TourCraft Inspector Active - Click elements to select</div>';
  document.body.insertBefore(banner, document.body.firstChild);
 
  alert('TourCraft Inspector activated!');
})();`;

    return inspectorCode;
  };

  const bookmarkletCode = generateBookmarklet();

  // Listen for elements from localStorage
  useEffect(() => {
    const checkForElements = () => {
      const stored = localStorage.getItem("tourcraft-elements");
      if (stored) {
        try {
          const elements = JSON.parse(stored);
          if (elements.length > selectedElements.length) {
            setSelectedElements(elements);
          }
        } catch (e) {
          console.error("Error parsing stored elements:", e);
        }
      }
    };

    if (isListening) {
      const interval = setInterval(checkForElements, 1000);
      return () => clearInterval(interval);
    }
  }, [isListening, selectedElements.length]);

  // Listen for postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ELEMENT_SELECTED") {
        console.log("Element received via postMessage:", event.data.data);
        setSelectedElements((prev) => [...prev, event.data.data]);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const startListening = () => {
    setIsListening(true);
    // Clear any existing data
    localStorage.removeItem("tourcraft-elements");
    setSelectedElements([]);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const clearSelection = () => {
    setSelectedElements([]);
    localStorage.removeItem("tourcraft-elements");
  };

  const exportTourData = () => {
    const tourData = {
      url: websiteUrl,
      steps: selectedElements.map((element, index) => ({
        stepNumber: index + 1,
        element: element.cssSelector,
        xpath: element.xpath,
        position: element.position,
        title: `Step ${index + 1}`,
        description: `Interact with ${element.tagName}${
          element.id ? " #" + element.id : ""
        }`,
        element_details: element,
      })),
    };

    const blob = new Blob([JSON.stringify(tourData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tour-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      alert("Bookmarklet copied to clipboard!");
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Craft Tour - Bookmarklet Method
        </h1>

        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="Enter website URL (optional - for reference)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 text-gray-800"
            />
            <button
              onClick={startListening}
              disabled={isListening}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isListening ? "Listening..." : "Start Listening"}
            </button>
            {isListening && (
              <button
                onClick={stopListening}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Stop Listening
              </button>
            )}
            {selectedElements.length > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Clear ({selectedElements.length})
                </button>
                <button
                  onClick={exportTourData}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Export Tour
                </button>
              </>
            )}
          </div>

          {/* Bookmarklet Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              📖 How to Use (3 Steps):
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Copy the bookmarklet code below</li>
              <li>
                Go to any website (e.g.,{" "}
                {websiteUrl || "https://bowblogs.vercel.app/"})
              </li>
              <li>Paste the code in the browser console and press Enter</li>
            </ol>
          </div>

          {/* Bookmarklet Code */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-800">Bookmarklet Code:</h3>
              <button
                onClick={copyBookmarklet}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Copy Code
              </button>
            </div>
            <textarea
              value={bookmarkletCode}
              readOnly
              className="w-full h-32 font-mono text-xs bg-white border border-gray-300  text-gray-500 rounded p-3 resize-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-xs text-gray-600 mt-2">
              💡 Tip: Copy this code, open any website, press F12 to open
              console, paste the code and press Enter
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Selected Elements ({selectedElements.length})
            </h2>
            {isListening && (
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                Listening for Elements
              </div>
            )}
          </div>

          {selectedElements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No elements selected yet</p>
              <p className="text-sm text-gray-400">
                Use the bookmarklet on any website to start selecting elements
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedElements.map((element, index) => (
                <div
                  key={element.timestamp}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="font-medium text-sm text-blue-600 mb-3">
                    Step #{index + 1}
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Tag:</span>
                      <span className="text-blue-600 font-mono">
                        {element.tagName}
                      </span>
                    </div>
                    {element.id && (
                      <div className="flex justify-between">
                        <span className="font-medium">ID:</span>
                        <span className="text-green-600 font-mono">
                          #{element.id}
                        </span>
                      </div>
                    )}
                    {element.className && (
                      <div className="flex justify-between">
                        <span className="font-medium">Class:</span>
                        <span className="text-purple-600 font-mono text-xs">
                          .{element.className.split(" ").join(".")}
                        </span>
                      </div>
                    )}
                    {element.textContent && (
                      <div>
                        <span className="font-medium">Text:</span>
                        <p className="text-gray-600 text-xs mt-1 bg-white p-2 rounded border">
                          {element.textContent}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">Position:</span>
                      <span className="font-mono text-xs">
                        {element.position.x}, {element.position.y}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Size:</span>
                      <span className="font-mono text-xs">
                        {element.position.width} × {element.position.height}
                      </span>
                    </div>
                    <div className="mt-3 p-2 bg-white rounded border">
                      <div className="text-xs font-medium mb-1">
                        CSS Selector:
                      </div>
                      <code className="text-xs text-gray-600 break-all">
                        {element.cssSelector}
                      </code>
                    </div>
                    <div className="text-xs text-gray-500">
                      From: {new URL(element.url).hostname}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
