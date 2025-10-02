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
  Tooltip,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import ProfanityWarningDialog from "components/ProfanityWarningDialog";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "state";
import { API_BASE_URL } from "../../utils/api";

const MyPostWidget = ({ picturePath }) => {
  const dispatch = useDispatch();
  const [mediaFiles, setMediaFiles] = useState([]); // Array of media files
  const [post, setPost] = useState("");
  const [anchorEl, setAnchorEl] = useState(null); // For mobile menu
  const [profanityWarning, setProfanityWarning] = useState({ open: false, message: "", details: "" });
  const [mediaType, setMediaType] = useState('image'); // Track the current media type
  const { palette } = useTheme();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;
  const toast = useToast();

  // Function to create and track blob URLs
  const createBlobUrl = (file) => {
    const url = URL.createObjectURL(file);
    blobUrlsRef.current.push(url);
    return url;
  };

  // Track blob URLs for cleanup
  const blobUrlsRef = useRef([]);

  // Cleanup blob URLs on unmount or mediaFile change
  useEffect(() => {
    return () => {
      // Clean up all blob URLs when component unmounts
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current = [];
    };
  }, []);

  // Clean up blob URLs when mediaFiles changes
  useEffect(() => {
    // Clean up previous blob URLs
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrlsRef.current = [];
  }, [mediaFiles]);

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
      
      // Add multiple media files
      mediaFiles.forEach((file, index) => {
        formData.append("media", file);
      });

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      
      if (response.ok) {
        const posts = await response.json();
        dispatch(setPosts({ posts }));
        
        // Reset form completely
        setMediaFiles([]);
        setPost("");
        setAnchorEl(null); // Close mobile menu if open
        setProfanityWarning({ open: false, message: "", details: "" }); // Reset profanity warning
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
        toast.showError("Failed to create post. Please try again.");
        }
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.showError("Network error. Please try again.");
    }
  };

  const handleFileUpload = (acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      // Add new files to existing media files (up to 10 total)
      const newFiles = [...mediaFiles, ...acceptedFiles].slice(0, 10);
      setMediaFiles(newFiles);
    }
  };

  const removeMediaFile = (index) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
  };

  const clearAllMedia = () => {
    setMediaFiles([]);
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

  const handleMediaSelect = (type) => {
    setMediaType(type);
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = type === 'image'; // Only allow multiple for images
    input.accept = Object.keys(mediaConfigs[type].accept).join(',');

    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        // Combine with existing files, but limit to 10 total
        const updatedFiles = [...mediaFiles, ...newFiles].slice(0, 10);
        setMediaFiles(updatedFiles);
      }
    };
    input.click();
  };

  const handleMobileMediaSelect = (type) => {
    setMediaType(type);
    handleMobileMenuClose();
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = type === 'image'; // Only allow multiple for images
    input.accept = Object.keys(mediaConfigs[type].accept).join(',');

    input.onchange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        // Combine with existing files, but limit to 10 total
        const updatedFiles = [...mediaFiles, ...newFiles].slice(0, 10);
        setMediaFiles(updatedFiles);
      }
    };
    input.click();
  };

  return (
    <WidgetWrapper>
      <FlexBetween gap="1.5rem">
        <UserImage image={picturePath} />
        <Box sx={{ width: "100%" }}>
          <RichTextEditor
            value={post}
            onChange={setPost}
            placeholder="What's on your mind..."
            maxLength={2000}
            sx={{
              '& .MuiBox-root': {
                borderRadius: '2rem',
                overflow: 'hidden'
              }
            }}
          />
          {post && (
            <Box sx={{ mt: 1, p: 2, backgroundColor: palette.background.alt, borderRadius: "8px" }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Preview:</Typography>
              <div
                style={{ fontSize: "0.9rem" }}
                dangerouslySetInnerHTML={{
                  __html: post.replace(/\n/g, '<br>')
                }}
              />
            </Box>
          )}
        </Box>
      </FlexBetween>
      
      {/* Media Upload Section */}
      {mediaFiles.length > 0 && (
        <Box
          border={`1px solid ${medium}`}
          borderRadius="12px"
          mt="1rem"
          p="1rem"
          sx={{ backgroundColor: palette.background.alt }}
        >
          <FlexBetween mb="0.5rem">
            <Chip
              icon={<ImageOutlined />}
              label={`${mediaFiles.length} Image${mediaFiles.length > 1 ? 's' : ''} Selected`}
              color="primary"
              size="small"
              sx={{ backgroundColor: palette.primary.main, color: "white" }}
            />
            <IconButton onClick={clearAllMedia} size="small">
              <Close />
            </IconButton>
          </FlexBetween>
          
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {mediaFiles.map((file, index) => (
              <Box
                key={index}
                sx={{
                  position: "relative",
                  border: `1px solid ${palette.neutral.light}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  width: "120px",
                  height: "90px"
                }}
              >
                <Box
                  component="img"
                  src={createBlobUrl(file)}
                  alt={`Preview ${index + 1}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeMediaFile(index)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(0,0,0,0.8)"
                    },
                    width: 24,
                    height: 24
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "white",
                    padding: "2px 4px",
                    borderRadius: "4px",
                    fontSize: "0.6rem"
                  }}
                >
                  {getFileSize(file.size)}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Add more images button */}
          {mediaFiles.length < 10 && (
            <Box mt={2}>
              <Dropzone
                accept={{
                  'image/jpeg': ['.jpg', '.jpeg'],
                  'image/png': ['.png'],
                  'image/gif': ['.gif'],
                  'image/webp': ['.webp']
                }}
                multiple={true}
                onDrop={handleFileUpload}
                maxSize={10 * 1024 * 1024} // 10MB per file
              >
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <Box
                    {...getRootProps()}
                    border={`2px dashed ${palette.primary.main}`}
                    borderRadius="8px"
                    p="1rem"
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
                    <ImageOutlined sx={{ color: palette.primary.main, mb: 1 }} />
                    <Typography variant="body2">
                      {isDragActive ? "Drop images here" : "Add more images"}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Max 10 images, 10MB each
                    </Typography>
                  </Box>
                )}
              </Dropzone>
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ margin: "1.25rem 0" }} />

      <FlexBetween>
        {/* Image Button */}
        <FlexBetween 
          gap="0.25rem" 
          onClick={() => {
            // Trigger file input for image selection
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';
            input.onchange = (e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(Array.from(e.target.files));
              }
            };
            input.click();
          }}
          sx={{ 
            cursor: "pointer",
            padding: "0.5rem",
            borderRadius: "8px",
            backgroundColor: mediaFiles.length > 0 ? palette.primary.light + "20" : "transparent",
            "&:hover": { backgroundColor: palette.primary.light + "10" }
          }}
        >
          <ImageOutlined sx={{ 
            color: mediaFiles.length > 0 ? palette.primary.main : mediumMain 
          }} />
          <Typography
            color={mediaFiles.length > 0 ? palette.primary.main : mediumMain}
            sx={{ fontWeight: mediaFiles.length > 0 ? 600 : 400 }}
          >
            Image {mediaFiles.length > 0 && `(${mediaFiles.length})`}
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
          disabled={!post && mediaFiles.length === 0}
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
