import bcrypt from "bcrypt";
import User from "../models/User.js";

/**
 * Initialize admin user on server startup
 * Creates an admin user "idrees" if it doesn't exist
 */
export const initializeAdmin = async () => {
  try {
    console.log("🔧 Initializing admin user...");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: "malikidreeshasankhan@idrees.in" },
        { isAdmin: true }
      ]
    });

    if (existingAdmin) {
      console.log("✅ Admin user already exists:", existingAdmin.email);
      return existingAdmin;
    }

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@2024"; // Configurable via environment
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const adminUser = new User({
      firstName: "Idrees",
      lastName: "Admin",
      email: "malikidreeshasankhan@idrees.in",
      password: passwordHash,
      picturePath: "admin-avatar.jpg", // Default admin avatar
      friends: [],
      location: "Admin Panel",
      occupation: "System Administrator",
      viewedProfile: 0,
      impressions: 0,
      isAdmin: true, // Set admin flag
      isBanned: false,
      isVerified: true, // Admin is automatically verified
    });

    const savedAdmin = await adminUser.save();
    console.log("🎉 Admin user created successfully!");
    console.log("📧 Email:", savedAdmin.email);
    console.log("🔑 Password:", adminPassword);
    console.log("⚠️  Please change the default password after first login!");

    return savedAdmin;
  } catch (error) {
    console.error("❌ Error initializing admin user:", error.message);
    throw error;
  }
};

/**
 * Initialize sample data if database is empty
 */
export const initializeSampleData = async () => {
  try {
    const userCount = await User.countDocuments();
    
    if (userCount <= 1) { // Only admin exists
      console.log("📊 Database appears empty, initializing sample data...");
      
      // Import sample data
      const { users, posts } = await import("../data/index.js");
      const Post = (await import("../models/Post.js")).default;
      
      // Insert sample users (excluding admin)
      const sampleUsers = users.map(user => ({
        ...user,
        isAdmin: false, // Ensure sample users are not admin (except the one we defined)
        isBanned: false
      }));
      
      await User.insertMany(sampleUsers);
      console.log(`✅ Inserted ${sampleUsers.length} sample users`);
      
      // Insert sample posts
      const postCount = await Post.countDocuments();
      if (postCount === 0) {
        await Post.insertMany(posts);
        console.log(`✅ Inserted ${posts.length} sample posts`);
      }
    } else {
      console.log("📊 Database already has users, skipping sample data initialization");
    }
  } catch (error) {
    console.error("❌ Error initializing sample data:", error.message);
  }
};

/**
 * Main initialization function
 */
export const runInitialization = async () => {
  console.log("🚀 Starting Mockingbird initialization...");
  
  try {
    // Initialize admin user
    await initializeAdmin();
    
    // Initialize sample data if needed
    await initializeSampleData();
    
    console.log("✅ Mockingbird initialization completed successfully!");
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
  }
};
