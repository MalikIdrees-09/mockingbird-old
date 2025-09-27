import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "light",
  user: null,
  token: null,
  posts: [],
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
  updateUser,
  setFriendRequests,
  addSentFriendRequest,
  removeSentFriendRequest,
  addFriendRequest,
  removeFriendRequest,
  addFriend
} = authSlice.actions;
export default authSlice.reducer;
