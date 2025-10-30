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
    // New media fields
    mediaPath: String, // Path to the media file (legacy single media)
    mediaType: {
      type: String,
      enum: ['image', 'audio', 'clip', null],
      default: null,
    },
    mediaDuration: Number, // Duration in seconds for video/audio
    mediaSize: Number, // File size in bytes
    
    // Multiple media fields for galleries
    mediaPaths: [String], // Array of media file paths
    mediaTypes: [String], // Array of media types
    mediaSizes: [Number], // Array of file sizes
    mediaDurations: [Number], // Array of durations for audio/video
    likes: {
      type: Map,
      of: Boolean,
    },
    // New reactions system - supports multiple reaction types
    reactions: {
      type: Map,
      of: {
        type: String,
        enum: ['like', 'love', 'laugh', 'angry', 'sad', 'wow'],
        default: 'like'
      },
      default: new Map()
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
    // Link preview fields
    linkPreviews: [{
      url: {
        type: String,
        required: true,
      },
      title: String,
      description: String,
      image: String,
      siteName: String,
      favicon: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    rssSource: {
      type: String,
      default: null,
      index: true,
    },
    rssGuid: {
      type: String,
      default: null,
      index: true,
    },
    rssLink: {
      type: String,
      default: null,
      index: true,
    },
    repostOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    repostComment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
