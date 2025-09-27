import ProfanityLog from "../models/ProfanityLog.js";
import User from "../models/User.js";

/* GET PROFANITY LOGS */
export const getProfanityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, severity, reviewed } = req.query;
    
    // Build filter object
    const filter = {};
    if (userId) filter.userId = userId;
    if (severity) filter.severity = severity;
    if (reviewed !== undefined) filter.isReviewed = reviewed === 'true';
    
    const logs = await ProfanityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await ProfanityLog.countDocuments(filter);
    
    res.status(200).json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (err) {
    console.error("Error fetching profanity logs:", err);
    res.status(500).json({ message: err.message });
  }
};

/* GET PROFANITY STATISTICS */
export const getProfanityStats = async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);
    
    const [
      totalIncidents,
      todayIncidents,
      weekIncidents,
      monthIncidents,
      unreviewed,
      severityStats,
      topOffenders,
      recentIncidents,
    ] = await Promise.all([
      ProfanityLog.countDocuments(),
      ProfanityLog.countDocuments({ createdAt: { $gte: yesterday } }),
      ProfanityLog.countDocuments({ createdAt: { $gte: thisWeek } }),
      ProfanityLog.countDocuments({ createdAt: { $gte: thisMonth } }),
      ProfanityLog.countDocuments({ isReviewed: false }),
      ProfanityLog.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } }
      ]),
      ProfanityLog.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 }, userName: { $first: "$userName" } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      ProfanityLog.find().sort({ createdAt: -1 }).limit(5),
    ]);
    
    res.status(200).json({
      totalIncidents,
      todayIncidents,
      weekIncidents,
      monthIncidents,
      unreviewed,
      severityStats,
      topOffenders,
      recentIncidents,
    });
  } catch (err) {
    console.error("Error fetching profanity stats:", err);
    res.status(500).json({ message: err.message });
  }
};

/* REVIEW PROFANITY LOG */
export const reviewProfanityLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.id;
    
    const log = await ProfanityLog.findByIdAndUpdate(
      id,
      {
        isReviewed: true,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes: adminNotes || "",
      },
      { new: true }
    );
    
    if (!log) {
      return res.status(404).json({ message: "Profanity log not found" });
    }
    
    res.status(200).json(log);
  } catch (err) {
    console.error("Error reviewing profanity log:", err);
    res.status(500).json({ message: err.message });
  }
};

/* TAKE ACTION ON USER */
export const takeActionOnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, banReason } = req.body;
    const adminId = req.user.id;
    
    const log = await ProfanityLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: "Profanity log not found" });
    }
    
    // Update the log with action taken
    log.actionTaken = action;
    log.isReviewed = true;
    log.reviewedBy = adminId;
    log.reviewedAt = new Date();
    await log.save();
    
    // Take action on user if necessary
    if (action === 'temporary_ban' || action === 'permanent_ban') {
      // Prevent admin from banning themselves
      if (log.userId === adminId) {
        return res.status(403).json({ 
          message: "You cannot ban yourself",
          error: "SELF_BAN_PREVENTED"
        });
      }

      const user = await User.findById(log.userId);
      if (user) {
        user.isBanned = true;
        user.banDate = new Date();
        user.bannedBy = adminId;
        user.banReason = banReason || `Profanity violation - ${action}`;
        await user.save();
        
        console.log(`🔨 User ${user.email} banned by admin for profanity violation`);
      }
    }
    
    res.status(200).json({ 
      message: `Action '${action}' taken successfully`,
      log 
    });
  } catch (err) {
    console.error("Error taking action on user:", err);
    res.status(500).json({ message: err.message });
  }
};
