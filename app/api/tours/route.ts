import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const tours = await prisma.tcTour.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        totalSteps: true,
        createdAt: true,
        updatedAt: true,
        motherUrl: true,
        steps: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      tours: tours,
      count: tours.length,
    });
  } catch (error) {
    console.error("❌ Error fetching tours:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch tours",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tourId = searchParams.get("id");

    if (!tourId) {
      return NextResponse.json(
        { error: "Tour ID is required" },
        { status: 400 }
      );
    }

    // First, check if the tour exists
    const existingTour = await prisma.tcTour.findUnique({
      where: { id: tourId },
    });

    if (!existingTour) {
      return NextResponse.json(
        { error: "Tour not found" },
        { status: 404 }
      );
    }

    // Delete the tour (this will cascade delete the steps due to the foreign key relationship)
    await prisma.tcTour.delete({
      where: { id: tourId },
    });

    console.log(`✅ Tour ${tourId} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: "Tour deleted successfully",
      tourId: tourId,
    });
  } catch (error) {
    console.error("❌ Error deleting tour:", error);

    return NextResponse.json(
      {
        error: "Failed to delete tour",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
