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
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setPost } from "state";
import { handleBannedUserError } from "utils/api";
import { API_BASE_URL } from "utils/api";
import WidgetWrapper from "components/WidgetWrapper";
import Friend from "components/Friend";
import AdminBadge from "components/AdminBadge";
import ShareDialog from "components/ShareDialog";
import UserImage from "components/UserImage";
import ReactMarkdown from 'react-markdown';
import LinkRenderer, { MarkdownLink } from 'components/LinkRenderer';

const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  bio,
  picturePath,
  userPicturePath,
  likes,
  comments,
  mediaPath,
  mediaType,
  mediaSize,
  isDetailView = false,
  isAdmin = false,
  pinned = false,
  showAddFriend = true,
}) => {
  const [isComments, setIsComments] = useState(isDetailView);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isCommentFormActive, setIsCommentFormActive] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostText, setEditingPostText] = useState(description);
  const [editingPostMediaFile, setEditingPostMediaFile] = useState(null);
  const [editingPostMediaPreview, setEditingPostMediaPreview] = useState(null);
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const [isSubmittingPostEdit, setIsSubmittingPostEdit] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const loggedInUserFriends = useSelector((state) => state.user.friends || []);
  const loggedInUserFriendRequests = useSelector((state) => state.user.friendRequests || []);
  const loggedInUserSentFriendRequests = useSelector((state) => state.user.sentFriendRequests || []);
  const loggedInUserPicturePath = useSelector((state) => state.user.picturePath);
  const loggedInUserIsAdmin = useSelector((state) => state.user.isAdmin);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  // Determine friend status
  const getFriendStatus = () => {
    if (loggedInUserFriends.includes(postUserId)) {
      return 'friends';
    } else if (loggedInUserSentFriendRequests.includes(postUserId)) {
      return 'request_sent';
    } else if (loggedInUserFriendRequests.includes(postUserId)) {
      return 'request_received';
    }
    return 'none';
  };

  const friendStatus = getFriendStatus();

  // Handle friend action updates
  const handleFriendAction = (action, friendId) => {
    // This will be called when friend actions happen in the Friend component
    // The Redux state will be updated automatically by the Friend component's actions
    // No additional logic needed here as the component will re-render with new state
  };

  // Handle post click to navigate to detail page (only when not in detail view)
  const handlePostClick = () => {
    if (!isDetailView) {
      navigate(`/post/${postId}`);
    }
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

  // Function to render media based on type
  const renderMedia = () => {
    // Only use mediaPath, don't fallback to picturePath for posts without attached media
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
            <Chip
              icon={<VolumeUpOutlined />}
              label={`Audio • ${getFileSize(mediaSize)}`}
              size="small"
              sx={{ mb: 2, backgroundColor: palette.secondary.light, color: "white" }}
            />
            <Box
              sx={{
                backgroundColor: palette.background.alt,
                borderRadius: "0.75rem",
                p: "1rem",
                border: `1px solid ${palette.neutral.light}`,
              }}
            >
              <audio
                controls
                style={{ width: "100%" }}
                preload="metadata"
              >
                <source src={mediaUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </Box>
          </Box>
        );
      
      default:
        return null;
    }
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
    if (!editingPostText.trim() && !editingPostMediaFile && !mediaPath && !removeExistingMedia) return;

    setIsSubmittingPostEdit(true);
    try {
      const formData = new FormData();
      formData.append('userId', loggedInUserId);
      formData.append('description', editingPostText.trim());

      if (editingPostMediaFile) {
        formData.append('media', editingPostMediaFile);
        // Determine media type
        if (editingPostMediaFile.type.startsWith('image/')) {
          formData.append('mediaType', 'image');
        } else if (editingPostMediaFile.type.startsWith('audio/')) {
          formData.append('mediaType', 'audio');
        } else if (editingPostMediaFile.type.startsWith('video/') || editingPostMediaFile.type === 'image/gif') {
          formData.append('mediaType', 'clip');
        }
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
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

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
        // Post deleted successfully - refresh the page or update state
        alert("Post deleted successfully");
        // For now, we'll navigate away since the post is gone
        if (isDetailView) {
          navigate("/home");
        } else {
          // In feed view, we might want to remove the post from state
          // This is complex, so for now we'll just reload the page
          window.location.reload();
        }
      } else {
        const errorData = await handledResponse.json();
        console.error("Error deleting post:", errorData.message);
        alert(errorData.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  return (
    <Box>
      <WidgetWrapper m="2rem 0">
        <Box sx={{ position: "relative" }}>
          {pinned && (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: primary,
                color: "white",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              <PushPin sx={{ fontSize: "0.875rem" }} />
            </Box>
          )}
          <Friend
            friendId={postUserId}
            name={name}
            subtitle={bio ? (bio.length > 100 ? `${bio.substring(0, 100)}...` : bio) : "No bio yet"}
            userPicturePath={postUserId === loggedInUserId ? loggedInUserPicturePath : userPicturePath}
            isAdmin={isAdmin}
            size="55px"
            friendStatus={friendStatus}
            onFriendAction={handleFriendAction}
          />
        </Box>
        {/* Post Content - Show edit form when editing */}
        {isEditingPost ? (
          <Box sx={{ mt: "1rem" }}>
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
                },
              }}
              disabled={isSubmittingPostEdit}
            />
            
            {/* Media Preview for editing */}
            {editingPostMediaPreview && (
              <Box sx={{ mb: 2, position: "relative", maxWidth: "200px" }}>
                {editingPostMediaFile?.type.startsWith('image/') ? (
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
            {mediaPath && !editingPostMediaFile && !removeExistingMedia && (
              <Box sx={{ mb: 2, position: "relative" }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  Current media:
                </Typography>
                {renderMedia()}
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => {
                      // Immediately hide the current media and set flag for saving
                      setRemoveExistingMedia(true);
                      setEditingPostMediaFile(null);
                      setEditingPostMediaPreview(null);
                    }}
                    disabled={isSubmittingPostEdit}
                  >
                    Remove Media
                  </Button>
                </Box>
              </Box>
            )}

            {/* Show message when media will be removed */}
            {removeExistingMedia && !editingPostMediaFile && (
              <Box sx={{ mb: 2, p: 2, bgcolor: palette.error.light + "20", borderRadius: "8px", border: `1px solid ${palette.error.light}` }}>
                <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                  Media will be removed when you save changes
                </Typography>
              </Box>
            )}

            {/* Media upload for editing */}
            <Box sx={{ display: "flex", gap: "0.5rem", alignItems: "center", mb: 2 }}>
              <input
                type="file"
                id={`edit-media-input-${postId}`}
                accept="image/*,audio/*,video/webm,image/gif"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Validate file size (10MB limit)
                    if (file.size > 10 * 1024 * 1024) {
                      alert("File size must be less than 10MB");
                      return;
                    }

                    setEditingPostMediaFile(file);

                    // Create preview
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (e) => setEditingPostMediaPreview(e.target.result);
                      reader.readAsDataURL(file);
                    } else {
                      setEditingPostMediaPreview(file.name);
                    }
                  }
                }}
                style={{ display: "none" }}
              />
              <label htmlFor={`edit-media-input-${postId}`}>
                <Button
                  variant="outlined"
                  component="span"
                  size="small"
                  startIcon={<AttachFile />}
                  disabled={isSubmittingPostEdit}
                >
                  {editingPostMediaFile ? "Change Media" : "Add Media"}
                </Button>
              </label>
              
              {editingPostMediaFile && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => {
                    setEditingPostMediaFile(null);
                    setEditingPostMediaPreview(null);
                  }}
                  disabled={isSubmittingPostEdit}
                >
                  Remove Media
                </Button>
              )}
            </Box>

            {/* Edit action buttons */}
            <Box sx={{ display: "flex", gap: "0.5rem" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={submitEditedPost}
                disabled={(!editingPostText.trim() && !editingPostMediaFile && !mediaPath) || isSubmittingPostEdit}
                startIcon={isSubmittingPostEdit ? undefined : <Check />}
              >
                {isSubmittingPostEdit ? "Saving..." : "Save Changes"}
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
            onClick={handlePostClick}
            sx={{
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              },
              transition: "opacity 0.2s ease",
            }}
          >
            <Typography color={main} sx={{ mt: "1rem" }}>
              <ReactMarkdown components={{ a: MarkdownLink }}>{description}</ReactMarkdown>
            </Typography>
            {renderMedia()}
          </Box>
        )}
        <FlexBetween mt="0.25rem">
          <FlexBetween gap="1rem">
            <FlexBetween gap="0.3rem">
              <IconButton 
                onClick={patchLike}
                sx={{ 
                  padding: "0.75rem",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" }
                }}
              >
                {isLiked ? (
                  <FavoriteOutlined sx={{ color: primary, fontSize: "1.5rem" }} />
                ) : (
                  <FavoriteBorderOutlined sx={{ fontSize: "1.5rem" }} />
                )}
              </IconButton>
              <Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>{likeCount}</Typography>
            </FlexBetween>

            <FlexBetween gap="0.3rem">
              <IconButton 
                onClick={() => setIsComments(!isComments)}
                sx={{ 
                  padding: "0.75rem",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" }
                }}
              >
                <ChatBubbleOutlineOutlined sx={{ fontSize: "1.5rem" }} />
              </IconButton>
              <Typography sx={{ fontSize: "1rem", fontWeight: 500 }}>{comments.length}</Typography>
            </FlexBetween>
          </FlexBetween>

          <Box>
            <IconButton 
              onClick={() => setIsShareDialogOpen(true)}
              sx={{ 
                padding: "0.75rem",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" }
              }}
            >
              <ShareOutlined sx={{ fontSize: "1.5rem" }} />
            </IconButton>
            
            {/* Edit/Delete buttons - only show for post owner */}
            {loggedInUserId === postUserId && !isEditingPost && (
              <>
                <IconButton 
                  onClick={startEditingPost}
                  sx={{ 
                    ml: 1, 
                    padding: "0.75rem",
                    "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" }
                  }}
                  title="Edit post"
                >
                  <Edit sx={{ fontSize: "1.5rem" }} />
                </IconButton>
                <IconButton 
                  onClick={deletePost}
                  sx={{ 
                    ml: 1, 
                    padding: "0.75rem",
                    color: palette.error.main,
                    "&:hover": { 
                      backgroundColor: "rgba(0,0,0,0.04)",
                      color: palette.error.dark
                    }
                  }}
                  title="Delete post"
                >
                  <Delete sx={{ fontSize: "1.5rem" }} />
                </IconButton>
              </>
            )}
            
            {loggedInUserIsAdmin && (
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
            )}
          </Box>
        </FlexBetween>
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

      {/* Share Dialog */}
      <ShareDialog
        open={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        postId={postId}
        postDescription={description}
      />
    </Box>
  );
};

export default PostWidget;
