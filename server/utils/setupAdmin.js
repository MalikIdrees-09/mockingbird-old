import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const setupAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/mockingbird", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Create admin user "idrees"
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash("Mockingbird2718281828459045", salt);

    const adminUser = new User({
      firstName: "Malik Idrees Hasan",
      lastName: "Khan",
      email: "malikidreeshasankhan@idrees.in",
      password: passwordHash,
      picturePath: "",
      friends: [],
      location: "Markaz Knowledge City",
      isAdmin: true,
      isVerified: true, // Admin is automatically verified
    });

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: "malikidreeshasankhan@idrees.in" });
    if (existingAdmin) {
      // Update existing user to be admin and verified, and update password
      existingAdmin.isAdmin = true;
      existingAdmin.isVerified = true;
      existingAdmin.password = passwordHash; // Update password too
      await existingAdmin.save();
      console.log("✅ Existing user updated to admin status!");
      console.log("📧 Email: malikidreeshasankhan@idrees.in");
      console.log("🔑 Password: Mockingbird2718281828459045");
    } else {
      await adminUser.save();
      console.log("✅ Admin user created successfully!");
      console.log("📧 Email: malikidreeshasankhan@idrees.in");
      console.log("🔑 Password: Mockingbird2718281828459045");
    }

    mongoose.connection.close();
    console.log("🔌 Database connection closed.");
    console.log("\n🎭 Mockingbird is ready! You can now:");
    console.log("1. Login as admin: malikidreeshasankhan@idrees.in / Mockingbird2718281828459045");
    console.log("2. Access admin panel at /admin (admin only)");
  } catch (error) {
    console.error("❌ Error setting up admin user:", error);
    mongoose.connection.close();
  }
};

setupAdmin();
