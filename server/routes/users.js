import express from "express";
import {
  getUser,
  getUserFriends,
  getUserFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  addRemoveFriend,
  updateBio,
  updateProfile,
  searchUsers,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/validate-token", verifyToken, (req, res) => {
  // If verifyToken middleware passes, token is valid
  res.status(200).json({ valid: true, user: req.user });
});
router.get("/search", searchUsers); // Temporarily removed verifyToken for testing
router.get("/:id", verifyToken, getUser);
router.get("/:id/friends", verifyToken, getUserFriends);
router.get("/:id/friend-requests", verifyToken, getUserFriendRequests);

/* UPDATE */
// Specific routes first to avoid conflicts with dynamic patterns
router.patch("/:id/bio", verifyToken, updateBio);
router.patch("/:id", verifyToken, updateProfile);
// Friendship routes after specific ones
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);
router.post("/:id/friend-request/:friendId", verifyToken, sendFriendRequest);
router.post("/:id/accept-friend/:friendId", verifyToken, acceptFriendRequest);
router.post("/:id/reject-friend/:friendId", verifyToken, rejectFriendRequest);
router.delete("/:id/cancel-friend/:friendId", verifyToken, cancelFriendRequest);

export default router;
