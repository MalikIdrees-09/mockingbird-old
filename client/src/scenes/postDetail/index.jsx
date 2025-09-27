import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Paper,
  useMediaQuery,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import Navbar from "scenes/navbar";
import Footer from "components/Footer";
import PostWidget from "scenes/widgets/PostWidget";
import { API_BASE_URL } from "utils/api";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.token);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        setError(null);

        // Use public endpoint if no token (unauthenticated user), otherwise use authenticated endpoint
        const endpoint = token 
          ? `${API_BASE_URL}/posts/${postId}`
          : `${API_BASE_URL}/posts/${postId}/public`;

        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch(endpoint, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Post not found");
          } else if (response.status === 403) {
            throw new Error("You don't have permission to view this post");
          } else {
            throw new Error("Failed to load post");
          }
        }

        const postData = await response.json();
        setPost(postData);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, token]);

  const handleBack = () => {
    // If user is authenticated, go to home, otherwise go to login
    if (token) {
      navigate("/home");
    } else {
      navigate("/");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      // Could add a toast notification here
      alert("Post link copied to clipboard!");
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            padding: isDesktop ? "2rem" : "2rem 6%",
          }}
        >
          <CircularProgress size={60} />
        </Box>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Box 
          sx={{ 
            padding: isDesktop ? "2rem" : "2rem 6%", 
            minHeight: "60vh",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: isDesktop ? "800px" : "100%" }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ mb: 2 }}
            >
              Back to Home
            </Button>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Typography variant="body1">
              The post you're looking for might have been deleted or you might not have permission to view it.
            </Typography>
          </Box>
        </Box>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box 
        sx={{ 
          padding: isDesktop ? "2rem" : "2rem 6%", 
          minHeight: "80vh",
          display: "flex",
          justifyContent: "center",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: isDesktop ? "600px" : "100%" }}>
          {/* Header with back button and share */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexDirection: isDesktop ? "row" : "column",
              gap: isDesktop ? 0 : 2,
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              variant="outlined"
              sx={{ alignSelf: isDesktop ? "flex-start" : "stretch" }}
            >
              {token ? "Back to Home" : "Back to Login"}
            </Button>
            <Button 
              variant="contained" 
              onClick={handleShare}
              sx={{ alignSelf: isDesktop ? "flex-end" : "stretch" }}
            >
              Share Post
            </Button>
          </Box>

          {/* Post Content */}
          {post && (
            <Paper
              elevation={2}
              sx={{
                padding: isDesktop ? "2rem" : "1.5rem",
                borderRadius: "12px",
                backgroundColor: "background.paper",
                boxShadow: isDesktop ? theme.shadows[4] : theme.shadows[2],
              }}
            >
              <PostWidget
                postId={post._id}
                postUserId={post.userId}
                name={`${post.firstName} ${post.lastName}`}
                description={post.description}
                location={post.location}
                bio={post.userId?.bio}
                picturePath={post.userPicturePath}
                userPicturePath={post.userPicturePath}
                likes={post.likes || {}}
                comments={post.comments || []}
                mediaPath={post.mediaPath}
                mediaType={post.mediaType}
                mediaSize={post.mediaSize}
                createdAt={post.createdAt}
                isDetailView={true}
                isAdmin={post.userId?.isAdmin || false}
                showAddFriend={true}
              />
            </Paper>
          )}

          {/* Comments Section Info */}
          {post && post.comments && post.comments.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Comments ({post.comments.length})
              </Typography>
              <Divider />
            </Box>
          )}
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default PostDetail;
