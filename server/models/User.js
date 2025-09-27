import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    picturePath: {
      type: String,
      default: "/assets/default.jpg",
    },
    friends: {
      type: Array,
      default: [],
    },
    friendRequests: {
      type: Array,
      default: [],
    },
    sentFriendRequests: {
      type: Array,
      default: [],
    },
    location: String,
    bio: String,
    viewedProfile: Number,
    impressions: Number,
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    bannedBy: {
      type: String,
      default: null,
    },
    banReason: {
      type: String,
      default: null,
    },
    // Email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    verificationToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;
