import mongoose from "mongoose";
import Post from "../models/Post.js";
import dotenv from "dotenv";

dotenv.config();

const wipePosts = async () => {
  try {
    console.log("🚨 STARTING POST WIPE OPERATION 🚨");
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // Count posts before deletion
    const totalPosts = await Post.countDocuments();
    console.log(`📊 Total posts in database: ${totalPosts}`);

    // Find test posts (those with descriptions starting with "Test post")
    const testPosts = await Post.find({
      description: { $regex: /^Test post/i }
    });

    console.log(`🗑️ Test posts to be deleted: ${testPosts.length}`);

    if (testPosts.length > 0) {
      console.log("Test posts found:");
      testPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.description.substring(0, 50)}..." by ${post.firstName} ${post.lastName}`);
      });
    }

    console.log("\n⚠️  WARNING: This will permanently delete all test posts!");
    console.log("⏳ Proceeding with deletion...");

    // Delete test posts
    const deleteResult = await Post.deleteMany({
      description: { $regex: /^Test post/i }
    });

    console.log(`✅ Deleted ${deleteResult.deletedCount} test posts`);

    // Count remaining posts
    const remainingPosts = await Post.countDocuments();
    console.log(`📊 Remaining posts in database: ${remainingPosts}`);

    console.log("\n🎉 POST WIPE COMPLETED SUCCESSFULLY! 🎉");
    console.log("📈 Summary:");
    console.log(`   - Posts before: ${totalPosts}`);
    console.log(`   - Posts after: ${remainingPosts}`);
    console.log(`   - Posts deleted: ${deleteResult.deletedCount}`);

  } catch (error) {
    console.error("❌ Error during post wipe:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

wipePosts();
