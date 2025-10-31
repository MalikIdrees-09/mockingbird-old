import { 
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
  PlayArrowOutlined,
  VolumeUpOutlined,
  Send,
  AttachFile,
  Close,
  Edit,
  Check,
  Clear,
  PushPin,
  PushPinOutlined,
  Delete,
  Repeat,
  Undo,
} from "@mui/icons-material";
import { 
  Box, 
  Divider, 
  IconButton, 
  Typography, 
  useTheme, 
  Chip,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removePost, setPost, setPosts } from "state";
import { handleBannedUserError } from "utils/api";
import { API_BASE_URL } from "utils/api";
import WidgetWrapper from "components/WidgetWrapper";
import Friend from "components/Friend";
import AdminBadge from "components/AdminBadge";
import NewsBadge from "components/NewsBadge";
import ShareDialog from "components/ShareDialog";
import UserImage from "components/UserImage";
import ReactionPicker from "components/ReactionPicker";
import ImageGallery from "components/ImageGallery";
import AudioWaveform from "components/AudioWaveform";
import MediaCarousel from "components/MediaCarousel";
import ReactMarkdown from "react-markdown";
import LinkRenderer, { MarkdownLink } from "components/LinkRenderer";
import LinkPreview from 'components/LinkPreview';

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  userPicturePath,
  likes,
  reactions,
  reactionCounts,
  userReaction,
  comments,
  mediaPath,
  mediaType,
  mediaSize,
  mediaPaths,
  mediaTypes,
  mediaSizes,
  mediaDurations,
  mediaDuration,
  isDetailView = false,
  isAdmin = false,
  pinned = false,
  showAddFriend = true,
  linkPreviews = [], // Add linkPreviews prop
  repostOf = null,
  repostComment = "",
}) => {
  const [isComments, setIsComments] = useState(isDetailView);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [selectedMediaPreview, setSelectedMediaPreview] = useState(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [isCommentFormActive, setIsCommentFormActive] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostText, setEditingPostText] = useState(description);
  const [editingPostMediaFile, setEditingPostMediaFile] = useState(null);
  const [editingPostMediaPreview, setEditingPostMediaPreview] = useState(null);
  const [editDescription, setEditDescription] = useState(description || "");
  const [isSubmittingPostEdit, setIsSubmittingPostEdit] = useState(false);
  const [profilePictureKey, setProfilePictureKey] = useState(Date.now());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [repostCommentInput, setRepostCommentInput] = useState(repostComment || "");
  const [isReposting, setIsReposting] = useState(false);
  const [repostError, setRepostError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const userState = useSelector((state) => state.user || {});
  const {
    _id: loggedInUserId,
    friends: rawLoggedInUserFriends = [],
    friendRequests: rawLoggedInUserFriendRequests = [],
    sentFriendRequests: rawLoggedInUserSentFriendRequests = [],
    picturePath: loggedInUserPicturePath,
    isAdmin: loggedInUserIsAdmin,
  } = userState;

  const normalizedPostUserId = useMemo(() => {
    if (postUserId && typeof postUserId === "object") {
      return postUserId._id || "";
    }
    return postUserId;
  }, [postUserId]);

  const loggedInUserFriendIds = useMemo(
    () =>
      (rawLoggedInUserFriends || [])
        .map((friend) => {
          if (!friend) return null;
          if (typeof friend === "string") return friend;
          return friend._id || null;
        })
        .filter(Boolean),
    [rawLoggedInUserFriends]
  );

  const loggedInUserFriendRequestIds = useMemo(
    () =>
      (rawLoggedInUserFriendRequests || [])
        .map((request) => {
          if (!request) return null;
          if (typeof request === "string") return request;
          return request._id || null;
        })
        .filter(Boolean),
    [rawLoggedInUserFriendRequests]
  );

  const loggedInUserSentFriendRequestIds = useMemo(
    () =>
      (rawLoggedInUserSentFriendRequests || [])
        .map((request) => {
          if (!request) return null;
          if (typeof request === "string") return request;
          return request._id || null;
        })
        .filter(Boolean),
    [rawLoggedInUserSentFriendRequests]
  );
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const postsState = useSelector((state) => state.posts || []);

  const ancestorPost = useMemo(() => {
    if (!repostOf) return null;
    if (repostOf && typeof repostOf === "object") return repostOf;
    return postsState.find((p) => p && p._id === repostOf) || null;
  }, [repostOf, postsState]);

  const ancestorAuthor = ancestorPost?.userId;
  const ancestorName = useMemo(() => {
    if (!ancestorPost) return "Original Post";

    const directName = `${ancestorPost.firstName || ""} ${ancestorPost.lastName || ""}`.trim();
    if (directName) return directName;

    if (ancestorAuthor && typeof ancestorAuthor === "object") {
      const authorName = `${ancestorAuthor.firstName || ""} ${ancestorAuthor.lastName || ""}`.trim();
      if (authorName) return authorName;
    }

    if (ancestorPost.name) return ancestorPost.name;

    return "Original Post";
  }, [ancestorPost, ancestorAuthor]);
  const ancestorPostId = ancestorPost?._id || (typeof repostOf === "string" ? repostOf : null);

  const isRepost = Boolean(ancestorPost);
  const isOwnPost = loggedInUserId === postUserId;
  const canUndoRepost = isOwnPost && isRepost;

  // Listen for profile picture updates to force re-render
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setProfilePictureKey(Date.now());
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  const theme = useTheme();
  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  const friendStatus = useMemo(() => {
    if (!normalizedPostUserId) return 'none';
    if (loggedInUserFriendIds.includes(normalizedPostUserId)) {
      return 'friends';
    }
    if (loggedInUserSentFriendRequestIds.includes(normalizedPostUserId)) {
      return 'request_sent';
    }
    if (loggedInUserFriendRequestIds.includes(normalizedPostUserId)) {
      return 'request_received';
    }
    return 'none';
  }, [
    normalizedPostUserId,
    loggedInUserFriendIds,
    loggedInUserSentFriendRequestIds,
    loggedInUserFriendRequestIds,
  ]);

  // Handle friend action updates
  const handleFriendAction = (action, friendId) => {
    // This will be called when friend actions happen in the Friend component
    // The Redux state will be updated automatically by the Friend component's actions
    // No additional logic needed here as the component will re-render with new state
  };

  // Handle post click to navigate to detail page (only when not in detail view)
  const handlePostClick = () => {
    // DISABLED: Post click navigation removed per user request
    return;
  };

  // Helper function to format file size
  const getFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to render media based on type - supports both single and multiple media
  const renderMedia = () => {
    // Check if we have multiple media (new format)
    if (mediaPaths && mediaPaths.length > 0) {
      // Use MediaCarousel for all media types
      return (
        <Box sx={{ mt: "0.75rem" }}>
          <MediaCarousel mediaFiles={mediaPaths} mediaTypes={mediaTypes} />
        </Box>
      );
    }

    // Fallback to single media (old format for backward compatibility)
    const currentMediaPath = mediaPath;
    const currentMediaType = mediaType;
    
    if (!currentMediaPath) return null;

    const mediaUrl = `${API_BASE_URL}/assets/${currentMediaPath}`;

    switch (currentMediaType) {
      case 'image':
        return (
          <img
            width="100%"
            height="auto"
            alt="post"
            src={mediaUrl}
            style={{
              borderRadius: "0.75rem",
              marginTop: "0.75rem",
            }}
          />
        );
      
      case 'clip':
        return (
          <Box>
            {mediaSize && (
              <Chip
                icon={<PlayArrowOutlined />}
                label={`Clip • ${getFileSize(mediaSize)}`}
                size="small"
                sx={{ mb: 1, backgroundColor: palette.warning?.light || palette.secondary.light, color: "white" }}
              />
            )}
            <video
              controls
              preload="metadata"
              style={{
                width: "100%",
                borderRadius: "0.75rem",
                marginTop: "0.75rem",
              }}
            >
              <source src={mediaUrl} type="video/webm" />
              <source src={mediaUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
        );
      
      case 'audio':
        return (
          <Box sx={{ mt: "0.75rem" }}>
            <AudioWaveform
              audioSrc={mediaUrl}
              audioSize={mediaSize}
              audioDuration={mediaDuration}
              showControls={true}
              showWaveform={true}
              height={60}
              color={primary}
            />
          </Box>
        );
      
      default:
        return null;
    }
  };

  const handleRepost = async () => {
    try {
      setIsReposting(true);
      setRepostError(null);

      const response = await fetch(`${API_BASE_URL}/posts/${postId}/repost`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId, comment: repostCommentInput.trim() }),
      });

      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return;

      if (!handledResponse.ok) {
        const errorData = await handledResponse.json();
        setRepostError(errorData.message || "Failed to repost");
        return;
      }

      const posts = await handledResponse.json();
      dispatch(setPosts({ posts }));
      setRepostDialogOpen(false);
      setRepostCommentInput("");
    } catch (error) {
      console.error("Error reposting post:", error);
      setRepostError("Failed to repost. Please try again.");
    } finally {
      setIsReposting(false);
    }
  };

  const handleUndoRepost = async () => {
    try {
      setIsReposting(true);
      setRepostError(null);

      const response = await fetch(`${API_BASE_URL}/posts/${postId}/repost`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });

      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return;

      if (!handledResponse.ok) {
        const errorData = await handledResponse.json();
        setRepostError(errorData.message || "Failed to undo repost");
        return;
      }

      const posts = await handledResponse.json();
      dispatch(setPosts({ posts }));
    } catch (error) {
      console.error("Error undoing repost:", error);
      setRepostError("Failed to undo repost. Please try again.");
    } finally {
      setIsReposting(false);
    }
  };

  const handleOpenRepostDialog = () => {
    setRepostError(null);
    setRepostCommentInput("");
    setRepostDialogOpen(true);
  };

  const handleViewOriginalPost = () => {
    if (!ancestorPostId) return;
    navigate(`/post/${ancestorPostId}`);
  };

  const patchLike = async () => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });

    // Check for banned user error
    const handledResponse = await handleBannedUserError(response, dispatch);
    if (handledResponse === null) return; // User was logged out

    const updatedPost = await handledResponse.json();
    dispatch(setPost({ post: updatedPost }));
  };

  const handleReactionChange = async (reactionType) => {
    console.log("🔄 Reacting to post:", postId, "with reaction:", reactionType);
    
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/react`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId, reactionType }),
    });

    // Check for banned user error
    const handledResponse = await handleBannedUserError(response, dispatch);
    if (handledResponse === null) return; // User was logged out

    if (!handledResponse.ok) {
      console.error("❌ Reaction failed:", handledResponse.status, await handledResponse.text());
      return;
    }

    const updatedPost = await handledResponse.json();
    console.log("✅ Reaction successful:", updatedPost);
    console.log("🔄 Updating post in state:", updatedPost._id);
    dispatch(setPost({ post: updatedPost }));
    
    // Force a re-render by updating local state if needed
    setTimeout(() => {
      console.log("🔄 Post state updated, checking reaction data:", updatedPost.reactionCounts, updatedPost.userReaction);
    }, 100);
  };

  const submitComment = async () => {
    if (!commentText.trim() && !selectedMediaFile) return;

    setIsSubmittingComment(true);
    try {
      const formData = new FormData();
      formData.append('userId', loggedInUserId);
      formData.append('comment', commentText.trim());
      formData.append('userPicturePath', loggedInUserPicturePath || '');

      if (selectedMediaFile) {
        formData.append('media', selectedMediaFile);
        // Determine media type
        if (selectedMediaFile.type.startsWith('image/')) {
          formData.append('mediaType', 'image');
        } else if (selectedMediaFile.type.startsWith('audio/')) {
          formData.append('mediaType', 'audio');
        } else if (selectedMediaFile.type.startsWith('video/') || selectedMediaFile.type === 'image/gif') {
          formData.append('mediaType', 'clip');
        }
      }

      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header when using FormData
        },
        body: formData,
      });

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        const updatedPost = await handledResponse.json();
        dispatch(setPost({ post: updatedPost }));
        setCommentText("");
        setSelectedMediaFile(null);
        setMediaPreview(null);
        setIsComments(true); // Show comments section if not already shown
        setIsCommentFormActive(false); // Reset form state
        console.log("Comment added successfully");
        
        // Skip splash screen and refresh the page
        localStorage.setItem('skipSplash', 'true');
        window.location.reload();
      } else {
        const errorData = await handledResponse.json();
        console.error("Error submitting comment:", errorData.message);
        alert(`Failed to add comment: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle media file selection
  const handleMediaSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setSelectedMediaFile(file);

      // Create preview
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setMediaPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        // For audio/video, just show file name
        setMediaPreview(file.name);
      }

      // Keep form active when file is selected
      setIsCommentFormActive(true);
    }
  };

  // Handle comment form focus
  const handleCommentFocus = () => {
    setIsCommentFormActive(true);
  };

  // Handle comment form blur (only deactivate if no content and no media)
  const handleCommentBlur = () => {
    // Keep form active if there's text or selected media
    if (!commentText.trim() && !selectedMediaFile) {
      setIsCommentFormActive(false);
    }
  };

  // Remove selected media
  const removeMedia = () => {
    setSelectedMediaFile(null);
    setMediaPreview(null);
    // Keep form active if there's still text
    if (!commentText.trim()) {
      setIsCommentFormActive(false);
    }
  };

  const handleCommentKeyPress = (event) => {
    // Allow new lines with Enter, don't submit
    // Users can submit with the Send button instead
    if (event.key === 'Enter' && !event.shiftKey) {
      // Let it create a new line naturally
      return;
    }
  };

  const startEditingComment = (commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const submitEditedComment = async () => {
    if (!editingCommentText.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment/${editingCommentId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId: loggedInUserId, 
          comment: editingCommentText.trim() 
        }),
      });

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        const updatedPost = await handledResponse.json();
        dispatch(setPost({ post: updatedPost }));
        cancelEditingComment();
      } else {
        const errorData = await handledResponse.json();
        console.error("Error editing comment:", errorData.message);
      }
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  const startEditingPost = () => {
    setIsEditingPost(true);
    setEditingPostText(description);
    // Clear any existing media preview
    setEditingPostMediaFile(null);
    setEditingPostMediaPreview(null);
  };

  const cancelEditingPost = () => {
    setIsEditingPost(false);
    setEditingPostText(description);
    setEditingPostMediaFile(null);
    setEditingPostMediaPreview(null);
    setRemoveExistingMedia(false);
  };

  const submitEditedPost = async () => {
    if (!editingPostText.trim() && !editingPostMediaFile && !(mediaPaths && mediaPaths.length > 0) && !mediaPath && !removeExistingMedia) return;

    setIsSubmittingPostEdit(true);
    try {
      const formData = new FormData();
      formData.append('userId', loggedInUserId);
      formData.append('description', editingPostText.trim());

      // Handle multiple media files
      if (editingPostMediaFile && Array.isArray(editingPostMediaFile)) {
        editingPostMediaFile.forEach((file, index) => {
          formData.append('media', file);
        });
      } else if (editingPostMediaFile) {
        // Single file (backward compatibility)
        formData.append('media', editingPostMediaFile);
      } else if (removeExistingMedia) {
        // No media selected and remove existing media flag is set
        formData.append('mediaPath', 'null');
        formData.append('mediaType', 'null');
      }

      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        const updatedPost = await handledResponse.json();
        dispatch(setPost({ post: updatedPost }));
        cancelEditingPost();
      } else {
        const errorData = await handledResponse.json();
        console.error("Error editing post:", errorData.message);
        alert(errorData.message || "Failed to edit post");
      }
    } catch (error) {
      console.error("Error editing post:", error);
      alert("Failed to edit post. Please try again.");
    } finally {
      setIsSubmittingPostEdit(false);
    }
  };

  const handlePin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/posts/${postId}/pin`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(setPost({ post: data.post }));
      } else {
        console.error("Error pinning/unpinning post");
      }
    } catch (error) {
      console.error("Error pinning/unpinning post:", error);
    }
  };

  const deletePost = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: loggedInUserId }),
      });

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        if (isDetailView) {
          navigate("/home");
        } else {
          dispatch(removePost({ postId }));
        }
        setDeleteDialogOpen(false);
        setDeleteError(null);
      } else {
        const errorData = await handledResponse.json();
        console.error("Error deleting post:", errorData.message);
        setDeleteError(errorData.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setDeleteError("Failed to delete post. Please try again.");
    }
  };

  return (
    <Box>
      <WidgetWrapper 
        m="1.5rem 0"
        sx={{
          borderRadius: '20px',
          overflow: 'visible',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 48px rgba(5, 12, 28, 0.68)'
              : '0 16px 36px rgba(15, 23, 42, 0.22)',
          }
        }}
      >
        <Box sx={{ position: "relative" }}>
          {pinned && (
            <Box
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                bgcolor: 'linear-gradient(135deg, #DAA520, #B8941F)',
                color: "white",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
                boxShadow: '0 4px 12px rgba(218,165,32,0.4)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 4px 12px rgba(218,165,32,0.4)' },
                  '50%': { boxShadow: '0 4px 20px rgba(218,165,32,0.6)' },
                  '100%': { boxShadow: '0 4px 12px rgba(218,165,32,0.4)' }
                }
              }}
            >
              <PushPin sx={{ fontSize: "1rem" }} />
            </Box>
          )}
          <Friend
            friendId={postUserId}
            name={name}
            subtitle={location || ""}
            userPicturePath={postUserId === loggedInUserId ? loggedInUserPicturePath : userPicturePath}
            isAdmin={isAdmin}
            size="60px"
            friendStatus={friendStatus}
            onFriendAction={handleFriendAction}
            showAcceptReject={false}
          />
        </Box>

        {isRepost && ancestorPost && (
          <Box
            sx={{
              mt: 2,
              borderRadius: 2,
              border: `1px solid ${palette.neutral.light}`,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 2, pt: 2 }}>
              <FlexBetween>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Repeat fontSize="small" sx={{ color: palette.primary.main }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Reposted from {ancestorName}
                  </Typography>
                </Box>
                {ancestorPostId && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleViewOriginalPost}
                  >
                    View original
                  </Button>
                )}
              </FlexBetween>
              {repostComment && (
                <Typography
                  variant="body1"
                  sx={{ mt: 1, color: palette.neutral.main, fontWeight: 500 }}
                >
                  {repostComment}
                </Typography>
              )}
            </Box>
            <Divider sx={{ mt: repostComment ? 2 : 1 }} />
            <Box sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
              <PostWidget
                postId={ancestorPost._id}
                postUserId={ancestorPost.userId?._id || ancestorPost.userId}
                name={ancestorName}
                description={ancestorPost.description}
                location={ancestorPost.location}
                picturePath={ancestorPost.picturePath}
                userPicturePath={ancestorPost.userPicturePath || ancestorPost.userId?.picturePath || ""}
                likes={ancestorPost.likes || {}}
                reactions={ancestorPost.reactions || {}}
                reactionCounts={ancestorPost.reactionCounts || {}}
                userReaction={ancestorPost.userReaction}
                comments={ancestorPost.comments || []}
                mediaPath={ancestorPost.mediaPath}
                mediaType={ancestorPost.mediaType}
                mediaSize={ancestorPost.mediaSize}
                mediaPaths={ancestorPost.mediaPaths || []}
                mediaTypes={ancestorPost.mediaTypes || []}
                mediaSizes={ancestorPost.mediaSizes || []}
                mediaDurations={ancestorPost.mediaDurations || []}
                mediaDuration={ancestorPost.mediaDuration}
                isDetailView={false}
                isAdmin={ancestorPost.userId?.isAdmin || false}
                pinned={ancestorPost.pinned || false}
                showAddFriend={false}
                linkPreviews={ancestorPost.linkPreviews || []}
                repostOf={ancestorPost.repostOf || null}
                repostComment={ancestorPost.repostComment || ""}
              />
            </Box>
          </Box>
        )}

        {/* Post Content - Show edit form when editing */}
        {!isRepost && (
          isEditingPost ? (
            <Box sx={{ mt: "1.5rem" }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="What's on your mind..."
                value={editingPostText}
                onChange={(e) => setEditingPostText(e.target.value)}
                variant="outlined"
                sx={{
                  mb: 2,
                  "& .MuiOutlinedInput-root": {
                    fontSize: "1rem",
                    borderRadius: '12px',
                    backgroundColor: theme.palette.background.paper,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: '2px',
                    }
                  },
                }}
                disabled={isSubmittingPostEdit}
              />

              {/* Media Preview for editing */}
              {editingPostMediaPreview && (
                <Box sx={{ mb: 2, position: "relative", maxWidth: "200px" }}>
                  {editingPostMediaFile?.type?.startsWith('image/') ? (
                    <img
                      src={editingPostMediaPreview}
                      alt="Preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "150px",
                        borderRadius: "8px",
                        border: `1px solid ${palette.neutral.light}`
                      }}
                    />
                  ) : (
                    <Box sx={{
                      p: 1,
                      bgcolor: palette.background.alt,
                      borderRadius: 1,
                      border: `1px solid ${palette.neutral.light}`,
                      fontSize: "0.75rem",
                      color: palette.neutral.main
                    }}>
                      📎 {editingPostMediaPreview}
                    </Box>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditingPostMediaFile(null);
                      setEditingPostMediaPreview(null);
                    }}
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      bgcolor: "rgba(0,0,0,0.6)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                      minWidth: "32px",
                      minHeight: "32px"
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {/* Current media display */}
              {(mediaPaths && mediaPaths.length > 0) || mediaPath ? (
                <Box sx={{ mb: 2, position: "relative" }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Current media:
                  </Typography>

                  {mediaPaths && mediaPaths.length > 0 ? (
                    mediaPaths.length === 1 ? (
                      <img
                        width="100%"
                        height="auto"
                        alt="current post media"
                        src={`${API_BASE_URL}/assets/${mediaPaths[0]}`}
                        style={{
                          borderRadius: "0.75rem",
                          marginBottom: "8px"
                        }}
                      />
                    ) : (
                      <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", mb: 1 }}>
                        {mediaPaths.map((path, index) => (
                          <Box
                            key={index}
                            sx={{
                              position: "relative",
                              borderRadius: "0.75rem",
                              overflow: "hidden",
                              aspectRatio: "1",
                            }}
                          >
                            <img
                              src={`${API_BASE_URL}/assets/${path}`}
                              alt={`current media ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    )
                  ) : (
                    mediaPath && (
                      <img
                        width="100%"
                        height="auto"
                        alt="current post media"
                        src={`${API_BASE_URL}/assets/${mediaPath}`}
                        style={{
                          borderRadius: "0.75rem",
                          marginBottom: "8px"
                        }}
                      />
                    )
                  )}

                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => {
                        setRemoveExistingMedia(true);
                      }}
                      disabled={isSubmittingPostEdit}
                    >
                      Remove All Media
                    </Button>
                  </Box>
                </Box>
              ) : null}

              {removeExistingMedia && !editingPostMediaFile && (
                <Box sx={{ mb: 2, p: 2, bgcolor: `${palette.error.light}20`, borderRadius: "8px", border: `1px solid ${palette.error.light}` }}>
                  <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                    Media will be removed when you save changes
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center", mb: 2 }}>
                <input
                  type="file"
                  id={`edit-media-input-${postId}`}
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      const validFiles = files.filter((file) => {
                        if (file.size > 10 * 1024 * 1024) {
                          alert(`File "${file.name}" is too large. Maximum size is 10MB per file.`);
                          return false;
                        }
                        return true;
                      });

                      if (validFiles.length > 0) {
                        const limitedFiles = validFiles.slice(0, 10);
                        if (validFiles.length > 10) {
                          alert("Maximum 10 images allowed per post. Only the first 10 files will be used.");
                        }

                        setEditingPostMediaFile(limitedFiles);
                        setEditingPostMediaPreview(`Selected ${limitedFiles.length} image${limitedFiles.length > 1 ? 's' : ''}`);
                      }
                    }
                  }}
                  style={{ display: "none" }}
                />
                <label htmlFor={`edit-media-input-${postId}`}>
                  <Button
                    variant="outlined"
                    size="small"
                    component="span"
                    startIcon={<AttachFile />}
                    disabled={isSubmittingPostEdit}
                  >
                    Replace media
                  </Button>
                </label>
              </Box>

              {!removeExistingMedia && (mediaPaths?.length > 0 || mediaPath) && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => setRemoveExistingMedia(true)}
                    disabled={isSubmittingPostEdit}
                  >
                    Remove existing media
                  </Button>
                </Box>
              )}

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={submitEditedPost}
                  disabled={isSubmittingPostEdit}
                  startIcon={isSubmittingPostEdit ? <CircularProgress size={16} color="inherit" /> : <Check />}
                >
                  {isSubmittingPostEdit ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={cancelEditingPost}
                  disabled={isSubmittingPostEdit}
                  startIcon={<Clear />}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                '&:hover': {
                  transform: 'scale(1.01)',
                  transition: 'transform 0.2s ease'
                }
              }}
            >
              {description && (
                <Box
                  sx={{
                    mt: "1.5rem",
                    '& p': {
                      color: main,
                      fontSize: '1.05rem',
                      lineHeight: 1.6,
                      fontWeight: 400,
                      marginBottom: '0.75rem',
                    },
                    '& p:last-of-type': { marginBottom: 0 },
                  }}
                >
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => <MarkdownLink {...props} />,
                    }}
                  >
                    {description}
                  </ReactMarkdown>
                </Box>
              )}

              {linkPreviews && linkPreviews.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {linkPreviews.map((preview, index) => (
                    <LinkPreview key={index} preview={preview} />
                  ))}
                </Box>
              )}

              {renderMedia()}

              {mediaType === 'audio' && !mediaPath && mediaDurations && mediaDurations.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <AudioWaveform
                    audioSrc={`${API_BASE_URL}/assets/${mediaPaths?.[0]}`}
                    audioSize={mediaSizes?.[0]}
                    audioDuration={mediaDurations?.[0]}
                    showControls={true}
                    showWaveform={true}
                    height={60}
                    color={primary}
                  />
                </Box>
              )}
            </Box>
          )
        )}
        
        {/* Enhanced Like and Comment Buttons Row */}
        <FlexBetween 
          mt="1rem"
          sx={{
            padding: '0.6rem 0.75rem',
            borderRadius: '12px',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0,0,0,0.08)'}`
          }}
        >
          <FlexBetween gap="1rem">
            <ReactionPicker
              postId={postId}
              currentReaction={userReaction}
              reactionCounts={reactionCounts || {}}
              onReactionChange={handleReactionChange}
              density="compact"
            />

            <FlexBetween 
              gap="0.35rem"
              sx={{
                padding: '0.4rem 0.75rem',
                borderRadius: '18px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.05)',
                  transform: 'scale(1.05)'
                }
              }}
              onClick={() => setIsComments(!isComments)}
            >
              <IconButton 
                sx={{ 
                  padding: "0.4rem",
                  color: isComments ? primary : palette.neutral.main,
                  '&:hover': { 
                    backgroundColor: 'transparent',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <ChatBubbleOutlineOutlined sx={{ fontSize: "1.15rem" }} />
              </IconButton>
              <Typography 
                sx={{ 
                  fontSize: "0.85rem", 
                  fontWeight: isComments ? 600 : 500,
                  color: isComments ? primary : palette.neutral.main
                }}
              >
                {comments.length}
              </Typography>
            </FlexBetween>
          </FlexBetween>

          <Box sx={{ display: 'flex', gap: 0.35 }}>
            <IconButton 
              onClick={() => setIsShareDialogOpen(true)}
              sx={{ 
                padding: "0.6rem",
                borderRadius: '12px',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.05)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <ShareOutlined sx={{ fontSize: "1.15rem" }} />
            </IconButton>
            
            {/* Edit/Delete buttons - only show for post owner */}
            {isOwnPost && !isEditingPost ? (
              isRepost ? (
                <Tooltip title="Undo repost" arrow>
                  <span>
                    <IconButton
                      onClick={handleUndoRepost}
                      sx={{
                        ml: 1,
                        padding: "0.75rem",
                        color: palette.warning.main,
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: palette.warning.dark,
                        },
                      }}
                      disabled={!canUndoRepost || isReposting}
                    >
                      <Undo sx={{ fontSize: "1.5rem" }} />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <>
                  <Tooltip title="Edit post" arrow>
                    <IconButton 
                      onClick={startEditingPost}
                      sx={{ 
                        ml: 1, 
                        padding: "0.75rem",
                        "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" }
                      }}
                    >
                      <Edit sx={{ fontSize: "1.5rem" }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete post" arrow>
                    <IconButton 
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteDialogOpen(true);
                      }}
                      sx={{ 
                        ml: 1, 
                        padding: "0.75rem",
                        color: palette.error.main,
                        "&:hover": { 
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: palette.error.dark
                        }
                      }}
                    >
                      <Delete sx={{ fontSize: "1.5rem" }} />
                    </IconButton>
                  </Tooltip>
                </>
              )
            ) : (
              !isEditingPost && (
                <Tooltip title="Repost" arrow>
                  <span>
                    <IconButton
                      onClick={handleOpenRepostDialog}
                      sx={{
                        ml: 1,
                        padding: "0.75rem",
                        color: palette.primary.main,
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: palette.primary.dark,
                        },
                      }}
                      disabled={isReposting}
                    >
                      <Repeat sx={{ fontSize: "1.5rem" }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )
            )}
            
            {loggedInUserIsAdmin && (
              <Tooltip title={pinned ? "Unpin" : "Pin"} arrow>
                <IconButton 
                  onClick={handlePin} 
                  sx={{ 
                    ml: 1, 
                    padding: "0.75rem",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" }
                  }}
                >
                  {pinned ? (
                    <PushPin sx={{ color: primary, fontSize: "1.5rem" }} />
                  ) : (
                    <PushPinOutlined sx={{ fontSize: "1.5rem" }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </FlexBetween>

        {/* Enhanced Reaction Count Summary */}
        {reactionCounts && Object.keys(reactionCounts).length > 0 && (
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 0.5, 
              mt: 1.5, 
              flexWrap: 'wrap', 
              pl: 1,
              animation: 'fadeIn 0.3s ease-in-out',
              '@keyframes fadeIn': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
            {reactionCounts.like > 0 && (
              <Chip
                icon={<FavoriteOutlined sx={{ fontSize: '0.9rem', color: '#1877F2' }} />}
                label={reactionCounts.like}
                size="small"
                sx={{ 
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(24, 119, 242, 0.1)',
                  color: '#1877F2',
                  '& .MuiChip-label': { px: 0.75 }
                }}
              />
            )}
            {reactionCounts.love > 0 && (
              <Chip
                label={`❤️ ${reactionCounts.love}`}
                size="small"
                sx={{ 
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(243, 62, 88, 0.1)',
                  color: '#f33e58',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
            {reactionCounts.laugh > 0 && (
              <Chip
                label={`😂 ${reactionCounts.laugh}`}
                size="small"
                sx={{ 
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(247, 185, 36, 0.1)',
                  color: '#f7b924',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
            {reactionCounts.wow > 0 && (
              <Chip
                label={`😮 ${reactionCounts.wow}`}
                size="small"
                sx={{ 
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(247, 185, 36, 0.1)',
                  color: '#f7b924',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
            {reactionCounts.sad > 0 && (
              <Chip
                label={`😢 ${reactionCounts.sad}`}
                size="small"
                sx={{ 
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(247, 185, 36, 0.1)',
                  color: '#f7b924',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
            {reactionCounts.angry > 0 && (
              <Chip
                label={`😠 ${reactionCounts.angry}`}
                size="small"
                sx={{ 
                  height: '24px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(233, 67, 53, 0.1)',
                  color: '#e94335',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
          </Box>
        )}

        {isComments && (
          <Box mt="0.5rem">
            {comments.map((comment, i) => {
              // Handle both old string format and new object format
              const isOldFormat = typeof comment === 'string';
              const commentText = isOldFormat ? comment : comment.text;
              const commentUserName = isOldFormat ? 'Unknown User' : comment.userName;
              const commentUserId = isOldFormat ? null : comment.userId;
              const commentIsAdmin = isOldFormat ? false : comment.isAdmin || false;
              const commentUserPicturePath = isOldFormat ? null : comment.userPicturePath;
              const commentMedia = isOldFormat ? null : comment.mediaPath;
              const commentMediaType = isOldFormat ? null : comment.mediaType;
              const commentMediaSize = isOldFormat ? null : comment.mediaSize;

              return (
                <Box key={isOldFormat ? `comment-${i}` : comment.id}>
                  <Divider />
                  <Box sx={{ p: "0.5rem 1rem" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <UserImage
                          image={commentUserId === loggedInUserId ? loggedInUserPicturePath : commentUserPicturePath}
                          size="32px"
                          name={commentUserName}
                          key={`comment-user-${commentUserId}-${profilePictureKey}`}
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography sx={{ color: primary, fontWeight: "bold", fontSize: "0.875rem" }}>
                            {commentUserName}
                          </Typography>
                          {commentIsAdmin && <AdminBadge size="small" />}
                        </Box>
                      </Box>
                      
                      {/* Edit button - only show for comment author */}
                      {!isOldFormat && commentUserId === loggedInUserId && editingCommentId !== comment.id && (
                        <IconButton
                          size="small"
                          onClick={() => startEditingComment(comment.id, commentText)}
                          sx={{ 
                            color: palette.neutral.main, 
                            "&:hover": { color: primary },
                            padding: "0.5rem",
                            minWidth: "44px",
                            minHeight: "44px"
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                      
                      {/* Delete button - only show for comment author */}
                      {!isOldFormat && commentUserId === loggedInUserId && editingCommentId !== comment.id && (
                        <IconButton
                          size="small"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this comment?")) {
                              try {
                                const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment/${comment.id}`, {
                                  method: "DELETE",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ userId: loggedInUserId }),
                                });

                                // Check for banned user error
                                const handledResponse = await handleBannedUserError(response, dispatch);
                                if (handledResponse === null) return; // User was logged out

                                if (handledResponse.ok) {
                                  const updatedPost = await handledResponse.json();
                                  dispatch(setPost({ post: updatedPost }));
                                  
                                  // Skip splash screen and refresh the page
                                  localStorage.setItem('skipSplash', 'true');
                                  window.location.reload();
                                } else {
                                  const errorData = await handledResponse.json();
                                  console.error("Error deleting comment:", errorData.message);
                                  alert(errorData.message || "Failed to delete comment");
                                }
                              } catch (error) {
                                console.error("Error deleting comment:", error);
                                alert("Failed to delete comment. Please try again.");
                              }
                            }
                          }}
                          sx={{ 
                            color: palette.error.main, 
                            "&:hover": { color: palette.error.dark },
                            padding: "0.5rem",
                            minWidth: "44px",
                            minHeight: "44px"
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    
                    {/* Edit form */}
                    {editingCommentId === comment.id ? (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          variant="outlined"
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              fontSize: "0.875rem",
                            },
                          }}
                        />
                        <Box sx={{ display: "flex", gap: "0.5rem", mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={submitEditedComment}
                            disabled={!editingCommentText.trim()}
                          >
                            <Check fontSize="small" />
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={cancelEditingComment}
                          >
                            <Clear fontSize="small" />
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <LinkRenderer
                        text={commentText}
                        variant="body2"
                        sx={{ color: main, mb: 1 }}
                      />
                    )}
                    
                    {/* Comment Media Display */}
                    {commentMedia && (
                      <Box sx={{ mt: 1 }}>
                        {commentMediaType === 'image' && (
                          <img
                            src={`${API_BASE_URL}/assets/${commentMedia}`}
                            alt="Comment attachment"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "200px",
                              borderRadius: "8px",
                              border: `1px solid ${palette.neutral.light}`
                            }}
                          />
                        )}
                        {commentMediaType === 'audio' && (
                          <Box sx={{
                            bgcolor: palette.background.alt,
                            borderRadius: "8px",
                            p: 1,
                            border: `1px solid ${palette.neutral.light}`
                          }}>
                            <audio
                              controls
                              style={{ width: "100%" }}
                              preload="metadata"
                            >
                              <source src={`${API_BASE_URL}/assets/${commentMedia}`} type="audio/mpeg" />
                              <source src={`${API_BASE_URL}/assets/${commentMedia}`} type="audio/wav" />
                              Your browser does not support the audio element.
                            </audio>
                            {commentMediaSize && (
                              <Typography variant="caption" sx={{ mt: 0.5, color: palette.neutral.main }}>
                                Audio • {getFileSize(commentMediaSize)}
                              </Typography>
                            )}
                          </Box>
                        )}
                        {commentMediaType === 'clip' && (
                          <Box>
                            {commentMediaSize && (
                              <Chip
                                icon={<PlayArrowOutlined />}
                                label={`Clip • ${getFileSize(commentMediaSize)}`}
                                size="small"
                                sx={{ mb: 1, backgroundColor: palette.warning?.light || palette.secondary.light, color: "white" }}
                              />
                            )}
                            <video
                              controls
                              preload="metadata"
                              style={{
                                width: "100%",
                                borderRadius: "0.75rem",
                              }}
                            >
                              <source src={`${API_BASE_URL}/assets/${commentMedia}`} type="video/webm" />
                              <source src={`${API_BASE_URL}/assets/${commentMedia}`} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
            <Divider />
            
            {/* Comment Input Section */}
            <Box sx={{ p: "1rem" }}>
              <Box sx={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={isCommentFormActive ? 2 : 1}
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={handleCommentKeyPress}
                    onFocus={handleCommentFocus}
                    onBlur={handleCommentBlur}
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.9rem",
                        transition: "all 0.2s ease",
                      },
                    }}
                    disabled={isSubmittingComment}
                  />
                  
                  {/* Media Preview */}
                  {mediaPreview && (
                    <Box sx={{ mt: 1, position: "relative", maxWidth: "200px" }}>
                      {selectedMediaFile?.type.startsWith('image/') ? (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "150px",
                            borderRadius: "8px",
                            border: `1px solid ${palette.neutral.light}`
                          }}
                        />
                      ) : (
                        <Box sx={{
                          p: 1,
                          bgcolor: palette.background.alt,
                          borderRadius: 1,
                          border: `1px solid ${palette.neutral.light}`,
                          fontSize: "0.75rem",
                          color: palette.neutral.main
                        }}>
                          📎 {mediaPreview}
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        onClick={removeMedia}
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          bgcolor: "rgba(0,0,0,0.6)",
                          color: "white",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                          minWidth: "32px",
                          minHeight: "32px"
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* Action Buttons - Only show when form is active or has content */}
                {isCommentFormActive && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {/* Media Attachment Button */}
                    <input
                      type="file"
                      id={`media-input-${postId}`}
                      accept="image/*,audio/*,video/webm,image/gif"
                      onChange={handleMediaSelect}
                      style={{ display: "none" }}
                    />
                    <label htmlFor={`media-input-${postId}`}>
                      <IconButton
                        component="span"
                        sx={{
                          bgcolor: selectedMediaFile ? palette.primary.main : "transparent",
                          color: selectedMediaFile ? "white" : palette.neutral.main,
                          "&:hover": {
                            bgcolor: selectedMediaFile ? palette.primary.dark : palette.action.hover
                          },
                          padding: "0.75rem",
                          minWidth: "44px",
                          minHeight: "44px"
                        }}
                        disabled={isSubmittingComment}
                      >
                        <AttachFile />
                      </IconButton>
                    </label>

                    {/* Submit Button */}
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={submitComment}
                      disabled={(!commentText.trim() && !selectedMediaFile) || isSubmittingComment}
                      sx={{
                        minWidth: "44px",
                        minHeight: "44px",
                        px: 2,
                        py: 1,
                      }}
                    >
                      {isSubmittingComment ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Send />
                      )}
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </WidgetWrapper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteError(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete this post?</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            This action can’t be undone. The post and its comments will be removed for everyone.
          </Typography>
          {deleteError && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                borderRadius: 1,
                backgroundColor: theme.palette.error.light + '20',
              }}
            >
              <Typography variant="body2" color="error.main">
                {deleteError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setDeleteError(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={deletePost}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ShareDialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        postId={postId}
        postDescription={description}
      />

      <Dialog
        open={repostDialogOpen}
        onClose={() => {
          if (isReposting) return;
          setRepostDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share this post on your profile?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add an optional comment before reposting.
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Add your thoughts..."
            value={repostCommentInput}
            onChange={(e) => setRepostCommentInput(e.target.value)}
            disabled={isReposting}
          />
          {repostError && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 1,
                backgroundColor: theme.palette.error.light + '20',
              }}
            >
              <Typography variant="body2" color="error.main">
                {repostError}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRepostDialogOpen(false)} disabled={isReposting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRepost}
            disabled={isReposting}
          >
            {isReposting ? <CircularProgress size={20} color="inherit" /> : "Repost"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostWidget;
