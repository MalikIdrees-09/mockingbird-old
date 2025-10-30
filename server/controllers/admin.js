import User from "../models/User.js";
import Post from "../models/Post.js";
import { cleanupTempFiles } from "../utils/imageProcessor.js";
import path from "path";
import fs from "fs/promises";

/* ADMIN MIDDLEWARE */
export const verifyAdmin = async (req, res, next) => {
  try {
    console.log("🔐 Verifying admin access...");
    
    if (!req.user || !req.user.id) {
      console.log("❌ No user found in request");
      return res.status(401).json({ 
        message: "Authentication required."
      });
    }
    
    const userId = req.user.id; // Get from JWT token
    console.log("👤 Checking user:", userId);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ 
        message: "User not found."
      });
    }
    
    console.log("🔍 User found:", user.email, "isAdmin:", user.isAdmin);
    
    // Check if user has admin privileges
    if (!user.isAdmin) {
      console.log("❌ User is not admin");
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required."
      });
    }
    
    console.log("✅ Admin access granted");
    req.adminUser = user;
    next();
  } catch (err) {
    console.error("❌ Error in verifyAdmin:", err);
    res.status(500).json({ message: err.message });
  }
};

/* READ - Admin Dashboard Data */
export const getAdminDashboard = async (req, res) => {
  try {
    console.log("📊 Fetching admin dashboard data...");
    
    // Get stats with fallback values
    const totalUsers = await User.countDocuments() || 0;
    console.log("👥 Total users:", totalUsers);
    
    const totalPosts = await Post.countDocuments({ isDeleted: { $ne: true } }) || 0;
    console.log("📝 Total posts:", totalPosts);
    
    const bannedUsers = await User.countDocuments({ isBanned: true }) || 0;
    console.log("🚫 Banned users:", bannedUsers);
    
    const deletedPosts = await Post.countDocuments({ isDeleted: true }) || 0;
    console.log("🗑️ Deleted posts:", deletedPosts);
    
    // Get recent users with error handling
    let recentUsers = [];
    try {
      recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('firstName lastName email createdAt isBanned')
        .lean(); // Use lean for better performance
    } catch (userError) {
      console.error("Error fetching recent users:", userError);
      recentUsers = [];
    }
    
    // Get recent posts with error handling
    let recentPosts = [];
    try {
      recentPosts = await Post.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('firstName lastName description createdAt')
        .lean(); // Use lean for better performance
    } catch (postError) {
      console.error("Error fetching recent posts:", postError);
      recentPosts = [];
    }

    const dashboardData = {
      stats: {
        totalUsers,
        totalPosts,
        bannedUsers,
        deletedPosts
      },
      recentUsers,
      recentPosts
    };

    console.log("✅ Dashboard data prepared successfully");
    res.status(200).json(dashboardData);
  } catch (err) {
    console.error("❌ Error in getAdminDashboard:", err);
    res.status(500).json({ 
      message: "Failed to fetch dashboard data",
      error: err.message,
      stats: {
        totalUsers: 0,
        totalPosts: 0,
        bannedUsers: 0,
        deletedPosts: 0
      },
      recentUsers: [],
      recentPosts: []
    });
  }
};

/* READ - Get All Users for Admin */
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    
    const query = search 
      ? {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const users = await User.find(query)
      .select('firstName lastName email createdAt isBanned bannedAt isAdmin')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* READ - Get All Posts for Admin */
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeDeleted = false } = req.query;
    
    const query = includeDeleted === 'true' ? {} : { isDeleted: false };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.status(200).json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE - Ban/Unban User */
