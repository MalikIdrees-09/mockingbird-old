import express from "express";
import multer from "multer";
import { getFeedPosts, getUserPosts, getPostById, likePost, reactToPost, addComment, editComment, editPost, deletePost, deleteComment, searchPosts, getLinkPreview, repostPost, undoRepost } from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";
import path from "path";

const router = express.Router();

/* FILE STORAGE CONFIGURATION */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/webm'],
    clip: ['image/gif', 'video/webm']
  };

  const allAllowedTypes = [
    ...allowedTypes.image,
    ...allowedTypes.audio,
    ...allowedTypes.clip
  ];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported: images, audio, and small clips only.`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

/* READ */
router.get("/", verifyToken, getFeedPosts);
router.get("/search", verifyToken, searchPosts);
router.get("/:postId", verifyToken, getPostById);
router.get("/:postId/public", getPostById); // Public route for viewing posts without auth
router.get("/:userId/posts", verifyToken, getUserPosts);

// Link preview route (public, no auth required)
router.post("/preview", getLinkPreview);

// Create optional upload middleware
const uploadOptional = (req, res, next) => {
  upload.single("media")(req, res, (err) => {
    // If there's an error and it's not about missing file, handle it
    if (err && err.code !== 'LIMIT_UNEXPECTED_FILE') {
      return next(err);
    }
    // Continue even if no file was uploaded
    next();
  });
};

/* UPDATE */
router.patch("/:id/like", verifyToken, likePost);
router.patch("/:id/react", verifyToken, reactToPost);
router.post("/:id/comment", verifyToken, upload.single("media"), addComment);
router.patch("/:id/comment/:commentId", verifyToken, editComment);
router.delete("/:id/comment/:commentId", verifyToken, deleteComment);
router.patch("/:id", verifyToken, uploadOptional, editPost);
router.delete("/:id", verifyToken, deletePost);
router.post("/:id/repost", verifyToken, repostPost);
router.delete("/:id/repost", verifyToken, undoRepost);

export default router;
