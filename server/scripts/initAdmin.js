import bcrypt from "bcrypt";
import User from "../models/User.js";

/**
 * Initialize admin user on server startup
 * Creates an admin user "idrees" if it doesn't exist
 */
export const initializeAdmin = async () => {
  try {
    console.log("Initializing admin user...");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: "malikidreeshasankhan@idrees.in" },
        { isAdmin: true }
      ]
    });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
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
// Default admin avatar
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
    console.log("Admin user created successfully!");
    console.log("Email:", savedAdmin.email);
    console.log("Password:", adminPassword);
    console.log("Please change the default password after first login!");

    return savedAdmin;
  } catch (error) {
    console.error("Error initializing admin user:", error.message);
    throw error;
  }
};

/**
 * Initialize sample data if database is empty
 */
export const initializeSampleData = async () => {
  try {
    console.log("Sample data initialization is disabled.");
  } catch (error) {
    console.error("Error initializing sample data:", error.message);
  }
};

/**
 * Initialize Al Jazeera RSS user
 */
export const initializeAlJazeeraUser = async () => {
  try {
    console.log("Initializing Al Jazeera RSS user...");

    // Check if Al Jazeera user already exists
    const existingAlJazeera = await User.findOne({ email: "news@aljazeera.com" });

    if (existingAlJazeera) {
      console.log("Al Jazeera user already exists:", existingAlJazeera.email);
      return existingAlJazeera;
    }

    // Import sample data to get Al Jazeera user details
    const { users } = await import("../data/index.js");

    // Find Al Jazeera user in the data
    const alJazeeraData = users.find(user => user.email === "news@aljazeera.com");

    if (!alJazeeraData) {
      console.log("Al Jazeera user data not found in sample data");
      return null;
    }

    // Create Al Jazeera user
    const alJazeeraUser = new User({
      ...alJazeeraData,
      isAdmin: false,
      isBanned: false,
    });

    const savedAlJazeera = await alJazeeraUser.save();
    console.log("Al Jazeera RSS user created successfully!");
    console.log("Email:", savedAlJazeera.email);
    console.log("User ID:", savedAlJazeera._id);

    return savedAlJazeera;
  } catch (error) {
    console.error("Error initializing Al Jazeera user:", error.message);
    throw error;
  }
};

/**
 * Initialize BBC RSS user
 */
export const initializeBBCUser = async () => {
  try {
    console.log("Initializing BBC RSS user...");

    const existing = await User.findOne({ email: "news@bbc.com" });
    if (existing) {
      console.log("BBC user already exists:", existing.email);
      return existing;
    }

    const user = new User({
      firstName: "BBC",
      lastName: "News",
      email: "news@bbc.com",
      password: await (async () => { const bcrypt = (await import("bcrypt")).default; const s = await bcrypt.genSalt(); return bcrypt.hash("RssBot@2024", s); })(),
      picturePath: "bbc-logo.png",

      friends: [],
      location: "London",
      occupation: "News Feed",
      viewedProfile: 0,
      impressions: 0,
      isAdmin: false,
      isBanned: false,
      isVerified: true,
    });

    const saved = await user.save();
    console.log("BBC RSS user created successfully!", saved._id);
    return saved;
  } catch (error) {
    console.error("Error initializing BBC user:", error.message);
    throw error;
  }
};

/**
 * Initialize NASA RSS user
 */
export const initializeNASAUser = async () => {
  try {
    console.log("Initializing NASA RSS user...");

    const existing = await User.findOne({ email: "news@nasa.gov" });
    if (existing) {
      console.log("NASA user already exists:", existing.email);
      return existing;
    }

    const user = new User({
      firstName: "NASA",
      lastName: " ",
      email: "news@nasa.gov",
      password: await (async () => { const bcrypt = (await import("bcrypt")).default; const s = await bcrypt.genSalt(); return bcrypt.hash("RssBot@2024", s); })(),
      picturePath: "nasa-logo.png",
      friends: [],
      location: "Washington DC",
      occupation: "Government Agency",
      viewedProfile: 0,
      impressions: 0,
      isAdmin: false,
      isBanned: false,
      isVerified: true,
    });

    const saved = await user.save();
    console.log("NASA RSS user created successfully!", saved._id);
    return saved;
  } catch (error) {
    console.error("Error initializing NASA user:", error.message);
    throw error;
  }
};

export const initializePartnerUsers = async () => {
  const partners = [
    {
      firstName: "Alif",
      lastName: "Global School",
      email: "alif@alifglobalschool.com",
      password: "AlifSenSec",
      location: "Markaz Knowledge City",
      occupation: "Education",
    },
    {
      firstName: "Alifinity",
      lastName: "Demo",
      email: "alifinity@idrees.in",
      password: "alifinity",
      location: "-",
      occupation: "-",
    },
  ];

  for (const partner of partners) {
    try {
      const existing = await User.findOne({ email: partner.email });
      if (existing) {
        console.log(`Partner user already exists: ${partner.email}`);
        continue;
      }

      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(partner.password, salt);

      const user = new User({
        firstName: partner.firstName,
        lastName: partner.lastName,
        email: partner.email,
        password: hash,
        friends: [],
        location: partner.location,
        occupation: partner.occupation,
        viewedProfile: 0,
        impressions: 0,
        isAdmin: false,
        isBanned: false,
        isVerified: true,
      });

      await user.save();
      console.log(`Partner user created: ${partner.email}`);
    } catch (error) {
      console.error(`Error creating partner user ${partner.email}:`, error.message);
    }
  }
};

/**
 * Main initialization function
 */
export const runInitialization = async () => {
  console.log("Starting Mockingbird initialization...");

  try {
    // Initialize admin user
    await initializeAdmin();

    // Initialize RSS users
    await initializeAlJazeeraUser();
    await initializeBBCUser();
    await initializeNASAUser();
    await initializePartnerUsers();

    // Initialize sample data if needed
    await initializeSampleData();

    console.log("Mockingbird initialization completed successfully!");
  } catch (error) {
    console.error("Initialization failed:", error.message);
  }
};
