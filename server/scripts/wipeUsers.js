import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const wipeAllUsers = async () => {
  try {
    console.log("Starting database wipe operation");
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Count total users before deletion
    const totalUsersBefore = await User.countDocuments();
    console.log(`Total users in database: ${totalUsersBefore}`);

    // Count admin users
    const adminUsers = await User.find({ isAdmin: true });
    console.log(`Admin users found: ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email})`);
    });

    // Count total users scheduled for deletion
    console.log(`Total users to be deleted (including admins): ${totalUsersBefore}`);

    // Ask for confirmation (in a real script you'd add user input)
    console.log("\nWARNING: This will permanently delete ALL users!");
    console.log("Proceeding with deletion in 3 seconds...");

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete all users, including admins
    const deleteResult = await User.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} users`);

    // Count remaining users
    const totalUsersAfter = await User.countDocuments();
    console.log(`Remaining users in database: ${totalUsersAfter}`);

    // Verify only admin users remain
    const remainingAdmins = await User.find({ isAdmin: true });
    console.log(`Remaining admin users: ${remainingAdmins.length}`);
    if (remainingAdmins.length > 0) {
      remainingAdmins.forEach(admin => {
        console.log(`   - ${admin.firstName} ${admin.lastName} (${admin.email})`);
      });
    }

    console.log("\nDatabase wipe completed successfully");
    console.log(`📈 Summary:`);
    console.log(`   - Users before: ${totalUsersBefore}`);
    console.log(`   - Users after: ${totalUsersAfter}`);
    console.log(`   - Users deleted: ${totalUsersBefore - totalUsersAfter}`);

  } catch (error) {
    console.error("Error during database wipe:", error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the script
wipeAllUsers();
