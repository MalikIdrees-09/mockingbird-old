import mongoose from "mongoose";
import Post from "../models/Post.js";
import dotenv from "dotenv";

dotenv.config();

const checkPosts = async () => {
  try {
    console.log("🔍 CHECKING POSTS IN DATABASE...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const totalPosts = await Post.countDocuments();
    console.log(`📊 Total posts in database: ${totalPosts}`);

    if (totalPosts > 0) {
      console.log("\n📝 All posts:");
      const posts = await Post.find({}).select('firstName lastName description').sort({ createdAt: -1 });
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.firstName} ${post.lastName}: "${post.description?.substring(0, 60)}..."`);
      });
    }

    // Check for test posts specifically
    const testPosts = await Post.find({
      description: { $regex: /^Test post/i }
    });

    if (testPosts.length > 0) {
      console.log(`\n❌ Still found ${testPosts.length} test posts that should have been deleted:`);
      testPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. "${post.description?.substring(0, 50)}..."`);
      });
    } else {
      console.log("\n✅ No test posts found - database is clean!");
    }

  } catch (error) {
    console.error("❌ Error checking posts:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
};

checkPosts();
