import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Post from "../models/Post.js";

/* CREATE NOTIFICATION */
export const createNotification = async (recipientId, senderId, type, message, relatedId, relatedType, data = {}) => {
  try {
    // Don't create notification if sender and recipient are the same
    if (recipientId === senderId) return null;

    // Check if recipient exists and is not banned
    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.isBanned) return null;

    // Get sender name
    const sender = await User.findById(senderId);
    if (!sender) return null;

    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      senderName: `${sender.firstName} ${sender.lastName}`,
      type,
      message,
      relatedId,
      relatedType,
      data,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

/* GET USER NOTIFICATIONS */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    res.status(200).json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ error: error.message });
  }
};

/* MARK NOTIFICATION AS READ */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: error.message });
  }
};

/* MARK ALL NOTIFICATIONS AS READ */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: error.message });
  }
};

/* DELETE NOTIFICATION */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: error.message });
  }
};

/* GET UNREAD COUNT */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: error.message });
  }
};
