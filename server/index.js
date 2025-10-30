import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cron from "node-cron";
import compression from "compression";
import { createPost } from './controllers/posts.js';
import { updateProfilePicture, removeProfilePicture } from './controllers/users.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';
import profanityRoutes from './routes/profanity.js';
import notificationRoutes from './routes/notifications.js';
import rssRoutes from './routes/rssRoutes.js';
import messagesRoutes from './routes/messages.js';
import { setAlJazeeraUserId } from './utils/rssSync.js';
import { startRSSSync } from './services/cronService.js';
import { runInitialization } from './scripts/initAdmin.js';
import { verifyToken } from './middleware/auth.js';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// In-memory map of userId -> Set of socket ids
const userIdToSockets = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      return next(new Error("Unauthorized: missing token"));
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    return next();
  } catch (err) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.userId;
  if (userId) {
    if (!userIdToSockets.has(userId)) userIdToSockets.set(userId, new Set());
    userIdToSockets.get(userId).add(socket.id);
  }

  socket.on("typing", ({ toUserId, conversationId, isTyping }) => {
    const sockets = userIdToSockets.get(toUserId);
    if (sockets) {
      for (const sid of sockets) io.to(sid).emit("typing", { fromUserId: userId, conversationId, isTyping });
    }
  });

  socket.on("direct_message", async (payload, cb) => {
    try {
      // Defer to REST for persistence; this channel is for realtime fanout
      const { toUserId, conversationId, message } = payload;
      const sockets = userIdToSockets.get(toUserId);
      if (sockets) {
        for (const sid of sockets) io.to(sid).emit("direct_message", { ...message, conversationId });
      }
      if (typeof cb === "function") cb({ ok: true });
    } catch (e) {
      if (typeof cb === "function") cb({ ok: false, error: e.message });
    }
  });

  socket.on("message_deleted", ({ toUserId, conversationId, messageId }) => {
    const payload = { conversationId, messageId };

    if (toUserId) {
      const targetSockets = userIdToSockets.get(toUserId);
      if (targetSockets) {
        for (const sid of targetSockets) {
          io.to(sid).emit("message_deleted", payload);
        }
      }
    }

    if (userId) {
      const selfSockets = userIdToSockets.get(userId);
      if (selfSockets) {
        for (const sid of selfSockets) {
          if (sid !== socket.id) {
            io.to(sid).emit("message_deleted", payload);
          }
        }
      }
    }
  });

  socket.on("read_receipt", ({ toUserId, conversationId, messageIds }) => {
    const sockets = userIdToSockets.get(toUserId);
    if (sockets) {
      for (const sid of sockets) io.to(sid).emit("read_receipt", { conversationId, messageIds, fromUserId: userId });
    }
  });

  socket.on("disconnect", () => {
    if (userId && userIdToSockets.has(userId)) {
      const set = userIdToSockets.get(userId);
      set.delete(socket.id);
      if (set.size === 0) userIdToSockets.delete(userId);
    }
  });
});
app.use(compression()); // Enable gzip compression for responses
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));
app.use(express.static(path.join(__dirname, "../client/build")));

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
app.post("/posts", verifyToken, upload.array("media", 10), createPost);
app.patch("/users/:id/profile-picture", verifyToken, upload.single("picture"), updateProfilePicture);
app.delete("/users/:id/profile-picture", verifyToken, removeProfilePicture);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/admin", adminRoutes);
app.use("/profanity", profanityRoutes);
app.use("/notifications", notificationRoutes);
app.use("/rss", rssRoutes);
app.use("/messages", messagesRoutes);

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
    httpServer.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* VERIFY EMAIL TRANSPORTER */
    // await verifyTransporter();

    /* INITIALIZE ADMIN AND SAMPLE DATA */
    await runInitialization();

    /* SET UP RSS SYNC */
    try {
      // Import User model and initialization functions
      const User = (await import('./models/User.js')).default;
      const { initializeAlJazeeraUser } = await import('./scripts/initAdmin.js');

      // Initialize Al Jazeera user (this will create it if it doesn't exist)
      const alJazeeraUser = await initializeAlJazeeraUser();

      if (alJazeeraUser) {
        setAlJazeeraUserId(alJazeeraUser._id);
        console.log(`📰 Al Jazeera user ready: ${alJazeeraUser._id}`);

        // Start RSS sync cron job
        startRSSSync();
        console.log(`✅ RSS sync system initialized successfully`);
      } else {
        console.error(`❌ Failed to initialize Al Jazeera user!`);
      }
    } catch (error) {
      console.error(`❌ Failed to initialize RSS sync:`, error.message);
    }

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

// Export io instance for use in controllers
export { io as ioInstance, userIdToSockets };
