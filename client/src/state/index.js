import { createSlice } from "@reduxjs/toolkit";

const loadInitialUiTheme = () => {
  if (typeof window === "undefined") {
    return { backgroundType: null, backgroundValue: null, blur: 0, dim: 0 };
  }

  try {
    const stored = window.localStorage.getItem("uiTheme");
    if (!stored) {
      return { backgroundType: null, backgroundValue: null, blur: 0, dim: 0 };
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return { backgroundType: null, backgroundValue: null, blur: 0, dim: 0 };
    }
    return {
      backgroundType: parsed.backgroundType || null,
      backgroundValue: parsed.backgroundValue || null,
      blur: Number.isFinite(parsed.blur) ? parsed.blur : 0,
      dim: Number.isFinite(parsed.dim) ? parsed.dim : 0,
    };
  } catch (err) {
    console.error("Failed to parse uiTheme from storage", err);
    return { backgroundType: null, backgroundValue: null, blur: 0, dim: 0 };
  }
};

const initialState = {
  mode: "light",
  user: null,
  token: null,
  posts: [],
  // Messaging state
  conversations: [],
  messagesByConversation: {}, // { [conversationId]: Message[] }
  typingByConversation: {}, // { [conversationId]: { [userId]: boolean } }
  activeConversationId: null,
  // UI theme state
  uiTheme: loadInitialUiTheme(),
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Ensure arrays are always initialized
      if (state.user) {
        if (!Array.isArray(state.user.friends)) {
          state.user.friends = [];
        }
        if (!Array.isArray(state.user.friendRequests)) {
          state.user.friendRequests = [];
        }
        if (!Array.isArray(state.user.sentFriendRequests)) {
          state.user.sentFriendRequests = [];
        }
      }
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
    },
    setFriends: (state, action) => {
      if (state.user) {
        // Filter out invalid friends (those with missing essential data)
        const validFriends = Array.isArray(action.payload.friends) 
          ? action.payload.friends.filter(friend => 
              friend && 
              friend._id && 
              friend.firstName && 
              friend.lastName
            )
          : [];
        state.user.friends = validFriends;
      } else {
        console.error("user friends non-existent :(");
      }
    },
    setPosts: (state, action) => {
      state.posts = Array.isArray(action.payload.posts) ? action.payload.posts : [];
    },
    setPost: (state, action) => {
      const updatedPosts = state.posts.map((post) => {
        if (post._id === action.payload.post._id) return action.payload.post;
        return post;
      });
      state.posts = updatedPosts;
    },
    removePost: (state, action) => {
      const { postId } = action.payload || {};
      if (!postId) return;
      state.posts = state.posts.filter((post) => post && post._id !== postId);
    },
    // UI theme reducers
    setBackgroundTheme: (state, action) => {
      const { backgroundType, backgroundValue, blur = 0, dim = 0 } = action.payload || {};
      state.uiTheme = { backgroundType, backgroundValue, blur, dim };
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "uiTheme",
            JSON.stringify({ backgroundType, backgroundValue, blur, dim })
          );
        }
      } catch (err) {
        console.error("Failed to persist uiTheme", err);
      }
    },
    clearBackgroundTheme: (state) => {
      state.uiTheme = { backgroundType: null, backgroundValue: null, blur: 0, dim: 0 };
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("uiTheme");
        }
      } catch (err) {
        console.error("Failed to clear persisted uiTheme", err);
      }
    },
    // Messaging reducers
    setConversations: (state, action) => {
      state.conversations = Array.isArray(action.payload) ? action.payload : [];
    },
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload || null;
    },
    setMessagesForConversation: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messagesByConversation[conversationId] = Array.isArray(messages) ? messages : [];
    },
    addMessageToConversation: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = [];
      }
      const existingIndex = state.messagesByConversation[conversationId].findIndex(
        (m) => m && message && m._id === message._id
      );
      if (existingIndex >= 0) {
        state.messagesByConversation[conversationId][existingIndex] = {
          ...state.messagesByConversation[conversationId][existingIndex],
          ...message,
        };
      } else {
        state.messagesByConversation[conversationId].push(message);
      }
    },
    setTypingForConversation: (state, action) => {
      const { conversationId, userId, isTyping } = action.payload;
      if (!state.typingByConversation[conversationId]) state.typingByConversation[conversationId] = {};
      state.typingByConversation[conversationId][userId] = !!isTyping;
    },
    markMessageDeleted: (state, action) => {
      const { conversationId, messageId } = action.payload || {};
      if (!conversationId || !messageId) return;
      const messages = state.messagesByConversation[conversationId];
      if (!Array.isArray(messages)) return;
      const target = messages.find((m) => m && m._id === messageId);
      if (!target) return;
      target.isDeleted = true;
      target.content = "";
      target.media = [];
      target.mediaTypes = [];
    },
    markConversationRead: (state, action) => {
      const { conversationId } = action.payload;
      const messages = state.messagesByConversation[conversationId] || [];
      const userId = state.user?._id;
      messages.forEach(m => {
        if (m.recipientId === userId && !m.readAt) m.readAt = new Date().toISOString();
      });
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      // Ensure arrays are always initialized
      if (state.user) {
        if (!Array.isArray(state.user.friends)) {
          state.user.friends = [];
        }
        if (!Array.isArray(state.user.friendRequests)) {
          state.user.friendRequests = [];
        }
        if (!Array.isArray(state.user.sentFriendRequests)) {
          state.user.sentFriendRequests = [];
        }
      }
    },
    // Friend request actions
    setFriendRequests: (state, action) => {
      if (state.user) {
        state.user.friendRequests = Array.isArray(action.payload.friendRequests) ? action.payload.friendRequests : [];
      }
    },
    addSentFriendRequest: (state, action) => {
      if (state.user && !state.user.sentFriendRequests.includes(action.payload.userId)) {
        state.user.sentFriendRequests.push(action.payload.userId);
      }
    },
    removeSentFriendRequest: (state, action) => {
      if (state.user) {
        state.user.sentFriendRequests = state.user.sentFriendRequests.filter(id => id !== action.payload.userId);
      }
    },
    addFriendRequest: (state, action) => {
      if (state.user && !state.user.friendRequests.includes(action.payload.userId)) {
        state.user.friendRequests.push(action.payload.userId);
      }
    },
    removeFriendRequest: (state, action) => {
      if (state.user) {
        state.user.friendRequests = state.user.friendRequests.filter(id => id !== action.payload.userId);
      }
    },
    addFriend: (state, action) => {
      if (state.user && !state.user.friends.includes(action.payload.userId)) {
        state.user.friends.push(action.payload.userId);
        // Remove from friend request lists
        state.user.friendRequests = state.user.friendRequests.filter(id => id !== action.payload.userId);
        state.user.sentFriendRequests = state.user.sentFriendRequests.filter(id => id !== action.payload.userId);
      }
    },
  },
});

export const { 
  setMode, 
  setLogin, 
  setLogout, 
  setFriends, 
  setPosts, 
  setPost, 
  removePost,
  updateUser,
  setFriendRequests,
  addSentFriendRequest,
  removeSentFriendRequest,
  addFriendRequest,
  removeFriendRequest,
  addFriend,
  setBackgroundTheme,
  clearBackgroundTheme,
  setConversations,
  setActiveConversation,
  setMessagesForConversation,
  addMessageToConversation,
  setTypingForConversation,
  markMessageDeleted,
  markConversationRead,
} = authSlice.actions;
export default authSlice.reducer;
