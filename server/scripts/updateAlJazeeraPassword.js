import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const email = "news@aljazeera.com";
const newPassword = "jazeera";

const main = async () => {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL env var is required");
  }

  await mongoose.connect(process.env.MONGO_URL);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    console.log(`Password for ${email} updated successfully.`);
  } finally {
    await mongoose.connection.close();
  }
};

main().catch((err) => {
  console.error("Failed to update password:", err.message);
  process.exit(1);
});
