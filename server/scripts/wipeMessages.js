import mongoose from "mongoose";
import dotenv from "dotenv";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

dotenv.config();

const wipeMessages = async () => {
  try {
    console.log("Starting messages wipe operation");
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    const convBefore = await Conversation.countDocuments();
    const msgBefore = await Message.countDocuments();
    console.log(`Conversations: ${convBefore}, Messages: ${msgBefore}`);

    const delMsgs = await Message.deleteMany({});
    const delConvs = await Conversation.deleteMany({});

    console.log(`Deleted ${delMsgs.deletedCount} messages, ${delConvs.deletedCount} conversations`);

    const convAfter = await Conversation.countDocuments();
    const msgAfter = await Message.countDocuments();
    console.log(`Remaining → Conversations: ${convAfter}, Messages: ${msgAfter}`);

    console.log("Messages wipe completed successfully");
  } catch (error) {
    console.error("Error during messages wipe:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed");
  }
};

wipeMessages();


