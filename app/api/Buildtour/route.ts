import { NextRequest, NextResponse } from "next/server";

// Define the expected data structure
interface TourData {
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

  // User message for this step
  MessageToUser?: string;
}

interface RequestBody {
  tourData: TourData;
  metadata: {
    userAgent: string;
    url: string;
    title: string;
  };
}

// Store tour steps in memory (in production, use a database)
let tourSteps: Array<TourData & { metadata: unknown }> = [];

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Received POST request to /api/Buildtour");

    // Parse the request body
    const body: RequestBody = await request.json();
    const { tourData, metadata } = body;

    // Store the step in memory
    tourSteps.push({
      ...tourData,
      metadata,
    });

    // Keep only last 50 steps to prevent memory issues
    if (tourSteps.length > 50) {
      tourSteps = tourSteps.slice(-50);
    }

    // Log the received data
    console.log("📍 Tour Step Received:", {
      step: tourData.stepNumber,
      element: tourData.elementType,
      selector: tourData.selector,
      text: tourData.textContent?.substring(0, 50) + "...",
      url: tourData.url,
    });

    const response = {
      success: true,
      message: "Tour step recorded successfully",
      step: tourData.stepNumber,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  } catch (error) {
    console.error("❌ Error processing tour data:", error);

    return NextResponse.json(
      {
        error: "Failed to process tour data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      }
    );
  }
}

// GET endpoint to fetch stored tour steps
export async function GET() {
  try {
    console.log("🔍 Received GET request to /api/Buildtour");
    console.log("📊 Returning", tourSteps.length, "tour steps");

    return NextResponse.json(
      {
        success: true,
        steps: tourSteps,
        count: tourSteps.length,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tour steps" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      }
    );
  }
}

// PUT endpoint to update/reorder tour steps
export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { steps } = body;

    // Update the tour steps with the new order
    if (Array.isArray(steps)) {
      tourSteps = steps;
      console.log("🔄 Tour steps reordered:", steps.length, "steps");
    }

    return NextResponse.json(
      {
        success: true,
        message: "Tour steps reordered successfully",
        count: tourSteps.length,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error reordering tour steps:", error);

    return NextResponse.json(
      {
        error: "Failed to reorder tour steps",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// Handle CORS for the Chrome extension
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// DELETE endpoint to clear all tour steps
export async function DELETE() {
  try {
    // Clear all tour steps from memory
    tourSteps = [];

    console.log("🗑️ All tour steps cleared");

    return NextResponse.json(
      {
        success: true,
        message: "All tour steps cleared successfully",
        count: 0,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error clearing tour steps:", error);

    return NextResponse.json(
      {
        error: "Failed to clear tour steps",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}
