import User from "../models/User.js";
import { createNotification } from "./notifications.js";
import { processProfilePicture, cleanupTempFiles } from "../utils/imageProcessor.js";
import path from "path";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriendRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friendRequests = await Promise.all(
      user.friendRequests.map((id) => User.findById(id))
    );
    const formattedRequests = friendRequests.map(
      ({ _id, firstName, lastName, bio, location, picturePath }) => {
        return { _id, firstName, lastName, bio, location, picturePath };
      }
    );
    res.status(200).json(formattedRequests);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, bio, location, picturePath }) => {
        return { _id, firstName, lastName, bio, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    
    // Prevent users from friending themselves
    if (id === friendId) {
      return res.status(400).json({ message: "You cannot friend yourself" });
    }
    
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (user.friends.includes(friendId)) {
      // Removing friend - no notification needed
      user.friends = user.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== id);
    } else {
      // Adding friend - create friend request notification
      user.friends.push(friendId);
      friend.friends.push(id);

      // Create notification for friend request acceptance
      await createNotification(
        friendId,
        id,
        'friend_accepted',
        'accepted your friend request',
        id,
        'user'
      );
    }
    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, bio, location, picturePath }) => {
        return { _id, firstName, lastName, bio, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* FRIEND REQUEST FUNCTIONS */
export const sendFriendRequest = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    
    // Prevent users from sending friend requests to themselves
    if (id === friendId) {
      return res.status(400).json({ message: "You cannot send a friend request to yourself" });
    }
    
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already friends
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if friend request already sent
    if (user.sentFriendRequests.includes(friendId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if user has already received a friend request from this person
    if (user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: "You have already received a friend request from this user" });
    }

    // Add to sent requests and received requests
    user.sentFriendRequests.push(friendId);
    friend.friendRequests.push(id);

    await user.save();
    await friend.save();

    // Create notification for friend request
    await createNotification(
      friendId,
      id,
      'friend_request',
      'sent you a friend request',
      id,
      'user'
    );

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ message: err.message });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if friend request exists
    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: "No friend request from this user" });
    }

    // Add to friends lists
    user.friends.push(friendId);
    friend.friends.push(id);

    // Remove from request lists
    user.friendRequests = user.friendRequests.filter((id) => id !== friendId);
    friend.sentFriendRequests = friend.sentFriendRequests.filter((id) => id !== id);

    await user.save();
    await friend.save();

    // Create notification for acceptance
    await createNotification(
      friendId,
      id,
      'friend_accepted',
      'accepted your friend request',
      id,
      'user'
    );

    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    res.status(500).json({ message: err.message });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if friend request exists
    if (!user.friendRequests.includes(friendId)) {
      return res.status(400).json({ message: "No friend request from this user" });
    }

    // Remove from request lists
    user.friendRequests = user.friendRequests.filter((id) => id !== friendId);
    friend.sentFriendRequests = friend.sentFriendRequests.filter((id) => id !== id);

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (err) {
    console.error("Error rejecting friend request:", err);
    res.status(500).json({ message: err.message });
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if friend request exists
    if (!user.sentFriendRequests.includes(friendId)) {
      return res.status(400).json({ message: "No friend request sent to this user" });
    }

    // Remove from request lists
    user.sentFriendRequests = user.sentFriendRequests.filter((id) => id !== friendId);
    friend.friendRequests = friend.friendRequests.filter((id) => id !== id);

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend request cancelled" });
  } catch (err) {
    console.error("Error cancelling friend request:", err);
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE PROFILE PICTURE */
export const updateProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is updating their own profile
    if (id !== userId) {
      return res.status(403).json({ message: "You can only update your own profile picture" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Process the uploaded image for profile picture optimization
    const uploadedPath = path.join("/assets", req.file.filename);
    console.log("🖼️ Processing profile picture for optimization...");

    const processedImage = await processProfilePicture(uploadedPath);
    let finalPicturePath;

    if (processedImage.processedPath !== uploadedPath) {
      // Image was processed and optimized
      finalPicturePath = path.basename(processedImage.processedPath);

      // Clean up original file
      await cleanupTempFiles([uploadedPath]);

      console.log(`✅ Profile picture optimized: ${processedImage.compressionRatio}% of original size`);
    } else {
      // Processing failed, use original
      finalPicturePath = req.file.filename;
      console.log("⚠️ Profile picture processing failed, using original file");
    }

    // Update user's profile picture
    user.picturePath = finalPicturePath;
    await user.save();

    // Return updated user data
    const updatedUser = await User.findById(id).select("-password");
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* REMOVE PROFILE PICTURE */
export const removeProfilePicture = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is updating their own profile
    if (id !== userId) {
      return res.status(403).json({ message: "You can only update your own profile picture" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove profile picture
    user.picturePath = "";
    await user.save();

    // Return updated user data
    const updatedUser = await User.findById(id).select("-password");
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE BIO */
export const updateBio = async (req, res) => {
  try {
    const { id } = req.params;
    const { bio } = req.body;
    const userId = req.user.id;

    // Check if user is updating their own bio
    if (id !== userId) {
      return res.status(403).json({ message: "You can only update your own bio" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's bio
    user.bio = bio;
    await user.save();

    // Return updated user data
    const updatedUser = await User.findById(id).select("-password");
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE COMPLETE PROFILE */
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, location, bio } = req.body;
    const userId = req.user.id;

    // Check if user is updating their own profile
    if (id !== userId) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's profile information
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.location = location ? location.trim() : "";
    user.bio = bio ? bio.trim() : "";

    await user.save();

    // Return updated user data
    const updatedUser = await User.findById(id).select("-password");
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: err.message });
  }
};

/* SEARCH USERS */
export const searchUsers = async (req, res) => {
  try {
    const { query, limit = 20, page = 1 } = req.query;
    const currentUserId = req.user ? req.user.id : null; // Allow null for testing

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters long" });
    }

    const searchRegex = new RegExp(query.trim(), 'i');

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query - search in firstName, lastName, email, location, bio
    const searchQuery = {
      $and: [
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { location: searchRegex },
            { bio: searchRegex }
          ]
        },
        // Exclude banned users only (allow searching for current user for testing)
        { isBanned: { $ne: true } }
      ]
    };

    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);

    // Search users with pagination
    const users = await User.find(searchQuery)
      .select('_id firstName lastName email location bio picturePath friends isVerified isAdmin')
      .sort({ firstName: 1, lastName: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Add friendship status for each user (if authenticated)
    const usersWithFriendshipStatus = users.map(user => {
      const userObj = user.toObject();
      userObj.isFriend = currentUserId ? user.friends.includes(currentUserId) : false;
      return userObj;
    });

    res.status(200).json({
      users: usersWithFriendshipStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNextPage: skip + users.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ message: err.message });
  }
};
