import Post from "../models/Post.js";
import User from "../models/User.js";
import ProfanityLog from "../models/ProfanityLog.js";
import { createNotification } from "./notifications.js";
import profanityFilter from "../utils/profanityFilter.js";
import { processPostImage, cleanupTempFiles } from "../utils/imageProcessor.js";
import { extractUrlsFromText, extractLinkMetadata } from "../utils/linkPreview.js";
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

const USER_FIELDS = "_id firstName lastName picturePath location isVerified isAdmin bio";

const buildPostsQuery = (filter = {}) => {
  const query = { isDeleted: { $ne: true }, ...filter };

  return Post.find(query)
    .populate({
      path: "userId",
      select: USER_FIELDS,
      match: { isBanned: { $ne: true } },
    })
    .populate({
      path: "repostOf",
      populate: {
        path: "userId",
        select: USER_FIELDS,
        match: { isBanned: { $ne: true } },
      },
    })
    .sort({ pinned: -1, pinnedAt: -1, createdAt: -1 });
};

const fetchPosts = async (filter = {}) => {
  const posts = await buildPostsQuery(filter);
  return posts.filter((post) => post.userId !== null);
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

    // Handle media files - support both single and multiple files
    let finalMediaPath = null;
    let finalMediaType = null;
    let mediaSize = null;
    let finalMediaPaths = [];
    let finalMediaTypes = [];
    let finalMediaSizes = [];
    let finalMediaDurations = [];
    let tempFilesToClean = [];

    if (req.files && req.files.length > 0) {
      console.log(`📁 Processing ${req.files.length} media file(s)...`);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadedPath = path.join("public/assets", file.filename);
        const fileMediaType = mediaType || 'image'; // Default to image if not specified

        if (fileMediaType === 'image') {
          // Process image for compression and resizing
          console.log(`🖼️ Processing image ${i + 1}/${req.files.length} for optimization...`);
          const processedImage = await processPostImage(uploadedPath);

          if (processedImage.processedPath !== uploadedPath) {
            // Image was processed and optimized
            finalMediaPaths.push(path.basename(processedImage.processedPath));
            finalMediaSizes.push(processedImage.processedSize);

            // Mark original file for cleanup
            tempFilesToClean.push(uploadedPath);

            console.log(`✅ Image ${i + 1} optimized: ${processedImage.compressionRatio}% of original size`);
          } else {
            // Processing failed, use original
            finalMediaPaths.push(file.filename);
            finalMediaSizes.push(file.size);
            console.log(`⚠️ Image ${i + 1} processing failed, using original file`);
          }
        } else {
          // Non-image media (audio, video) - keep as is
          finalMediaPaths.push(file.filename);
          finalMediaSizes.push(file.size);
          console.log(`📎 Non-image media ${i + 1} uploaded:`, file.filename, "Type:", fileMediaType);
        }
        
        finalMediaTypes.push(fileMediaType);
        finalMediaDurations.push(null); // Will be set later if needed
      }

      // For backward compatibility, set single media fields from first file
      if (finalMediaPaths.length > 0) {
        finalMediaPath = finalMediaPaths[0];
        finalMediaType = finalMediaTypes[0];
        mediaSize = finalMediaSizes[0];
      }
    } else if (mediaPath) {
      // Handle legacy picturePath or direct media path
      finalMediaPath = mediaPath;
      finalMediaType = mediaType || 'image';
      finalMediaPaths = [mediaPath];
      finalMediaTypes = [mediaType || 'image'];
      finalMediaSizes = [0]; // Unknown size for legacy
    }

    const postData = {
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description: processedDescription || "",
      userPicturePath: user.picturePath,
      likes: {},
      reactions: {},
      comments: [],
    };

    // Add media fields if media exists
    if (finalMediaPaths.length > 0) {
      // Multiple media (new format)
      postData.mediaPaths = finalMediaPaths;
      postData.mediaTypes = finalMediaTypes;
      postData.mediaSizes = finalMediaSizes;
      postData.mediaDurations = finalMediaDurations;

      // For backward compatibility, also set single media fields from first file
      if (finalMediaPath && finalMediaType) {
        postData.mediaPath = finalMediaPath;
        postData.mediaType = finalMediaType;
        if (mediaSize) {
          postData.mediaSize = mediaSize;
        }

        // For backward compatibility, also set picturePath for images
        if (finalMediaType === 'image') {
          postData.picturePath = finalMediaPath;
        }
      }
    } else if (finalMediaPath && finalMediaType) {
      // Single media (legacy format)
      postData.mediaPath = finalMediaPath;
      postData.mediaType = finalMediaType;
      if (mediaSize) {
        postData.mediaSize = mediaSize;
      }

      // For backward compatibility, also set picturePath for images
      if (finalMediaType === 'image') {
        postData.picturePath = finalMediaPath;
      }
    }

    // Extract and store link previews
    if (processedDescription) {
      const urls = extractUrlsFromText(processedDescription);
      if (urls.length > 0) {
        console.log(`🔗 Found ${urls.length} URL(s) in post, extracting previews...`);
        postData.linkPreviews = [];

        // Remove URLs from description to avoid duplication
        let cleanDescription = processedDescription;
        console.log(`🔍 Original description: "${processedDescription}"`);
        console.log(`🔗 Detected URLs:`, urls);

        urls.forEach((url, index) => {
          // Try multiple approaches to remove the URL
          const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          // First try exact match
          let before = cleanDescription;
          cleanDescription = cleanDescription.replace(new RegExp(escapedUrl, 'gi'), '').trim();
          console.log(`  URL ${index + 1} removal attempt 1: "${before}" → "${cleanDescription}"`);

          // If URL still exists, try with simplified patterns
          const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
          if (cleanDescription.includes(urlWithoutProtocol)) {
            before = cleanDescription;
            cleanDescription = cleanDescription.replace(new RegExp(urlWithoutProtocol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
            console.log(`  URL ${index + 1} removal attempt 2: "${before}" → "${cleanDescription}"`);
          }

          const urlWithoutWww = url.replace(/^https?:\/\/(?:www\.)?/, '');
          if (cleanDescription.includes(urlWithoutWww)) {
            before = cleanDescription;
            cleanDescription = cleanDescription.replace(new RegExp(urlWithoutWww.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
            console.log(`  URL ${index + 1} removal attempt 3: "${before}" → "${cleanDescription}"`);
          }
        });

        // Clean up any double spaces or trailing commas left after URL removal
        cleanDescription = cleanDescription.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim();

        // Only update description if URLs were actually removed
        if (cleanDescription !== processedDescription) {
          postData.description = cleanDescription || processedDescription;
          console.log(`🧹 Cleaned description: "${processedDescription}" → "${cleanDescription}"`);
        } else {
          console.log(`⚠️ No URLs removed, keeping original: "${processedDescription}"`);
        }

        for (const url of urls.slice(0, 3)) { // Limit to 3 previews per post
          try {
            const metadata = await extractLinkMetadata(url);
            if (metadata) {
              postData.linkPreviews.push({
                url,
                title: metadata.title,
                description: metadata.description,
                image: metadata.image,
                siteName: metadata.siteName,
                favicon: metadata.favicon,
              });
              console.log(`✅ Link preview extracted for: ${url}`);
            }
          } catch (error) {
            console.log(`⚠️ Failed to extract preview for: ${url}`);
          }

          // Small delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 500));
        }
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

/* REPOST */
export const repostPost = async (req, res) => {
  try {
    const postId = req.params.id || req.params.postId;
    const { userId, comment = "" } = req.body;

    console.log("repostPost received", { postId, userId, comment });

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const originalPost = postId ? await Post.findById(postId) : null;
    if (!originalPost) {
      console.warn("repostPost originalPost lookup returned null", { postId });
    }
    if (!originalPost || originalPost.isDeleted) {
      return res.status(404).json({ message: "Original post not found" });
    }

    if (String(originalPost.userId) === String(userId)) {
      return res.status(400).json({ message: "You cannot repost your own post" });
    }

    const alreadyReposted = await Post.findOne({ repostOf: postId, userId });
    if (alreadyReposted) {
      return res.status(400).json({ message: "You have already reposted this post" });
    }

    const repost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description: comment,
      userPicturePath: user.picturePath,
      likes: {},
      reactions: {},
      comments: [],
      repostOf: originalPost._id,
      repostComment: comment,
    });

    await repost.save();

    if (String(originalPost.userId) !== String(userId)) {
      await createNotification(
        originalPost.userId,
        userId,
        "repost",
        `${user.firstName} ${user.lastName} reposted your post`,
        repost._id,
        "post",
        { originalPostId: postId }
      );
    }

    const posts = await fetchPosts();

    res.status(201).json(posts);
  } catch (error) {
    console.error("Error reposting post:", error);
    res.status(500).json({ message: "Failed to repost" });
  }
};

export const undoRepost = async (req, res) => {
  try {
    const postId = req.params.id || req.params.postId;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const repost = postId ? await Post.findOne({ _id: postId, userId, repostOf: { $ne: null } }) : null;
    if (!repost) {
      return res.status(404).json({ message: "Repost not found" });
    }

    await Post.deleteOne({ _id: repost._id });

    const posts = await fetchPosts();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error undoing repost:", error);
    res.status(500).json({ message: "Failed to undo repost" });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    const filteredPosts = await fetchPosts();

    // Debug link previews
    filteredPosts.forEach(post => {
      if (post.linkPreviews && post.linkPreviews.length > 0) {
        console.log(`🔍 Post ${post._id} has ${post.linkPreviews.length} link previews:`);
        post.linkPreviews.forEach((preview, index) => {
          console.log(`  Preview ${index + 1}:`, {
            url: preview.url,
            title: preview.title,
            description: preview.description,
            image: preview.image,
            siteName: preview.siteName,
          });
        });
      }
    });

    res.status(200).json(filteredPosts);
  } catch (err) {
    console.error("Error fetching feed posts:", err);
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const filteredPosts = await fetchPosts({ userId });

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
    const populatedPost = await Post.findById(postId)
      .populate({
        path: 'userId',
        select: USER_FIELDS,
        match: { isBanned: { $ne: true } }
      })
      .populate({
        path: 'repostOf',
        populate: {
          path: 'userId',
          select: USER_FIELDS,
          match: { isBanned: { $ne: true } },
        },
      });

    if (!populatedPost || !populatedPost.userId) {
      return res.status(404).json({ message: "Post author not found" });
    }

    // Calculate reaction counts for response (similar to reactToPost)
    const validReactions = ['like', 'love', 'laugh', 'angry', 'sad', 'wow'];
    const reactionCounts = {};
    validReactions.forEach(reaction => {
      reactionCounts[reaction] = 0;
    });

    populatedPost.reactions.forEach((reaction) => {
      if (reactionCounts.hasOwnProperty(reaction)) {
        reactionCounts[reaction]++;
      }
    });

    // Add reaction data to response
    const postWithReactions = {
      ...populatedPost.toObject(),
      reactionCounts,
      userReaction: populatedPost.reactions.get(req.user?.id) || null // Include current user's reaction if authenticated
    };

    res.status(200).json(postWithReactions);
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

    // Update link previews based on new description
    if (processedDescription) {
      const urls = extractUrlsFromText(processedDescription);
      if (urls.length > 0) {
        console.log(`🔗 Found ${urls.length} URL(s) in edited post, extracting previews...`);
        let updatedLinkPreviews = [];

        // Remove URLs from description to avoid duplication
        let cleanDescription = processedDescription;
        console.log(`🔍 Edit - Original description: "${processedDescription}"`);
        console.log(`🔗 Edit - Detected URLs:`, urls);

        urls.forEach((url, index) => {
          // Try multiple approaches to remove the URL
          const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          // First try exact match
          let before = cleanDescription;
          cleanDescription = cleanDescription.replace(new RegExp(escapedUrl, 'gi'), '').trim();
          console.log(`  Edit URL ${index + 1} removal attempt 1: "${before}" → "${cleanDescription}"`);

          // If URL still exists, try with simplified patterns
          const urlWithoutProtocol = url.replace(/^https?:\/\//, '');
          if (cleanDescription.includes(urlWithoutProtocol)) {
            before = cleanDescription;
            cleanDescription = cleanDescription.replace(new RegExp(urlWithoutProtocol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
            console.log(`  Edit URL ${index + 1} removal attempt 2: "${before}" → "${cleanDescription}"`);
          }

          const urlWithoutWww = url.replace(/^https?:\/\/(?:www\.)?/, '');
          if (cleanDescription.includes(urlWithoutWww)) {
            before = cleanDescription;
            cleanDescription = cleanDescription.replace(new RegExp(urlWithoutWww.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
            console.log(`  Edit URL ${index + 1} removal attempt 3: "${before}" → "${cleanDescription}"`);
          }
        });

        // Clean up any double spaces or trailing commas left after URL removal
        cleanDescription = cleanDescription.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim();

        // Update description if URLs were removed
        if (cleanDescription !== processedDescription) {
          post.description = cleanDescription || processedDescription;
          console.log(`🧹 Edit - Cleaned description: "${processedDescription}" → "${cleanDescription}"`);
        } else {
          console.log(`⚠️ Edit - No URLs removed, keeping original: "${processedDescription}"`);
        }

        for (const url of urls.slice(0, 3)) { // Limit to 3 previews per post
          try {
            const metadata = await extractLinkMetadata(url);
            if (metadata) {
              updatedLinkPreviews.push({
                url,
                title: metadata.title,
                description: metadata.description,
                image: metadata.image,
                siteName: metadata.siteName,
                favicon: metadata.favicon,
              });
              console.log(`✅ Link preview extracted for edit: ${url}`);
            }
          } catch (error) {
            console.log(`⚠️ Failed to extract preview for edit: ${url}`);
          }

          // Small delay between requests to be respectful
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        post.linkPreviews = updatedLinkPreviews;
      } else {
        // No URLs found, clear link previews
        post.linkPreviews = [];
      }
    }

    // Handle media file
    let finalMediaPath = post.mediaPath; // Keep existing media by default
    let finalMediaType = post.mediaType;
    let mediaSize = post.mediaSize;
    let tempFilesToClean = [];

    if (req.file) {
      // New media file uploaded
      const uploadedPath = path.join("public/assets", req.file.filename);
      finalMediaType = mediaType || 'image';

      if (finalMediaType === 'image') {
        console.log("🖼️ Processing uploaded image for optimization...");
        const processedImage = await processPostImage(uploadedPath);

        if (processedImage.processedPath !== uploadedPath) {
          finalMediaPath = path.basename(processedImage.processedPath);
          mediaSize = processedImage.processedSize;

          // Mark original file for cleanup
          tempFilesToClean.push(uploadedPath);

          console.log(`✅ Image optimized: ${processedImage.compressionRatio}% of original size`);
        } else {
          finalMediaPath = req.file.filename;
          mediaSize = req.file.size;
          console.log("⚠️ Image processing failed, using original file");
        }
      } else {
        finalMediaPath = req.file.filename;
        mediaSize = req.file.size;
        console.log("📎 Non-image media uploaded:", req.file.filename, "Type:", finalMediaType);
      }
    } else if (mediaPath === null) {
      // Explicitly removing media
      finalMediaPath = null;
      finalMediaType = null;
      mediaSize = null;
    }

    // Update post
    post.mediaPath = finalMediaPath;
    post.mediaType = finalMediaType;
    post.mediaSize = mediaSize;
    post.editedAt = new Date();

    await post.save();

    // Clean up temporary files
    if (tempFilesToClean.length > 0) {
      await cleanupTempFiles(tempFilesToClean);
    }

    console.log(`✏️ Post edited by user ${userId}: ${post._id}`);
    res.status(200).json(post);
  } catch (err) {
    console.error("Error editing post:", err);
    res.status(500).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // IDOR protection: Check if user owns the post
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    // Mark as deleted instead of actually deleting (soft delete)
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    console.log(`🗑️ Post deleted by user ${userId}: ${post._id}`);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
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

    console.log(`🗑️ Comment deleted by user ${userId} from post ${id}`);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
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
    const currentReaction = post.reactions.get(userId);

    if (isLiked) {
      // Unlike the post
      post.likes.delete(userId);
      post.reactions.delete(userId);
    } else {
      // Like the post
      post.likes.set(userId, true);
      post.reactions.set(userId, 'like');

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

    // Calculate reaction counts for response
    const validReactions = ['like', 'love', 'laugh', 'angry', 'sad', 'wow'];
    const reactionCounts = {};
    validReactions.forEach(reaction => {
      reactionCounts[reaction] = 0;
    });

    post.reactions.forEach((reaction) => {
      if (reactionCounts.hasOwnProperty(reaction)) {
        reactionCounts[reaction]++;
      }
    });

    res.status(200).json({
      ...updatedPost.toObject(),
      reactionCounts,
      userReaction: post.reactions.get(userId) || null
    });
  } catch (err) {
    console.error("Error liking/unliking post:", err);
    res.status(404).json({ message: err.message });
  }
};

/* REACT TO POST - Multiple reaction types */
export const reactToPost = async (req, res) => {
  try {
    console.log("🔄 Reacting to post:", req.params.id, req.body);
    
    const { id } = req.params;
    const { userId, reactionType } = req.body;

    if (!userId || !reactionType) {
      console.log("❌ Missing userId or reactionType");
      return res.status(400).json({ message: "User ID and reaction type are required" });
    }

    const validReactions = ['like', 'love', 'laugh', 'angry', 'sad', 'wow'];
    if (!validReactions.includes(reactionType)) {
      console.log("❌ Invalid reaction type:", reactionType);
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    console.log("🔍 Finding post:", id);
    const post = await Post.findById(id);
    if (!post) {
      console.log("❌ Post not found:", id);
      return res.status(404).json({ message: "Post not found" });
    }

    const currentReaction = post.reactions.get(userId);

    if (currentReaction === reactionType) {
      // Remove reaction if same reaction is clicked
      post.reactions.delete(userId);
      post.likes.delete(userId); // Also remove from legacy likes
    } else {
      // Set new reaction
      post.reactions.set(userId, reactionType);
      // Keep legacy likes in sync for backward compatibility
      if (reactionType === 'like') {
        post.likes.set(userId, true);
      } else {
        post.likes.delete(userId);
      }

      // Create notification for reaction (only if not reacting to own post)
      if (post.userId.toString() !== userId) {
        const reactionMessages = {
          'like': 'liked your post',
          'love': 'loved your post',
          'laugh': 'laughed at your post',
          'angry': 'reacted angrily to your post',
          'sad': 'reacted sadly to your post',
          'wow': 'reacted with wow to your post'
        };

        await createNotification(
          post.userId,
          userId,
          'like', // Keep as 'like' for notification type
          reactionMessages[reactionType],
          post._id,
          'post'
        );
      }
    }

    const updatedPost = await post.save();

    // Calculate reaction counts for response
    const reactionCounts = {};
    validReactions.forEach(reaction => {
      reactionCounts[reaction] = 0;
    });

    post.reactions.forEach((reaction) => {
      if (reactionCounts.hasOwnProperty(reaction)) {
        reactionCounts[reaction]++;
      }
    });

    res.status(200).json({
      ...updatedPost.toObject(),
      reactionCounts,
      userReaction: post.reactions.get(userId) || null
    });
  } catch (err) {
    console.error("❌ Error reacting to post:", err);
    console.error("❌ Error stack:", err.stack);
    res.status(500).json({ 
      message: err.message,
      error: "REACTION_ERROR",
      details: err.stack 
    });
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
export const getLinkPreview = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    console.log(`🔗 Fetching preview for: ${url}`);

    const metadata = await extractLinkMetadata(url);

    if (metadata) {
      res.status(200).json(metadata);
    } else {
      res.status(404).json({ message: "Could not extract metadata for this URL" });
    }
  } catch (error) {
    console.error("Error fetching link preview:", error);
    res.status(500).json({ message: "Failed to fetch link preview" });
  }
};
