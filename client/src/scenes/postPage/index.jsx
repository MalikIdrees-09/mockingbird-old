import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import PostWidget from "scenes/widgets/PostWidget";
import { API_BASE_URL } from "../../utils/api";

const PostPage = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.token);
  
  // Listen for post updates in Redux store
  const updatedPost = useSelector((state) => {
    const posts = state.posts || [];
    return posts.find(p => p._id === postId);
  });

  useEffect(() => {
    const getPost = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError("Post not found");
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };

    if (postId && token) {
      getPost();
    }
  }, [postId, token]);

  // Update local post state when Redux store post is updated
  useEffect(() => {
    if (updatedPost && post) {
      setPost(updatedPost);
    }
  }, [updatedPost, post]);

  if (loading) {
    return (
      <Box>
        <Navbar />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error || !post) {
    return (
      <Box>
        <Navbar />
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
          textAlign="center"
        >
          <Typography variant="h4" color="error" gutterBottom>
            Post Not Found
          </Typography>
          <Typography variant="body1" color="textSecondary">
            The post you're looking for doesn't exist or has been removed.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap="2rem"
      >
        <Typography variant="h4" fontWeight="bold">
          Post Details
        </Typography>
        <Box width="100%" maxWidth="600px">
          <PostWidget
            key={post._id}
            postId={post._id}
            postUserId={post.userId}
            name={`${post.firstName} ${post.lastName}`}
            description={post.description}
            location={post.location}
            bio={post.userId?.bio}
            picturePath={post.picturePath}
            userPicturePath={post.userPicturePath}
            likes={post.likes || {}}
            comments={post.comments || []}
            mediaPath={post.mediaPath}
            mediaType={post.mediaType}
            mediaSize={post.mediaSize}
            showAddFriend={true}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PostPage;
