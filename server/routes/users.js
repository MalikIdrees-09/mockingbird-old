import express from "express";
import multer from "multer";
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
  updateProfilePicture,
  removeProfilePicture,
  searchUsers,
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* FILE UPLOAD CONFIGURATION */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  },
});

const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const fileFilter = (req, file, cb) => {
  if (imageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Images only.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

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
router.patch("/:id/profile-picture", verifyToken, upload.single("picture"), updateProfilePicture);
router.delete("/:id/profile-picture", verifyToken, removeProfilePicture);
// Friendship routes after specific ones
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);
router.post("/:id/friend-request/:friendId", verifyToken, sendFriendRequest);
router.post("/:id/accept-friend/:friendId", verifyToken, acceptFriendRequest);
router.post("/:id/reject-friend/:friendId", verifyToken, rejectFriendRequest);
router.delete("/:id/cancel-friend/:friendId", verifyToken, cancelFriendRequest);

export default router;
