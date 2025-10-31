import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/auth.js";
import { listConversations, listMessages, sendMessage, markRead, createConversation, editMessage, deleteMessage } from "../controllers/messages.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/assets"));
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const filename = `message_${timestamp}_${file.originalname}`;
    cb(null, filename);
  },
});

const allowedTypes = [
  // images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  // audio
  'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/webm',
  // video
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg'
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 200 * 1024 * 1024, files: 5 } });

router.get('/conversations', verifyToken, listConversations);
router.post('/conversations', verifyToken, createConversation);
router.get('/:conversationId/messages', verifyToken, listMessages);
router.patch('/message/:messageId', verifyToken, editMessage);
router.delete('/message/:messageId', verifyToken, deleteMessage);
router.post('/', verifyToken, upload.array('media', 5), sendMessage);
router.post('/:conversationId/read', verifyToken, markRead);

export default router;


