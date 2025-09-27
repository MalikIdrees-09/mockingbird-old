import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notifications.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/", verifyToken, getNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);

/* UPDATE */
router.patch("/:notificationId/read", verifyToken, markAsRead);
router.patch("/mark-all-read", verifyToken, markAllAsRead);

/* DELETE */
router.delete("/:notificationId", verifyToken, deleteNotification);

export default router;
