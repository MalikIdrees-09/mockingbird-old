import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Alert,
  Snackbar,
  Grid,
  Avatar,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import {
  Delete,
  Warning,
  ExpandMore,
  ExpandLess,
  DeleteOutline,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import WidgetWrapper from "components/WidgetWrapper";

const PostManagement = ({ userId }) => {
  const { palette } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, post: null, action: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const token = useSelector((state) => state.token);

  const getPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://mockingbird-server-453975176199.asia-south1.run.app//admin/posts?page=${page}&includeDeleted=${includeDeleted}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setSnackbar({
        open: true,
        message: "Error fetching posts",
        severity: "error",
      });
    }
    setLoading(false);
  }, [page, includeDeleted, token]);

  useEffect(() => {
    getPosts();
  }, [getPosts]);

  const handleDeletePost = async (post) => {
    try {
      const response = await fetch(`https://mockingbird-server-453975176199.asia-south1.run.app//admin/posts/${post._id}/delete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({
          open: true,
          message: data.message,
          severity: "success",
        });
        getPosts(); // Refresh the list
      } else {
        throw new Error("Failed to delete/restore post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      setSnackbar({
        open: true,
        message: "Error updating post status",
        severity: "error",
      });
    }
    setConfirmDialog({ open: false, post: null, action: "" });
  };

  const handleDeleteComment = async (postId, commentIndex) => {
    try {
      const response = await fetch(`https://mockingbird-server-453975176199.asia-south1.run.app//admin/posts/${postId}/moderate-comment`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          adminId: userId, 
          commentIndex, 
          action: "delete" 
        }),
      });

      if (response.ok) {
        await response.json();
        setSnackbar({
          open: true,
          message: "Comment deleted successfully",
          severity: "success",
        });
        getPosts(); // Refresh the list
      } else {
        throw new Error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setSnackbar({
        open: true,
        message: "Error deleting comment",
        severity: "error",
      });
    }
  };

  const openConfirmDialog = (post, action) => {
    setConfirmDialog({ open: true, post, action });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, post: null, action: "" });
  };

  const executeAction = () => {
    if (confirmDialog.action === "delete") {
      handleDeletePost(confirmDialog.post);
    }
  };

  const togglePostExpansion = (postId) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  return (
    <WidgetWrapper>
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3,
          fontFamily: "Playfair Display, serif",
          fontWeight: 600,
          color: "secondary.main"
        }}
      >
        Post Management
      </Typography>

      {/* Controls */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant={includeDeleted ? "contained" : "outlined"}
          onClick={() => {
            setIncludeDeleted(!includeDeleted);
            setPage(1);
          }}
          color="secondary"
        >
          {includeDeleted ? "Hide Deleted" : "Show Deleted"}
        </Button>
      </Box>

      {/* Posts Grid */}
      {loading ? (
        <Typography>Loading posts...</Typography>
      ) : posts.length === 0 ? (
        <Typography>No posts found</Typography>
      ) : (
        <Grid container spacing={2}>
          {posts.map((post) => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={post._id}>
              <Card
                sx={{
                  borderRadius: "12px",
                  boxShadow: post.isDeleted ? "0 2px 8px rgba(220, 20, 60, 0.2)" : "0 2px 8px rgba(0,0,0,0.1)",
                  border: post.isDeleted ? `1px solid ${palette.secondary.light}` : "none",
                  maxWidth: "100%",
                  height: "fit-content",
                }}
              >
                {post.picturePath && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={`https://mockingbird-server-453975176199.asia-south1.run.app//assets/${post.picturePath}`}
                    alt="Post image"
                    sx={{ objectFit: "cover" }}
                  />
                )}
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  {/* Post Header */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar
                      src={post.userPicturePath ? `https://mockingbird-server-453975176199.asia-south1.run.app//assets/${post.userPicturePath}` : undefined}
                      sx={{ mr: 2 }}
                    >
                      {post.firstName[0]}{post.lastName[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="600">
                        {post.firstName} {post.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {post.isDeleted && (
                      <Chip
                        label="Deleted"
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Post Content */}
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {post.description}
                  </Typography>

                  {/* Post Stats */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
                    <Typography variant="caption" color="textSecondary">
                      {Object.keys(post.likes || {}).length} likes
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {post.comments?.length || 0} comments
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => openConfirmDialog(post, "delete")}
                      disabled={post.isDeleted} // Disable if already deleted
                    >
                      {post.isDeleted ? "Deleted" : "Delete Permanently"}
                    </Button>
                    {post.comments && post.comments.length > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={expandedPost === post._id ? <ExpandLess /> : <ExpandMore />}
                        onClick={() => togglePostExpansion(post._id)}
                      >
                        Comments
                      </Button>
                    )}
                  </Box>

                  {/* Comments Section */}
                  <Collapse in={expandedPost === post._id}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${palette.neutral.light}` }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Comments ({post.comments?.length || 0})
                      </Typography>
                      <List dense>
                        {post.comments?.map((comment, index) => {
                          // Handle both old string format and new object format
                          const isOldFormat = typeof comment === 'string';
                          const commentText = isOldFormat ? comment : comment.text;
                          const commentAuthor = isOldFormat ? 'Unknown User' : comment.userName;
                          
                          return (
                            <ListItem
                              key={isOldFormat ? `comment-${index}` : comment.id}
                              sx={{
                                px: 0,
                                py: 0.5,
                                alignItems: "flex-start",
                              }}
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handleDeleteComment(post._id, index)}
                                  color="error"
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemAvatar sx={{ minWidth: 32 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                                  {commentAuthor ? commentAuthor[0] : "?"}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="caption" fontWeight="500">
                                    {commentAuthor || "Anonymous"}
                                  </Typography>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="caption" color="textSecondary">
                                      {commentText}
                                    </Typography>
                                    {!isOldFormat && comment.mediaPath && (
                                      <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="caption" color="primary" sx={{ fontSize: "0.7rem" }}>
                                          📎 Media attached ({comment.mediaType || 'file'})
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Warning sx={{ mr: 1, color: palette.accent.main }} />
            Confirm Action
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this post?
            <strong> This action cannot be undone.</strong>
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error">
              This will permanently delete the post and all associated media files.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>Cancel</Button>
          <Button
            onClick={executeAction}
            color="error"
            variant="contained"
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </WidgetWrapper>
  );
};

export default PostManagement;
