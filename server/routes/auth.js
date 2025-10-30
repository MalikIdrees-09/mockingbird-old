import express from "express";
import multer from "multer";
import { login, register, verifyEmail, changePassword, changeEmail, requestPasswordReset, resetPassword, resendVerification, submitAppeal } from "../controllers/auth.js";
import { verifyToken } from "../middleware/auth.js";

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets");
  },
  filename: function (req, file, cb) {
    // Add timestamp to prevent filename conflicts
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  },
});

// File filter for profile pictures
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported: images only.`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pictures
  }
});

const router = express.Router();

router.post("/login", login);
router.post("/register", upload.single("picture"), register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification); // ✅ NEW ROUTE

// User settings routes (require authentication)
router.post("/change-password", verifyToken, changePassword);
router.post("/change-email", verifyToken, changeEmail);

// Password reset routes (public)
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

// Appeal submission route (public - for banned users)
router.post("/submit-appeal", verifyToken, submitAppeal);

export default router;
