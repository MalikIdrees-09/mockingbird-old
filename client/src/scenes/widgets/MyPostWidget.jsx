import {
  EditOutlined,
  GifBoxOutlined,
  ImageOutlined,
  MicOutlined,
  MoreHorizOutlined,
  Close,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  Typography,
  useTheme,
  Button,
  IconButton,
  useMediaQuery,
  Chip,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import ProfanityWarningDialog from "components/ProfanityWarningDialog";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import { TextareaAutosize } from '@mui/material';

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [mediaType, setMediaType] = useState(null); // 'image', 'video', 'audio', 'clip'
  const [mediaFile, setMediaFile] = useState(null);
  const [post, setPost] = useState("");
  const [anchorEl, setAnchorEl] = useState(null); // For mobile menu
  const [profanityWarning, setProfanityWarning] = useState({ open: false, message: "", details: "" });
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;

  // Media type configurations
  const mediaConfigs = {
    image: {
      accept: {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp']
      },
      label: "Add Image Here",
      icon: <ImageOutlined />,
      color: palette.primary.main
    },
    audio: {
      accept: {
        'audio/mpeg': ['.mp3'],
        'audio/wav': ['.wav'],
        'audio/ogg': ['.ogg'],
        'audio/aac': ['.aac'],
        'audio/flac': ['.flac']
      },
      label: "Add Audio Here",
      icon: <MicOutlined />,
      color: palette.accent?.main || palette.primary.dark
    },
    clip: {
      accept: {
        'image/gif': ['.gif'],
        'video/webm': ['.webm']
      },
      label: "Add Clip/GIF Here",
      icon: <GifBoxOutlined />,
      color: palette.warning?.main || palette.secondary.dark
    }
  };

  const handlePost = async () => {
    try {
      const formData = new FormData();
      formData.append("userId", _id);
      formData.append("description", post);
      
      if (mediaFile) {
        formData.append("media", mediaFile);
        formData.append("mediaPath", mediaFile.name);
        formData.append("mediaType", mediaType);
      }

      const response = await fetch(`https://mockingbird-backend-453975176199.us-central1.run.app/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (response.ok) {
        const posts = await response.json();
        dispatch(setPosts({ posts }));
        
        // Reset form
        setMediaFile(null);
        setMediaType(null);
        setPost("");
      } else {
        const errorData = await response.json();
        console.error("Failed to create post:", response.status, response.statusText);
        
        // Handle profanity error specifically
        if (errorData.error === "PROFANITY_DETECTED") {
          setProfanityWarning({
            open: true,
            message: errorData.message,
            details: errorData.details
          });
        } else {
          alert("Failed to create post. Please try again.");
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleMediaSelect = (type) => {
    if (mediaType === type) {
      // Toggle off if same type clicked
      setMediaType(null);
      setMediaFile(null);
    } else {
      setMediaType(type);
      setMediaFile(null);
    }
  };

  const handleFileUpload = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setMediaFile(acceptedFiles[0]);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaType(null);
  };

  const getFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleMobileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMediaSelect = (type) => {
    handleMediaSelect(type);
    handleMobileMenuClose();
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <Box sx={{ width: "100%" }}>
          <TextareaAutosize
            placeholder="What's on your mind..."
            onChange={(e) => setPost(e.target.value)}
            value={post}
            minRows={1}
            maxRows={10}
            onKeyDown={(e) => {
              // Allow new lines with Enter, prevent form submission
              if (e.key === 'Enter' && !e.shiftKey) {
                // Let it create a new line naturally
                return;
              }
            }}
            style={{
              width: "100%",
              backgroundColor: palette.neutral.light,
              borderRadius: "2rem",
              padding: "1rem 2rem",
              border: "none",
              outline: "none",
              fontSize: "1rem",
              fontFamily: "inherit",
              resize: "none",
              boxSizing: "border-box"
            }}
          />
          {post && (
            <Box sx={{ mt: 1, p: 2, backgroundColor: palette.background.alt, borderRadius: "8px" }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Preview:</Typography>
              <div style={{ fontSize: "0.9rem" }}>
                {post.split('\n').map((line, i) => (
                  <div key={i}>
                    {line.split(' ').map((word, j) => {
                      if (word.startsWith('**') && word.endsWith('**')) {
                        return <strong key={j}>{word.slice(2, -2)} </strong>;
                      } else if (word.startsWith('*') && word.endsWith('*')) {
                        return <em key={j}>{word.slice(1, -1)} </em>;
                      }
                      return <span key={j}>{word} </span>;
                    })}
                  </div>
                ))}
              </div>
            </Box>
          )}
        </Box>
      </FlexBetween>
      
      {/* Media Upload Section */}
      {mediaType && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius="12px"
          mt="1rem"
          p="1rem"
          sx={{ backgroundColor: palette.background.alt }}
        >
          <FlexBetween mb="0.5rem">
            <Chip
              icon={mediaConfigs[mediaType].icon}
              label={mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
              color="primary"
              size="small"
              sx={{ backgroundColor: mediaConfigs[mediaType].color, color: "white" }}
            />
            <IconButton onClick={clearMedia} size="small">
              <Close />
            </IconButton>
          </FlexBetween>
          
          <Dropzone
            accept={mediaConfigs[mediaType].accept}
            multiple={false}
            onDrop={handleFileUpload}
            maxSize={10 * 1024 * 1024} // 10MB for all media types
          >
            {({ getRootProps, getInputProps, isDragActive }) => (
              <Box
                {...getRootProps()}
                border={`2px dashed ${mediaConfigs[mediaType].color}`}
                borderRadius="8px"
                p="2rem"
                textAlign="center"
                sx={{
                  cursor: "pointer",
                  backgroundColor: isDragActive ? palette.primary.light + "20" : "transparent",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: palette.primary.light + "10",
                    borderColor: palette.primary.dark,
                  }
                }}
              >
                <input {...getInputProps()} />
                {!mediaFile ? (
                  <Box>
                    {mediaConfigs[mediaType].icon}
                    <Typography variant="body1" mt={1}>
                      {isDragActive ? `Drop your ${mediaType} here` : mediaConfigs[mediaType].label}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Max size: 10MB
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1} alignItems="center">
                    <FlexBetween width="100%">
                      <Box display="flex" alignItems="center" gap={1}>
                        {mediaConfigs[mediaType].icon}
                        <Typography variant="body2" fontWeight="500">
                          {mediaFile.name}
                        </Typography>
                      </Box>
                      <EditOutlined color="primary" />
                    </FlexBetween>
                    <Typography variant="caption" color="textSecondary">
                      {getFileSize(mediaFile.size)}
                    </Typography>
                    
                    {/* Preview for images */}
                    {mediaType === 'image' && (
                      <Box
                        component="img"
                        src={URL.createObjectURL(mediaFile)}
                        alt="Preview"
                        sx={{
                          maxWidth: "200px",
                          maxHeight: "150px",
                          borderRadius: "8px",
                          mt: 1
                        }}
                      />
                    )}
                    
                    {/* Preview for clips */}
                    {mediaType === 'clip' && (
                      <Box
                        component="video"
                        src={URL.createObjectURL(mediaFile)}
                        controls
                        sx={{
                          maxWidth: "200px",
                          maxHeight: "150px",
                          borderRadius: "8px",
                          mt: 1
                        }}
                      />
                    )}
                  </Stack>
                )}
              </Box>
            )}
          </Dropzone>
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        {/* Image Button */}
        <FlexBetween 
          gap="0.25rem" 
          onClick={() => handleMediaSelect('image')}
          sx={{ 
            cursor: "pointer",
            padding: "0.5rem",
            borderRadius: "8px",
            backgroundColor: mediaType === 'image' ? palette.primary.light + "20" : "transparent",
            "&:hover": { backgroundColor: palette.primary.light + "10" }
          }}
        >
          <ImageOutlined sx={{ 
            color: mediaType === 'image' ? palette.primary.main : mediumMain 
          }} />
          <Typography
            color={mediaType === 'image' ? palette.primary.main : mediumMain}
            sx={{ fontWeight: mediaType === 'image' ? 600 : 400 }}
          >
            Image
          </Typography>
        </FlexBetween>

        {isNonMobileScreens ? (
          <>
            {/* Clip Button */}
            <FlexBetween 
              gap="0.25rem"
              onClick={() => handleMediaSelect('clip')}
              sx={{ 
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "8px",
                backgroundColor: mediaType === 'clip' ? palette.warning?.light + "20" : "transparent",
                "&:hover": { backgroundColor: palette.warning?.light + "10" }
              }}
            >
              <GifBoxOutlined sx={{ 
                color: mediaType === 'clip' ? (palette.warning?.main || palette.secondary.dark) : mediumMain 
              }} />
              <Typography 
                color={mediaType === 'clip' ? (palette.warning?.main || palette.secondary.dark) : mediumMain}
                sx={{ fontWeight: mediaType === 'clip' ? 600 : 400 }}
              >
                Clip
              </Typography>
            </FlexBetween>

            {/* Audio Button */}
            <FlexBetween 
              gap="0.25rem"
              onClick={() => handleMediaSelect('audio')}
              sx={{ 
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "8px",
                backgroundColor: mediaType === 'audio' ? palette.accent?.light + "20" : "transparent",
                "&:hover": { backgroundColor: palette.accent?.light + "10" }
              }}
            >
              <MicOutlined sx={{ 
                color: mediaType === 'audio' ? (palette.accent?.main || palette.primary.dark) : mediumMain 
              }} />
              <Typography 
                color={mediaType === 'audio' ? (palette.accent?.main || palette.primary.dark) : mediumMain}
                sx={{ fontWeight: mediaType === 'audio' ? 600 : 400 }}
              >
                Audio
              </Typography>
            </FlexBetween>
          </>
        ) : (
          <FlexBetween gap="0.25rem">
            <IconButton onClick={handleMobileMenuOpen}>
              <MoreHorizOutlined sx={{ color: mediumMain }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMobileMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: "12px",
                  mt: 1,
                  minWidth: 200,
                }
              }}
            >
              <MenuItem onClick={() => handleMobileMediaSelect('image')}>
                <ListItemIcon>
                  <ImageOutlined sx={{ color: palette.primary.main }} />
                </ListItemIcon>
                <ListItemText primary="Image" />
              </MenuItem>
              <MenuItem onClick={() => handleMobileMediaSelect('clip')}>
                <ListItemIcon>
                  <GifBoxOutlined sx={{ color: palette.warning?.main || palette.secondary.dark }} />
                </ListItemIcon>
                <ListItemText primary="Clip/GIF" />
              </MenuItem>
              <MenuItem onClick={() => handleMobileMediaSelect('audio')}>
                <ListItemIcon>
                  <MicOutlined sx={{ color: palette.accent?.main || palette.primary.dark }} />
                </ListItemIcon>
                <ListItemText primary="Audio" />
              </MenuItem>
            </Menu>
          </FlexBetween>
        )}

        <Button
          disabled={!post && !mediaFile}
          onClick={handlePost}
          sx={{
            m: "2rem 0",
            p: "1rem",
            backgroundColor: palette.primary.main,
            color: "white",
            "&:hover": {
              backgroundColor: palette.primary.dark,
              color: "white"
            },
            "&:disabled": {
              backgroundColor: palette.neutral.light,
              color: palette.neutral.medium,
            }
          }}
        >
          POST
        </Button>
      </FlexBetween>
      
      {/* Profanity Warning Dialog */}
      <ProfanityWarningDialog
        open={profanityWarning.open}
        onClose={() => setProfanityWarning({ open: false, message: "", details: "" })}
        message={profanityWarning.message}
        details={profanityWarning.details}
      />
    </WidgetWrapper>
  );
};

export default MyPostWidget;
