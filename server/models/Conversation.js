import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [String],
      required: true,
      validate: v => Array.isArray(v) && v.length === 2,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessagePreview: {
      type: String,
      default: "",
    },
    lastMessageSender: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 }, { unique: true });

const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;


