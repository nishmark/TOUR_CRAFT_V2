const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function deleteUnusedApiKey() {
  try {
    console.log("🔍 Checking for API key: apikey1234...");

    // Find the API key
    const apiKey = await prisma.tcApiKey.findUnique({
      where: { key: "apikey1234" },
      include: {
        tours: true, // Include related tours to check if any exist
      },
    });

    if (!apiKey) {
      console.log('❌ API key "apikey1234" not found in database');
      return;
    }

    console.log(`📊 Found API key: ${apiKey.id}`);
    console.log(`📊 Key: ${apiKey.key}`);
    console.log(`📊 Name: ${apiKey.name}`);
    console.log(`📊 Domain: ${apiKey.domain}`);
    console.log(`📊 Associated tours: ${apiKey.tours.length}`);

    if (apiKey.tours.length > 0) {
      console.log("⚠️  WARNING: This API key has associated tours!");
      console.log("   Tours that would be affected:");
      apiKey.tours.forEach((tour) => {
        console.log(`   - ${tour.name} (ID: ${tour.id})`);
      });
      console.log("   Aborting deletion to prevent data loss.");
      return;
    }

    // Safe to delete - no associated tours
    console.log("✅ No associated tours found. Safe to delete.");

    // Delete the API key
    await prisma.tcApiKey.delete({
      where: { id: apiKey.id },
    });

    console.log('✅ API key "apikey1234" deleted successfully!');
  } catch (error) {
    console.error("❌ Error deleting API key:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteUnusedApiKey();
