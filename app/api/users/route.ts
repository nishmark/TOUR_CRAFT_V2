import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.tcUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            tours: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      users: users,
      count: users.length,
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
