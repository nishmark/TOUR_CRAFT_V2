import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

// Initialize Prisma client with error handling
let prisma: PrismaClient;

try {
  prisma = new PrismaClient();
} catch (error: unknown) {
  console.error("❌ Failed to initialize Prisma client:", error);
  prisma = null as unknown as PrismaClient;
}

interface TourSaveData {
  name: string;
  motherUrl: string;
  totalSteps: number;
  stepsOrder: number[];
  autoStart?: boolean; // Whether tour should start automatically
  steps: Array<{
    stepNumber: number;
    textContent: string;
    elementType: string;
    elementId: string;
    selector: string;
    url: string;
    clickable: string;
    MessageToUser?: string; // Add the user message field
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated session
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Parse the request body
    const body: TourSaveData = await request.json();
    const {
      name,
      motherUrl,
      totalSteps,
      stepsOrder,
      steps,
      autoStart = false,
    } = body;

    // Validate required fields
    if (!name || !motherUrl || totalSteps === undefined || !steps) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create API key (using a default one for now)
    let apiKey = await prisma.tcApiKey.findFirst({
      where: { key: "tourcraft1234" },
    });

    if (!apiKey) {
      apiKey = await prisma.tcApiKey.create({
        data: {
          key: "tourcraft1234",
          name: "Default API Key",
          domain: "localhost",
          isActive: true,
        },
      });
    }

    // Find or create the authenticated user
    let user = await prisma.tcUser.findFirst({
      where: { email: session.user.email },
    });

    if (!user) {
      user = await prisma.tcUser.create({
        data: {
          email: session.user.email,
          name: session.user.name || "User",
          emailVerified: true,
        },
      });
    }

    // Create the tour in the database
    const tour = await prisma.tcTour.create({
      data: {
        apiKeyId: apiKey.id,
        userId: user.id,
        name: name,
        motherUrl: motherUrl,
        totalSteps: totalSteps,
        stepsOrder: stepsOrder,
        steps: steps,
        autoStart: autoStart,
        isActive: true,
      },
    });

    console.log("✅ Tour saved to database:", {
      id: tour.id,
      name: tour.name,
      steps: tour.totalSteps,
      motherUrl: tour.motherUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Tour saved successfully",
      tour: {
        id: tour.id,
        name: tour.name,
        totalSteps: tour.totalSteps,
        motherUrl: tour.motherUrl,
        createdAt: tour.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error saving tour:", error);

    return NextResponse.json(
      {
        error: "Failed to save tour",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
