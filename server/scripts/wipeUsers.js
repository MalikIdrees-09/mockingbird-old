import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const wipeNonAdminUsers = async () => {
  try {
    console.log("🚨 STARTING DATABASE WIPE OPERATION 🚨");
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");

    // Count total users before deletion
    const totalUsersBefore = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsersBefore}`);

    // Count admin users
    const adminUsers = await User.find({ isAdmin: true });
    console.log(`👑 Admin users found: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email})`);
    });

    // Count non-admin users to be deleted
    const nonAdminCount = await User.countDocuments({ isAdmin: { $ne: true } });
    console.log(`🗑️  Non-admin users to be deleted: ${nonAdminCount}`);

    // Ask for confirmation (in a real script you'd add user input)
    console.log("\n⚠️  WARNING: This will permanently delete all non-admin users!");
    console.log("⏳ Proceeding with deletion in 3 seconds...");

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all non-admin users
    const deleteResult = await User.deleteMany({ isAdmin: { $ne: true } });
    console.log(`✅ Deleted ${deleteResult.deletedCount} users`);

    // Count remaining users
    const totalUsersAfter = await User.countDocuments();
    console.log(`📊 Remaining users in database: ${totalUsersAfter}`);

    // Verify only admin users remain
    const remainingAdmins = await User.find({ isAdmin: true });
    console.log(`👑 Remaining admin users: ${remainingAdmins.length}`);
    remainingAdmins.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email})`);
    });

    console.log("\n🎉 DATABASE WIPE COMPLETED SUCCESSFULLY! 🎉");
    console.log(`📈 Summary:`);
    console.log(`   - Users before: ${totalUsersBefore}`);
    console.log(`   - Users after: ${totalUsersAfter}`);
    console.log(`   - Users deleted: ${totalUsersBefore - totalUsersAfter}`);

  } catch (error) {
    console.error("❌ Error during database wipe:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the script
wipeNonAdminUsers();
