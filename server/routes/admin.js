import express from "express";
import {
  getAdminDashboard,
  getAllUsers,
  getAllPosts,
  banUser,
  deleteUser,
  deletePost,
  pinPost,
  verifyAdmin,
  moderateComment
} from "../controllers/admin.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ ROUTES */
router.get("/dashboard", verifyToken, verifyAdmin, getAdminDashboard);
router.get("/users", verifyToken, verifyAdmin, getAllUsers);
router.get("/posts", verifyToken, verifyAdmin, getAllPosts);

/* UPDATE ROUTES */
router.patch("/users/:userId/ban", verifyToken, verifyAdmin, banUser);
router.patch("/posts/:postId/delete", verifyToken, verifyAdmin, deletePost);
router.patch("/posts/:postId/pin", verifyToken, verifyAdmin, pinPost);
router.patch("/posts/:postId/moderate-comment", verifyToken, verifyAdmin, moderateComment);

/* DELETE ROUTES */
router.delete("/users/:userId", verifyToken, verifyAdmin, deleteUser);

export default router;
