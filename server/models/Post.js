import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    location: String,
    description: String,
    picturePath: String, // Legacy field for backward compatibility
    userPicturePath: String,
    // New media fields - Arrays for multiple media support
    mediaPaths: [{
      type: String,
      default: []
    }],
    mediaTypes: [{
      type: String,
      enum: ['image', 'audio', 'clip', null],
      default: []
    }],
    mediaSizes: [{
      type: Number,
      default: []
    }],
    likes: {
      type: Map,
      of: Boolean,
    },
    comments: {
      type: [{
        id: {
          type: String,
          required: true,
          default: () => Math.random().toString(36).substr(2, 9),
        },
        userId: {
          type: String,
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        mediaPath: String,
        mediaType: {
          type: String,
          enum: ['image', 'audio', 'clip', null],
          default: null,
        },
        mediaSize: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      }],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: {
      type: String,
      default: null,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
