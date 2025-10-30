import mongoose from "mongoose";
import Post from "../models/Post.js";
import dotenv from "dotenv";

dotenv.config();

const wipePosts = async () => {
  try {
    console.log("Starting post wipe operation");
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Count posts before deletion
    const totalPosts = await Post.countDocuments();
    console.log(`Total posts in database: ${totalPosts}`);

    console.log("\nWARNING: This will permanently delete ALL posts!");
    console.log("Proceeding with deletion...");

    // Delete all posts
    const deleteResult = await Post.deleteMany({});

    console.log(`Deleted ${deleteResult.deletedCount} posts`);

    // Count remaining posts
    const remainingPosts = await Post.countDocuments();
    console.log(`Remaining posts in database: ${remainingPosts}`);

    console.log("\nAll posts removed successfully");
    console.log("Summary:");
    console.log(`   - Posts before: ${totalPosts}`);
    console.log(`   - Posts after: ${remainingPosts}`);
    console.log(`   - Posts deleted: ${deleteResult.deletedCount}`);

  } catch (error) {
    console.error("Error during post wipe:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
};

wipePosts();
