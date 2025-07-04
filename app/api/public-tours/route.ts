import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const domain = searchParams.get("domain");
    const url = searchParams.get("url");

    // Validate required parameters
    if (!key || !domain) {
      return NextResponse.json(
        { error: "API key and domain are required" },
        { status: 400 }
      );
    }

    // Find the API key to get the associated tours
    const apiKey = await prisma.tcApiKey.findUnique({
      where: {
        key: key,
        isActive: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Get tours for this API key
    const tours = await prisma.tcTour.findMany({
      where: {
        apiKeyId: apiKey.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        motherUrl: true,
        totalSteps: true,
        createdAt: true,
        updatedAt: true,
        steps: true, // This is stored as JSON
        autoStart: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Parse and filter tours based on domain and URL
    const filteredTours = tours
      .map((tour) => {
        try {
          // Parse the steps JSON
          const stepsData = Array.isArray(tour.steps) ? tour.steps : [];

          // Extract domain from motherUrl
          const tourDomain = new URL(tour.motherUrl).hostname;

          return {
            ...tour,
            domain: tourDomain,
            url: tour.motherUrl,
            steps: stepsData.map((step, index) => {
              const stepData = step as Record<string, unknown>;
              return {
                id: stepData.id || `step-${index}`,
                stepNumber: stepData.stepNumber || index + 1,
                selector: stepData.selector || "",
                textContent: stepData.textContent || stepData.description || "",
                description: stepData.description || stepData.textContent || "",
                MessageToUser: stepData.MessageToUser || stepData.message || "",
                message: stepData.message || stepData.MessageToUser || "",
              };
            }),
          };
        } catch (error) {
          console.warn(`Failed to parse tour ${tour.id}:`, error);
          return null;
        }
      })
      .filter((tour) => {
        if (!tour) return false;

        // Check if domain matches
        if (tour.domain !== domain) return false;

        // If URL is provided, check if it matches
        if (url) {
          // If tour has no specific URL, it matches any URL on the domain
          if (!tour.url) return true;

          // If tour has a specific URL, check if it matches
          if (tour.url === url) return true;

          // Also try matching without protocol and www
          const normalizeUrl = (urlStr: string) =>
            urlStr.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

          return normalizeUrl(tour.url) === normalizeUrl(url);
        }

        return true;
      });

    return NextResponse.json(
      {
        success: true,
        tours: filteredTours,
        count: filteredTours.length,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error fetching public tours:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch public tours",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
