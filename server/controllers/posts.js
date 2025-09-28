import Post from "../models/Post.js";
import User from "../models/User.js";
import ProfanityLog from "../models/ProfanityLog.js";
import { createNotification } from "./notifications.js";
import profanityFilter from "../utils/profanityFilter.js";
import { processPostImage, cleanupTempFiles } from "../utils/imageProcessor.js";
import path from "path";

/* UTILITY FUNCTIONS */
const appendProphetRespect = (text) => {
  if (!text) return text;

  const prophetPatterns = [
    /\bProphet Muhammad\b/gi,
    /\bProphet Mohammed\b/gi,
    /\bProphet Muhammed\b/gi,
    /\bProphet Mohammad\b/gi,
    /\bRasoolallah\b/gi,
    /\bRasulullah\b/gi,
  ];

  let processedText = text;
  prophetPatterns.forEach(pattern => {
    processedText = processedText.replace(pattern, (match) => `${match} ﷺ`);
  });

  return processedText;
};

/* CREATE */
export const createPost = async (req, res) => {
  try {
    console.log("Creating post with data:", req.body);
    console.log("Files received:", req.files);

    const { userId, description, mediaPath, mediaType } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Apply Prophet respect to description
    const processedDescription = appendProphetRespect(description);

    if (!processedDescription && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Post must have either description or media" });
    }

    // Check for profanity in original description (before processing)
    if (description && profanityFilter.containsProfanity(description)) {
      const profanityWords = profanityFilter.getProfanityWords(description);
      console.log(`🚫 WATCH YOUR MOUTH! Post blocked due to profanity. User: ${userId}, Words: ${profanityWords.join(', ')}`);
      
      // Get user details for logging
      const user = await User.findById(userId);
      if (user) {
        // Log profanity incident to admin panel
        try {
          const profanityLog = new ProfanityLog({
            userId: userId,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
            originalText: description,
            detectedWords: profanityWords,
            contentType: 'post',
            severity: profanityWords.length > 3 ? 'high' : profanityWords.length > 1 ? 'medium' : 'low',
            userAgent: req.get('User-Agent') || 'Unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
          });
          
          await profanityLog.save();
          console.log(`📝 Profanity incident logged for admin review. Log ID: ${profanityLog._id}`);
        } catch (logError) {
          console.error("Error logging profanity incident:", logError);
        }
      }
      
      return res.status(400).json({ 
        message: "Did you seriously think you could get away with swearing on MY website?",
        error: "PROFANITY_DETECTED",
        details: "Repeated offence WILL lead to account termination"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle multiple media files
    let finalMediaPaths = [];
    let finalMediaTypes = [];
    let finalMediaSizes = [];
    let tempFilesToClean = [];

    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files...`);
      
      for (const file of req.files) {
        const uploadedPath = path.join("/assets", file.filename);
        
        // For now, assume all files are images (we can extend this later for different media types)
        const mediaType = 'image'; // Default to image, can be extended
        
        if (mediaType === 'image') {
          // Process image for compression and resizing
          console.log(`🖼️ Processing image: ${file.filename}`);
          const processedImage = await processPostImage(uploadedPath);

          if (processedImage.processedPath !== uploadedPath) {
            // Image was processed and optimized
            finalMediaPaths.push(path.basename(processedImage.processedPath));
            finalMediaTypes.push(mediaType);
            finalMediaSizes.push(processedImage.processedSize);

            // Mark original file for cleanup
            tempFilesToClean.push(uploadedPath);

            console.log(`✅ Image optimized: ${processedImage.compressionRatio}% of original size`);
          } else {
            // Processing failed, use original
            finalMediaPaths.push(file.filename);
            finalMediaTypes.push(mediaType);
            finalMediaSizes.push(file.size);
            console.log("⚠️ Image processing failed, using original file");
          }
        } else {
          // Non-image media (can be extended later)
          finalMediaPaths.push(file.filename);
          finalMediaTypes.push(mediaType);
          finalMediaSizes.push(file.size);
        }
      }
    } else if (mediaPath) {
      // Handle legacy single media path
      finalMediaPaths = [mediaPath];
      finalMediaTypes = [mediaType || 'image'];
    }

    const postData = {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description: processedDescription || "",
      userPicturePath: user.picturePath,
      likes: {},
      comments: [],
    };

    // Add media arrays if media exists
    if (finalMediaPaths.length > 0) {
      postData.mediaPaths = finalMediaPaths;
      postData.mediaTypes = finalMediaTypes;
      postData.mediaSizes = finalMediaSizes;
      
      // For backward compatibility, also set the first media as the primary media
      postData.mediaPath = finalMediaPaths[0];
      postData.mediaType = finalMediaTypes[0];
      postData.mediaSize = finalMediaSizes[0];
      
      // For backward compatibility, also set picturePath for images
      if (finalMediaTypes[0] === 'image') {
        postData.picturePath = finalMediaPaths[0];
      }
    }

    console.log("Creating post with data:", postData);
    const newPost = new Post(postData);
    await newPost.save();

    // Clean up temporary files (original uncompressed images)
    if (tempFilesToClean.length > 0) {
      await cleanupTempFiles(tempFilesToClean);
    }

    // Return all posts (sorted by creation date, newest first)
    const posts = await Post.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(201).json(posts);
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find({ isDeleted: { $ne: true } })
      .populate({
        path: 'userId',
        select: '_id firstName lastName picturePath isVerified isAdmin bio',
        match: { isBanned: { $ne: true } } // Only include posts from non-banned users
      })
      .sort({ pinned: -1, pinnedAt: -1, createdAt: -1 }); // Sort pinned posts first (by pinnedAt), then regular posts by createdAt

    // Filter out posts from banned users (those where populate returned null)
    const filteredPosts = posts.filter(post => post.userId !== null);

    res.status(200).json(filteredPosts);
  } catch (err) {
    console.error("Error fetching feed posts:", err);
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({
      userId,
      isDeleted: { $ne: true }
    })
      .populate({
        path: 'userId',
        select: '_id firstName lastName picturePath isVerified isAdmin bio',
        match: { isBanned: { $ne: true } }
      })
      .sort({ createdAt: -1 }); // Sort by newest first

    // Filter out posts from banned users (those where populate returned null)
    const filteredPosts = posts.filter(post => post.userId !== null);

    res.status(200).json(filteredPosts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(404).json({ message: err.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post || post.isDeleted) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Populate user information for admin badge display
    const populatedPost = await Post.findById(postId).populate({
      path: 'userId',
      select: '_id firstName lastName picturePath isVerified isAdmin bio',
      match: { isBanned: { $ne: true } }
    });

    if (!populatedPost || !populatedPost.userId) {
      return res.status(404).json({ message: "Post author not found" });
    }

    res.status(200).json(populatedPost);
  } catch (err) {
    console.error("Error fetching post by ID:", err);
    res.status(404).json({ message: err.message });
  }
};

export const editPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, description, mediaPath, mediaType } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // IDOR protection: Check if user owns the post
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    // Apply Prophet respect to description
    const processedDescription = appendProphetRespect(description);

    // Check for profanity in original description (before processing)
    if (description && profanityFilter.containsProfanity(description)) {
      const profanityWords = profanityFilter.getProfanityWords(description);
      console.log(`🚫 WATCH YOUR MOUTH! Post edit blocked due to profanity. User: ${userId}, Words: ${profanityWords.join(', ')}`);
      
      return res.status(400).json({ 
        message: "Did you seriously think you could get away with swearing on MY website?",
        error: "PROFANITY_DETECTED",
        details: "Repeated offence WILL lead to account termination"
      });
    }

    // Handle multiple media files
    let finalMediaPaths = post.mediaPaths ? [...post.mediaPaths] : []; // Keep existing media by default
    let finalMediaTypes = post.mediaTypes ? [...post.mediaTypes] : [];
    let finalMediaSizes = post.mediaSizes ? [...post.mediaSizes] : [];
    let tempFilesToClean = [];

    if (req.files && req.files.length > 0) {
      // New media files uploaded - replace all existing media
      console.log(`Processing ${req.files.length} new uploaded files for edit...`);
      
      finalMediaPaths = [];
      finalMediaTypes = [];
      finalMediaSizes = [];
      
      for (const file of req.files) {
        const uploadedPath = path.join("/assets", file.filename);
        
        // For now, assume all files are images (we can extend this later for different media types)
        const mediaType = 'image'; // Default to image, can be extended
        
        if (mediaType === 'image') {
          // Process image for compression and resizing
          console.log(`🖼️ Processing image: ${file.filename}`);
          const processedImage = await processPostImage(uploadedPath);

          if (processedImage.processedPath !== uploadedPath) {
            // Image was processed and optimized
            finalMediaPaths.push(path.basename(processedImage.processedPath));
            finalMediaTypes.push(mediaType);
            finalMediaSizes.push(processedImage.processedSize);

            // Mark original file for cleanup
            tempFilesToClean.push(uploadedPath);

            console.log(`✅ Image optimized: ${processedImage.compressionRatio}% of original size`);
          } else {
            // Processing failed, use original
            finalMediaPaths.push(file.filename);
            finalMediaTypes.push(mediaType);
            finalMediaSizes.push(file.size);
            console.log("⚠️ Image processing failed, using original file");
          }
        } else {
          // Non-image media (can be extended later)
          finalMediaPaths.push(file.filename);
          finalMediaTypes.push(mediaType);
          finalMediaSizes.push(file.size);
        }
      }
    } else if (mediaPath === "null" || mediaPath === undefined) {
      // Explicitly removing all media (mediaPath is "null" from FormData) or no mediaPath field sent
      finalMediaPaths = [];
      finalMediaTypes = [];
      finalMediaSizes = [];
    }

    // Update post
    post.description = processedDescription || "";
    post.mediaPaths = finalMediaPaths;
    post.mediaTypes = finalMediaTypes;
    post.mediaSizes = finalMediaSizes;
    post.editedAt = new Date();

    // For backward compatibility, also update single media fields
    if (finalMediaPaths.length > 0) {
      post.mediaPath = finalMediaPaths[0];
      post.mediaType = finalMediaTypes[0];
      post.mediaSize = finalMediaSizes[0];
      
      // For backward compatibility, also set picturePath for images
      if (finalMediaTypes[0] === 'image') {
        post.picturePath = finalMediaPaths[0];
      }
    } else {
      post.mediaPath = null;
      post.mediaType = null;
      post.mediaSize = null;
      post.picturePath = null;
    }

    await post.save();

    // Clean up temporary files
    if (tempFilesToClean.length > 0) {
      await cleanupTempFiles(tempFilesToClean);
    }

    res.status(200).json(post);
  } catch (err) {
    console.error("Error editing post:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const comment = post.comments[commentIndex];

    // IDOR protection: Check if user owns the comment
    if (comment.userId !== userId) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }
    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    console.log(`🗑️ Post deleted by user ${userId}: ${post._id}`);
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ message: err.message });
  }
try {
  const { id } = req.params; // post ID
  const { userId, comment } = req.body;

  // Validate input
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    if (comment.length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters" });
    }

    // Apply Prophet respect to comment
    const processedComment = appendProphetRespect(comment);

    // Check for profanity in comment
    if (profanityFilter.containsProfanity(comment)) {
      const profanityWords = profanityFilter.getProfanityWords(comment);
      console.log(`🚫 WATCH YOUR MOUTH! Comment blocked due to profanity. User: ${userId}, Words: ${profanityWords.join(', ')}`);
      
      // Get user details for logging
      const user = await User.findById(userId);
      if (user) {
        // Log profanity incident to admin panel
        try {
          const profanityLog = new ProfanityLog({
            userId: userId,
            userName: `${user.firstName} ${user.lastName}`,
            userEmail: user.email,
            originalText: comment,
            detectedWords: profanityWords,
            contentType: 'comment',
            severity: profanityWords.length > 3 ? 'high' : profanityWords.length > 1 ? 'medium' : 'low',
            userAgent: req.get('User-Agent') || 'Unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
          });
          
          await profanityLog.save();
          console.log(`📝 Profanity incident logged for admin review. Log ID: ${profanityLog._id}`);
        } catch (logError) {
          console.error("Error logging profanity incident:", logError);
        }
      }
      
      return res.status(400).json({ 
        message: "Did you seriously think you could get away with swearing in comments?",
        error: "PROFANITY_DETECTED",
        details: "Repeated offence WILL lead to account termination"
      });
    }

    // Find the post
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle media file for comment
    let commentMediaPath = null;
    let commentMediaType = null;
    let commentMediaSize = null;

    if (req.file) {
      commentMediaPath = req.file.filename;
      commentMediaType = req.body.mediaType || 'image'; // Default to image if not specified
      commentMediaSize = req.file.size;
      console.log("Comment media file uploaded:", req.file.filename, "Type:", commentMediaType);
    }

    // Create new comment object
    const newComment = {
      id: Math.random().toString(36).substr(2, 9), // Generate unique ID
      userId: userId,
      userName: `${user.firstName} ${user.lastName}`,
      isAdmin: user.isAdmin || false,
      text: processedComment.trim(),
      mediaPath: commentMediaPath,
      mediaType: commentMediaType,
      mediaSize: commentMediaSize,
      createdAt: new Date(),
    };

    // Add comment to post
    post.comments.push(newComment);

    // Save the updated post
    const updatedPost = await post.save();

    console.log(`💬 New comment added to post ${id} by user ${user.firstName} ${user.lastName}: "${comment.trim()}"`);
    if (commentMediaPath) {
      console.log(`📎 Comment media attached: ${commentMediaPath}`);
    }

    // Create notification for new comment (only if not commenting on own post)
    if (post.userId !== userId) {
      await createNotification(
        post.userId,
        userId,
        'comment',
        'commented on your post',
        post._id,
        'post'
      );
    }

    res.status(200).json({ message: "Comment added successfully", post: updatedPost });
  } catch (err) {
    console.error("Error editing comment:", err);
    res.status(500).json({ message: err.message });
  }
};

export const editComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId, comment } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const commentToEdit = post.comments[commentIndex];

    // IDOR protection: Check if user owns the comment
    if (commentToEdit.userId !== userId) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    // Validate input
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    if (comment.length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters" });
    }

    // Apply Prophet respect to comment
    const processedComment = appendProphetRespect(comment);

    // Check for profanity in comment
    if (profanityFilter.containsProfanity(comment)) {
      const profanityWords = profanityFilter.getProfanityWords(comment);
      console.log(`🚫 WATCH YOUR MOUTH! Comment edit blocked due to profanity. User: ${userId}, Words: ${profanityWords.join(', ')}`);
      
      return res.status(400).json({ 
        message: "Did you seriously think you could get away with swearing in comments?",
        error: "PROFANITY_DETECTED"
      });
    }

    // Update the comment text
    commentToEdit.text = processedComment.trim();

    // Save the updated post
    const updatedPost = await post.save();

    console.log(`✏️ Comment edited in post ${id} by user ${userId}: "${comment.trim()}"`);

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Error editing comment:", err);
    res.status(500).json({ message: err.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.get(userId);

    if (isLiked) {
      // Unlike the post
      post.likes.delete(userId);
    } else {
      // Like the post
      post.likes.set(userId, true);

      // Create notification for like (only if not liking own post)
      if (post.userId.toString() !== userId) {
        await createNotification(
          post.userId,
          userId,
          'like',
          'liked your post',
          post._id,
          'post'
        );
      }
    }

    const updatedPost = await post.save();

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Error liking/unliking post:", err);
    res.status(404).json({ message: err.message });
  }
};

/* SEARCH POSTS */
export const searchPosts = async (req, res) => {
  try {
    const { query, limit = 20, page = 1, type = 'all' } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters long" });
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query based on type
    let searchQuery = { isDeleted: { $ne: true } };

    if (type === 'description') {
      // Search only in post descriptions
      searchQuery.description = searchRegex;
    } else if (type === 'comments') {
      // Search only in comments
      searchQuery['comments.text'] = searchRegex;
    } else if (type === 'users') {
      // Search only in user names
      searchQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex }
      ];
    } else {
      // Search in all content (default) - exclude user names
      searchQuery.$or = [
        { description: searchRegex },
        { location: searchRegex },
        { 'comments.text': searchRegex }
      ];
    }

    // Get total count for pagination
    const total = await Post.countDocuments(searchQuery);

    // Search posts with pagination
    const posts = await Post.find(searchQuery)
      .populate({
        path: 'userId',
        select: '_id firstName lastName picturePath isVerified isAdmin bio',
        match: { isBanned: { $ne: true } } // Only include posts from non-banned users
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Filter out posts from banned users (those where populate returned null)
    const filteredPosts = posts.filter(post => post.userId !== null);

    // Add search highlighting information
    const postsWithHighlights = filteredPosts.map(post => {
      const postObj = post.toObject();

      // Find matching text for highlighting
      if (postObj.description && searchRegex.test(postObj.description)) {
        postObj.searchMatch = {
          type: 'description',
          text: postObj.description
        };
      } else if (postObj.comments && postObj.comments.some(comment => searchRegex.test(comment.text))) {
        const matchingComment = postObj.comments.find(comment => searchRegex.test(comment.text));
        postObj.searchMatch = {
          type: 'comment',
          text: matchingComment.text,
          userName: matchingComment.userName
        };
      }

      return postObj;
    });

    res.status(200).json({
      posts: postsWithHighlights,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPosts: total,
        hasNextPage: skip + filteredPosts.length < total,
        hasPrevPage: parseInt(page) > 1
      },
      searchQuery: query,
      searchType: type
    });
  } catch (err) {
    console.error("Error searching posts:", err);
    res.status(500).json({ message: err.message });
  }
};
