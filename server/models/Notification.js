import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String, // User ID who receives the notification
      required: true,
      index: true,
    },
    sender: {
      type: String, // User ID who triggered the notification
      required: true,
    },
    senderName: {
      type: String, // Name of the sender for display
      required: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'friend_request', 'friend_accepted', 'post_mention', 'comment_mention'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: String, // ID of the related post, comment, or user
      required: true,
    },
    relatedType: {
      type: String,
      enum: ['post', 'comment', 'user'],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Additional data for the notification
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
