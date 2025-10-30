import mongoose from "mongoose";
import User from "../models/User.js";
import Post from "../models/Post.js";
import dotenv from "dotenv";

dotenv.config();

const cleanupDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/mockingbird", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Delete all posts
    console.log("Deleting all posts...");
    const postsDeleted = await Post.deleteMany({});
    console.log(`Deleted ${postsDeleted.deletedCount} posts`);

    // Delete all users except admin
    console.log("Deleting all users except admin...");
    const usersDeleted = await User.deleteMany({
      email: { $ne: "malikidreeshasankhan@idrees.in" }
    });
    console.log(`Deleted ${usersDeleted.deletedCount} users`);

    // Verify admin user still exists
    const adminUser = await User.findOne({ email: "malikidreeshasankhan@idrees.in" });
    if (adminUser) {
      console.log(`Admin user preserved: ${adminUser.email}`);
      console.log(`Admin: ${adminUser.firstName} ${adminUser.lastName}`);
    } else {
      console.log("Warning: Admin user not found!");
    }

    // Show final counts
    const finalUserCount = await User.countDocuments();
    const finalPostCount = await Post.countDocuments();

    console.log("\nFinal Database Status:");
    console.log(`Users remaining: ${finalUserCount}`);
    console.log(`Posts remaining: ${finalPostCount}`);

    console.log("\nDatabase cleanup completed successfully!");
    console.log("Admin login credentials:");
    console.log("Email: malikidreeshasankhan@idrees.in");
    console.log("Password: Admin@2024");

    mongoose.connection.close();
    console.log("Database connection closed.");

  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    mongoose.connection.close();
  }
};

cleanupDatabase();
