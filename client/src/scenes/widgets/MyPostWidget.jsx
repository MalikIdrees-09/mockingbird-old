import {
  EditOutlined,
  GifBoxOutlined,
  ImageOutlined,
  MicOutlined,
  MovieCreationOutlined,
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
  TextField,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import UserImage from "components/UserImage";
import WidgetWrapper from "components/WidgetWrapper";
import ProfanityWarningDialog from "components/ProfanityWarningDialog";
import LinkPreview from "components/LinkPreview";
import React, { useState, useEffect, useRef } from "react";
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
  const [linkPreviews, setLinkPreviews] = useState([]); // Store link preview data
  const theme = useTheme();
  const { palette } = theme;
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const mediumMain = palette.neutral.mediumMain;
  const medium = palette.neutral.medium;
  const [isUploading, setIsUploading] = useState(false);

  // Extract URLs from text
  const extractUrls = (text) => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Fetch link preview for a URL with retry logic
  const fetchLinkPreview = async (url, retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}/posts/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const metadata = await response.json();
        return metadata;
      } else if (response.status === 429 && retryCount < 2) {
        // Rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return fetchLinkPreview(url, retryCount + 1);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏱️ Preview fetch timeout for: ${url}`);
      } else {
        console.error('Failed to fetch link preview:', error);
      }
    }
    return null;
  };

  // Update link previews when post text changes
  useEffect(() => {
    const updateLinkPreviews = async () => {
      const urls = extractUrls(post);
      if (urls.length === 0) {
        setLinkPreviews([]);
        return;
      }

      // Fetch preview for first URL only (to avoid spam)
      const firstUrl = urls[0];
      if (firstUrl && !linkPreviews.find(preview => preview.url === firstUrl)) {
        const preview = await fetchLinkPreview(firstUrl);
        if (preview) {
          setLinkPreviews([preview]);
        }
      }
    };

    // Debounce the preview updates
    const timeoutId = setTimeout(updateLinkPreviews, 1000);
    return () => clearTimeout(timeoutId);
  }, [post, linkPreviews]);

  // Remove a link preview
  const removeLinkPreview = (urlToRemove) => {
    setLinkPreviews(linkPreviews.filter(preview => preview.url !== urlToRemove));
  };

  // Track blob URLs for cleanup
  const blobUrlsRef = useRef([]);

  // State to track blob URLs for each file
  const [fileBlobUrls, setFileBlobUrls] = useState(new Map());

  // Function to get or create blob URL for a file
  const getBlobUrl = (file) => {
    if (fileBlobUrls.has(file)) {
      return fileBlobUrls.get(file);
    }

    const url = URL.createObjectURL(file);
    blobUrlsRef.current.push(url);

    // Update the map with the new blob URL
    setFileBlobUrls(prev => new Map(prev.set(file, url)));
    return url;
  };

  // Clean up blob URLs only when specific files are removed
  const cleanupBlobUrls = (filesToRemove = []) => {
    if (filesToRemove.length === 0) return;

    // For each file being removed, revoke its blob URL and remove from map
    filesToRemove.forEach(file => {
      if (fileBlobUrls.has(file)) {
        const url = fileBlobUrls.get(file);
        URL.revokeObjectURL(url);
        // Remove from tracking arrays
        const index = blobUrlsRef.current.indexOf(url);
        if (index > -1) {
          blobUrlsRef.current.splice(index, 1);
        }
      }
    });

    // Update the file blob URLs map to remove the deleted files
    setFileBlobUrls(prev => {
      const newMap = new Map(prev);
      filesToRemove.forEach(file => newMap.delete(file));
      return newMap;
    });
  };

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
      color: palette.primary.main,
      maxSize: 10 * 1024 * 1024,
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
      color: palette.accent?.main || palette.primary.dark,
      maxSize: 50 * 1024 * 1024,
    },
    video: {
      accept: {
        'video/mp4': ['.mp4'],
        'video/webm': ['.webm'],
        'video/quicktime': ['.mov'],
        'video/x-matroska': ['.mkv'],
        'video/ogg': ['.ogv']
      },
      label: "Add Video Here",
      icon: <MovieCreationOutlined />,
      color: palette.secondary?.main || palette.primary.main,
      maxSize: 200 * 1024 * 1024,
    },
    clip: {
      accept: {
        'image/gif': ['.gif'],
        'video/webm': ['.webm']
      },
      label: "Add Clip/GIF Here",
      icon: <GifBoxOutlined />,
      color: palette.warning?.main || palette.secondary.dark,
      maxSize: 25 * 1024 * 1024,
    }
  };

  const getMaxFileSizeLabel = (type) => {
    const maxSize = mediaConfigs[type]?.maxSize;
    if (!maxSize) return '';
    if (maxSize >= 1024 * 1024) {
      return `${Math.round(maxSize / (1024 * 1024))}MB`;
    }
    if (maxSize >= 1024) {
      return `${Math.round(maxSize / 1024)}KB`;
    }
    return `${maxSize}B`;
  };

  const handlePost = async () => {
    if (isUploading) return;
    try {
      const formData = new FormData();
      formData.append("userId", _id);
      formData.append("description", post);

      // Determine media type from first file if files exist
      if (mediaFiles.length > 0) {
        const firstFile = mediaFiles[0];
        if (firstFile.type.startsWith('audio/')) {
          formData.append("mediaType", "audio");
        } else if (firstFile.type.startsWith('video/')) {
          formData.append("mediaType", "video");
        } else {
          formData.append("mediaType", "image");
        }
      }

      // Add multiple media files
      mediaFiles.forEach((file, index) => {
        formData.append("media", file);
      });

      setIsUploading(true);
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
        
        // Clean up blob URLs after successful post
        fileBlobUrls.forEach((url) => {
          URL.revokeObjectURL(url);
        });
        setFileBlobUrls(new Map());
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
    } finally {
      setIsUploading(false);
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
    const fileToRemove = mediaFiles[index];
    const newFiles = mediaFiles.filter((_, i) => i !== index);

    // Clean up blob URLs for removed files
    cleanupBlobUrls([fileToRemove]);

    setMediaFiles(newFiles);
  };

  const clearAllMedia = () => {
    // Clean up all blob URLs before clearing files
    fileBlobUrls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrlsRef.current = [];
    setFileBlobUrls(new Map());
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
    <WidgetWrapper 
      sx={{
        borderRadius: '20px',
        overflow: 'visible',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 30px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)'
            : '0 8px 30px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        }
      }}
    >
      <FlexBetween gap="1.5rem" alignItems="flex-start">
        <UserImage image={picturePath} />
        <Box sx={{ width: "100%" }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            maxRows={10}
            placeholder="What's on your mind..."
            value={post}
            onChange={(e) => setPost(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: theme.palette.background.paper,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.1)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: palette.primary.main,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: palette.primary.main,
                  borderWidth: '1px',
                },
              },
              '& .MuiOutlinedInput-input': {
                fontSize: '1rem',
                fontFamily: 'inherit',
                padding: '12px 16px',
                '&::placeholder': {
                  color: palette.neutral.medium,
                  opacity: 0.8,
                },
              },
            }}
          />
        </Box>
      </FlexBetween>

      {/* Link Previews */}
      {linkPreviews.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {linkPreviews.map((preview, index) => (
            <LinkPreview
              key={index}
              preview={preview}
              onRemove={() => removeLinkPreview(preview.url)}
              showRemoveButton={true}
            />
          ))}
        </Box>
      )}

      {/* Enhanced Media Upload Section */}
      {mediaFiles.length > 0 && (
        <Box
          border={`1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`}
          borderRadius="16px"
          mt="1.5rem"
          p="1.5rem"
          sx={{
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.03)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <FlexBetween mb="1rem">
            <Chip
              icon={<ImageOutlined />}
              label={`${mediaFiles.length} Media File${mediaFiles.length > 1 ? 's' : ''} Selected`}
              size="small"
              sx={{
                backgroundColor: palette.primary.main + '20',
                color: palette.primary.main,
                fontWeight: 600,
                '& .MuiChip-icon': { color: palette.primary.main }
              }}
            />
            <IconButton
              onClick={clearAllMedia}
              size="small"
              sx={{
                backgroundColor: 'rgba(233, 67, 53, 0.1)',
                color: '#e94335',
                '&:hover': {
                  backgroundColor: 'rgba(233, 67, 53, 0.2)',
                  transform: 'scale(1.1)'
                }
              }}
            >
              <Close />
            </IconButton>
          </FlexBetween>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {mediaFiles.map((file, index) => {
              const isAudio = file.type.startsWith('audio/');
              const isVideo = file.type.startsWith('video/');
              const isImage = file.type.startsWith('image/');

              return (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    border: `1px solid ${palette.neutral.light}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                    width: "120px",
                    height: "90px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isAudio
                      ? palette.accent?.light + "20" || palette.primary.light + "20"
                      : isVideo
                      ? (palette.secondary?.light || palette.primary.light) + "20"
                      : "transparent"
                  }}
                >
                  {isImage && (
                    <Box
                      component="img"
                      src={getBlobUrl(file)}
                      alt={`Preview ${index + 1}`}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />
                  )}
                  {isVideo && (
                    <Box
                      component="video"
                      src={getBlobUrl(file)}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />
                  )}
                  {isAudio && (
                    <Box sx={{ textAlign: "center", p: 1 }}>
                      <MicOutlined sx={{ fontSize: 40, color: palette.accent?.main || palette.primary.dark }} />
                      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontSize: "0.7rem" }}>
                        {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                      </Typography>
                    </Box>
                  )}

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
              );
            })}
          </Box>

          {/* Add more media button */}
          {mediaFiles.length < 10 && (
            <Box mt={2}>
              <Dropzone
                accept={mediaConfigs[mediaType].accept}
                multiple={mediaType !== 'video'}
                onDrop={handleFileUpload}
                maxSize={mediaConfigs[mediaType].maxSize}
              >
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <Box
                    {...getRootProps()}
                    border={`2px dashed ${mediaConfigs[mediaType].color}`}
                    borderRadius="8px"
                    p="1rem"
                    textAlign="center"
                    sx={{
                      cursor: "pointer",
                      backgroundColor: isDragActive ? mediaConfigs[mediaType].color + "20" : "transparent",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: mediaConfigs[mediaType].color + "10",
                        borderColor: mediaConfigs[mediaType].color,
                      }
                    }}
                  >
                    <input {...getInputProps()} />
                    {React.cloneElement(mediaConfigs[mediaType].icon, {
                      sx: { color: mediaConfigs[mediaType].color, mb: 1, fontSize: 32 }
                    })}
                    <Typography variant="body2">
                      {isDragActive ? `Drop ${mediaType} here` : `Add more ${mediaType}`}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Max 10 files, {getMaxFileSizeLabel(mediaType)} each
                    </Typography>
                  </Box>
                )}
              </Dropzone>
            </Box>
          )}
        </Box>
      )}

      <Divider sx={{ margin: "1.5rem 0", borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />

      <FlexBetween>
        {/* Enhanced Image Button */}
        <FlexBetween 
          gap="0.5rem" 
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
            padding: "0.75rem 1rem",
            borderRadius: "12px",
            backgroundColor: mediaFiles.length > 0 ? palette.primary.main + '15' : 'transparent',
            border: `1px solid ${mediaFiles.length > 0 ? palette.primary.main + '30' : 'transparent'}`,
            transition: 'all 0.3s ease',
            '&:hover': { 
              backgroundColor: palette.primary.main + '10',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(218,165,32,0.2)'
            }
          }}
        >
          <ImageOutlined sx={{ 
            color: mediaFiles.length > 0 ? palette.primary.main : mediumMain,
            fontSize: '1.25rem'
          }} />
          <Typography
            color={mediaFiles.length > 0 ? palette.primary.main : mediumMain}
            sx={{ 
              fontWeight: mediaFiles.length > 0 ? 600 : 400,
              fontSize: '0.9rem'
            }}
          >
            Image {mediaFiles.length > 0 && `(${mediaFiles.length})`}
          </Typography>
        </FlexBetween>

        {isNonMobileScreens ? (
          <>
            {/* Enhanced Clip Button */}
            <FlexBetween 
              gap="0.5rem"
              onClick={() => handleMediaSelect('clip')}
              sx={{ 
                cursor: "pointer",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                backgroundColor: mediaType === 'clip' ? (palette.warning?.main + '15' || palette.secondary.main + '15') : 'transparent',
                border: `1px solid ${mediaType === 'clip' ? (palette.warning?.main + '30' || palette.secondary.main + '30') : 'transparent'}`,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: (palette.warning?.main + '10' || palette.secondary.main + '10'),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(247, 185, 36, 0.2)'
                }
              }}
            >
              <GifBoxOutlined sx={{ 
                color: mediaType === 'clip' ? (palette.warning?.main || palette.secondary.dark) : mediumMain,
                fontSize: '1.25rem'
              }} />
              <Typography 
                color={mediaType === 'clip' ? (palette.warning?.main || palette.secondary.dark) : mediumMain}
                sx={{ fontWeight: mediaType === 'clip' ? 600 : 400, fontSize: '0.9rem' }}
              >
                Clip
              </Typography>
            </FlexBetween>

            {/* Enhanced Video Button */}
            <FlexBetween 
              gap="0.5rem"
              onClick={() => handleMediaSelect('video')}
              sx={{ 
                cursor: "pointer",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                backgroundColor: mediaType === 'video' ? (palette.secondary?.main + '15' || palette.primary.main + '15') : 'transparent',
                border: `1px solid ${mediaType === 'video' ? (palette.secondary?.main + '30' || palette.primary.main + '30') : 'transparent'}`,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: (palette.secondary?.main + '10' || palette.primary.main + '10'),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(128, 0, 128, 0.2)'
                }
              }}
            >
              <MovieCreationOutlined sx={{ 
                color: mediaType === 'video' ? (palette.secondary?.main || palette.primary.main) : mediumMain,
                fontSize: '1.25rem'
              }} />
              <Typography 
                color={mediaType === 'video' ? (palette.secondary?.main || palette.primary.main) : mediumMain}
                sx={{ fontWeight: mediaType === 'video' ? 600 : 400, fontSize: '0.9rem' }}
              >
                Video
              </Typography>
            </FlexBetween>

            {/* Enhanced Audio Button */}
            <FlexBetween 
              gap="0.5rem"
              onClick={() => handleMediaSelect('audio')}
              sx={{ 
                cursor: "pointer",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                backgroundColor: mediaType === 'audio' ? (palette.accent?.main + '15' || palette.primary.main + '15') : 'transparent',
                border: `1px solid ${mediaType === 'audio' ? (palette.accent?.main + '30' || palette.primary.main + '30') : 'transparent'}`,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: (palette.accent?.main + '10' || palette.primary.main + '10'),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(160, 82, 45, 0.2)'
                }
              }}
            >
              <MicOutlined sx={{ 
                color: mediaType === 'audio' ? (palette.accent?.main || palette.primary.dark) : mediumMain,
                fontSize: '1.25rem'
              }} />
              <Typography 
                color={mediaType === 'audio' ? (palette.accent?.main || palette.primary.dark) : mediumMain}
                sx={{ fontWeight: mediaType === 'audio' ? 600 : 400, fontSize: '0.9rem' }}
              >
                Audio
              </Typography>
            </FlexBetween>
          </>
        ) : (
          <FlexBetween gap="0.25rem">
            <IconButton 
              onClick={handleMobileMenuOpen}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <MoreHorizOutlined sx={{ color: mediumMain }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMobileMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: "16px",
                  mt: 1,
                  minWidth: 200,
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 30px rgba(0,0,0,0.5)'
                    : '0 8px 30px rgba(0,0,0,0.15)',
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
              <MenuItem onClick={() => handleMobileMediaSelect('video')}>
                <ListItemIcon>
                  <MovieCreationOutlined sx={{ color: palette.secondary?.main || palette.primary.main }} />
                </ListItemIcon>
                <ListItemText primary="Video" />
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

        {/* Enhanced Post Button */}
        <Button
          disabled={(!post && mediaFiles.length === 0) || isUploading}
          onClick={handlePost}
          sx={{
            borderRadius: "25px",
            padding: "0.75rem 2rem",
            backgroundColor: (!post && mediaFiles.length === 0)
              ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')
              : (post || mediaFiles.length > 0)
                ? 'linear-gradient(135deg, #FFD700, #FFA500)' // Yellow to orange gradient
                : `linear-gradient(135deg, ${palette.primary.main}, ${palette.secondary.main})`,
            color: (!post && mediaFiles.length === 0)
              ? palette.neutral.medium
              : (post || mediaFiles.length > 0)
                ? (theme.palette.mode === 'dark' ? 'white' : 'black')
                : "white",
            fontWeight: 600,
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: (!post && mediaFiles.length === 0)
                ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')
                : (post || mediaFiles.length > 0)
                  ? 'linear-gradient(135deg, #FFE55C, #FFB84D)' // Lighter yellow on hover
                  : `linear-gradient(135deg, ${palette.primary.dark}, ${palette.secondary.dark})`,
              transform: (!post && mediaFiles.length === 0) ? 'none' : 'translateY(-2px)',
              boxShadow: (!post && mediaFiles.length === 0)
                ? 'none'
                : (post || mediaFiles.length > 0)
                  ? '0 8px 25px rgba(255, 215, 0, 0.4)' // Yellow shadow
                  : '0 8px 25px rgba(218,165,32,0.4)',
              color: (!post && mediaFiles.length === 0)
                ? palette.neutral.medium
                : (post || mediaFiles.length > 0)
                  ? (theme.palette.mode === 'dark' ? 'white' : 'black')
                  : "white",
            },
            '&:disabled': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: palette.neutral.medium,
              cursor: 'not-allowed',
              transform: 'none',
              boxShadow: 'none'
            }
          }}
        >
          {isUploading ? "Posting..." : "POST"}
        </Button>
      </FlexBetween>

      {/* Profanity Warning Dialog */}
      <ProfanityWarningDialog
        open={profanityWarning.open}
        onClose={() => setProfanityWarning({ open: false, message: "", details: "" })}
        message={profanityWarning.message}
        details={profanityWarning.details}
      />
      <Backdrop
        open={isUploading}
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(2px)',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="inherit" />
          <Typography variant="body2">Uploading your post…</Typography>
        </Stack>
      </Backdrop>
    </WidgetWrapper>
  );
};

export default MyPostWidget;