export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId, reason = "Violation of community guidelines" } = req.body;

    // Prevent admin from banning themselves
    if (userId === adminId) {
      return res.status(403).json({
        message: "You cannot ban yourself",
        error: "SELF_BAN_PREVENTED"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow banning admin users
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot ban admin users" });
    }

    const wasBanned = user.isBanned;
    user.isBanned = !user.isBanned;
    user.bannedAt = user.isBanned ? new Date() : null;
    user.bannedBy = user.isBanned ? adminId : null;

    // Store ban reason if provided
    if (user.isBanned && reason) {
      user.banReason = reason;
    } else if (!user.isBanned) {
      user.banReason = null; // Clear ban reason on unban
    }

    await user.save();

    // If user is being banned (not unbanned), delete all their posts
    if (user.isBanned && !wasBanned) {
      console.log(`🚫 Deleting all posts by banned user: ${user.email}`);

      const deletedPostsResult = await Post.updateMany(
        { userId: userId },
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: adminId
        }
      );

      console.log(`🗑️ Deleted ${deletedPostsResult.modifiedCount} posts by banned user`);
    }

    res.status(200).json({
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully${user.isBanned ? ' and all their posts deleted' : ''}`,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt
      },
      postsDeleted: user.isBanned && !wasBanned ? true : false
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE - Delete User */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminId } = req.body;
    
    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return res.status(403).json({ 
        message: "You cannot delete yourself",
        error: "SELF_DELETE_PREVENTED"
      });
    }
    
    // Don't allow deleting admin users
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    // Remove this user from all other users' friends lists and friend requests
    console.log(`🧹 Cleaning up friendships for deleted user: ${user.email}`);
    
    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );
    
    await User.updateMany(
      { friendRequests: userId },
      { $pull: { friendRequests: userId } }
    );
    
    await User.updateMany(
      { sentFriendRequests: userId },
      { $pull: { sentFriendRequests: userId } }
    );

    // Also delete all posts by this user
    await Post.updateMany(
      { userId: userId },
      { 
        isDeleted: true, 
        deletedAt: new Date(), 
        deletedBy: adminId 
      }
    );

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "User and their posts deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE - Permanently Delete Post */
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.adminUser._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Collect all media files to delete
    const filesToDelete = [];

    // Add post media file if it exists
    if (post.mediaPath) {
      filesToDelete.push(path.join("public/assets", post.mediaPath));
    }

    // Add legacy picturePath if it exists and is different from mediaPath
    if (post.picturePath && post.picturePath !== post.mediaPath) {
      filesToDelete.push(path.join("public/assets", post.picturePath));
    }

    // Add comment media files
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach(comment => {
        if (comment.mediaPath) {
          filesToDelete.push(path.join("public/assets", comment.mediaPath));
        }
      });
    }

    // Delete the post permanently
    await Post.findByIdAndDelete(postId);

    // Clean up associated media files
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Deleting ${filesToDelete.length} media files associated with post ${postId}`);
      await cleanupTempFiles(filesToDelete);
    }

    res.status(200).json({
      message: "Post permanently deleted successfully",
      deletedFiles: filesToDelete.length
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE - Pin/Unpin Post */
export const pinPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.adminUser._id;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Toggle pinned status
    post.pinned = !post.pinned;
    post.pinnedAt = post.pinned ? new Date() : null;
    
    await post.save();

    res.status(200).json({
      message: `Post ${post.pinned ? 'pinned' : 'unpinned'} successfully`,
      post
    });
  } catch (err) {
    console.error("Error pinning/unpinning post:", err);
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE - Moderate Comment (Delete) */
export const moderateComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { commentIndex, action, adminId } = req.body;

    if (action !== "delete") {
      return res.status(400).json({ message: "Only delete action is supported" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!post.comments || post.comments.length === 0) {
      return res.status(404).json({ message: "No comments found on this post" });
    }

    if (commentIndex < 0 || commentIndex >= post.comments.length) {
      return res.status(400).json({ message: "Invalid comment index" });
    }

    const commentToDelete = post.comments[commentIndex];

    // If comment has media, delete the file
    if (commentToDelete.mediaPath) {
      const filePath = path.join("public/assets", commentToDelete.mediaPath);
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ Deleted comment media file: ${filePath}`);
      } catch (fileErr) {
        console.error(`❌ Error deleting comment media file: ${fileErr.message}`);
        // Continue with comment deletion even if file deletion fails
      }
    }

    // Remove the comment from the array
    post.comments.splice(commentIndex, 1);

    await post.save();

    res.status(200).json({
      message: "Comment deleted successfully",
      deletedComment: {
        id: commentToDelete.id,
        userName: commentToDelete.userName,
        text: commentToDelete.text
      }
    });
  } catch (err) {
    console.error("Error moderating comment:", err);
    res.status(500).json({ message: err.message });
  }
};
