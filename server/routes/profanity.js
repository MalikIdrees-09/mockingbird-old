import express from "express";
import {
  getProfanityLogs,
  reviewProfanityLog,
  getProfanityStats,
  takeActionOnUser,
} from "../controllers/profanity.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/logs", verifyToken, verifyAdmin, getProfanityLogs);
router.get("/stats", verifyToken, verifyAdmin, getProfanityStats);

/* UPDATE */
router.patch("/logs/:id/review", verifyToken, verifyAdmin, reviewProfanityLog);
router.patch("/logs/:id/action", verifyToken, verifyAdmin, takeActionOnUser);

export default router;
