import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const renameAdminUser = async () => {
  try {
    console.log("🔄 STARTING ADMIN USER RENAME OPERATION 🔄");
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    // Find the admin user
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log("❌ No admin user found!");
      return;
    }

    console.log(`👤 Current admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);

    // Update the admin user's name
    const oldName = `${adminUser.firstName} ${adminUser.lastName}`;
    adminUser.firstName = "Malik";
    adminUser.lastName = "Idrees Hasan Khan";

    // Save the updated user
    await adminUser.save();

    console.log(`✅ Successfully renamed admin user:`);
    console.log(`   From: ${oldName}`);
    console.log(`   To: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`   Email: ${adminUser.email}`);

    // Verify the update
    const updatedUser = await User.findOne({ isAdmin: true });
    console.log(`🔍 Verification - Updated user: ${updatedUser.firstName} ${updatedUser.lastName}`);

    console.log("\n🎉 ADMIN USER RENAME COMPLETED SUCCESSFULLY! 🎉");

  } catch (error) {
    console.error("❌ Error during admin user rename:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the script
renameAdminUser();
