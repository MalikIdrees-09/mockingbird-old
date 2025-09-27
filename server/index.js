import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { createPost } from './controllers/posts.js';
import { updateProfilePicture, removeProfilePicture } from './controllers/users.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';
import profanityRoutes from './routes/profanity.js';
import notificationRoutes from './routes/notifications.js';
import { runInitialization } from './scripts/initAdmin.js';
import { verifyToken } from './middleware/auth.js';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "/assets")));
app.use(express.static(path.join(__dirname, "../client/build")));

/* FILE STORAGE */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/assets");
  },
  filename: function (req, file, cb) {
    // Add timestamp to prevent filename conflicts
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  },
});

// File filter for different media types (excluding videos to save storage)
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
    clip: ['image/gif', 'video/webm'] // Only small clips, no large video files
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
    fileSize: 10 * 1024 * 1024, // 10MB limit (no large videos)
  }
});

/* ROUTES WITH FILES */
app.post("/posts", verifyToken, upload.single("media"), createPost);
app.patch("/users/:id/profile-picture", verifyToken, upload.single("picture"), updateProfilePicture);
app.delete("/users/:id/profile-picture", verifyToken, removeProfilePicture);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);
app.use("/profanity", profanityRoutes);
app.use("/notifications", notificationRoutes);

/* KEEP-ALIVE ENDPOINT FOR CRON JOB */
app.get("/keep-alive", (req, res) => {
  console.log(`🟢 Keep-alive ping at ${new Date().toISOString()}`);
  res.status(200).json({ 
    status: "alive", 
    timestamp: new Date().toISOString(), 
    message: "Server is running and healthy" 
  });
});

/* SERVE REACT APP */
// Catch all handler: send back React's index.html file for client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/"));
});

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* VERIFY EMAIL TRANSPORTER */
    // await verifyTransporter();

    /* INITIALIZE ADMIN AND SAMPLE DATA */
    await runInitialization();

    /* ADD DATA ONE TIME - Now handled by initialization script */
    // User.insertMany(users);
    // Post.insertMany(posts);

    /* SET UP KEEP-ALIVE CRON JOB */
    // Schedule a job to ping the keep-alive endpoint every 10 minutes
    cron.schedule('*/10 * * * *', async () => {
      try {
        const response = await fetch(`http://localhost:${PORT}/keep-alive`);
        if (response.ok) {
          console.log('🔄 Keep-alive cron job executed successfully');
        } else {
          console.error('❌ Keep-alive cron job failed:', response.status);
        }
      } catch (error) {
        console.error('❌ Keep-alive cron job error:', error.message);
      }
    });
    console.log('⏰ Keep-alive cron job scheduled to run every 10 minutes');
  })
  .catch((error) => console.log(`${error} did not connect`));
