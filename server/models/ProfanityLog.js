import mongoose from "mongoose";

const profanityLogSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    detectedWords: {
      type: [String],
      required: true,
    },
    contentType: {
      type: String,
      enum: ['post', 'comment', 'message'],
      default: 'post',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'severe'],
      default: 'medium',
    },
    userAgent: String,
    ipAddress: String,
    isReviewed: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: "",
    },
    actionTaken: {
      type: String,
      enum: ['none', 'warning', 'temporary_ban', 'permanent_ban'],
      default: 'none',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
profanityLogSchema.index({ userId: 1, createdAt: -1 });
profanityLogSchema.index({ createdAt: -1 });
profanityLogSchema.index({ isReviewed: 1 });

const ProfanityLog = mongoose.model("ProfanityLog", profanityLogSchema);

export default ProfanityLog;
