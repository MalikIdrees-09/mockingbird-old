import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useTheme,
  Avatar,
  CircularProgress,
  Slider,
  IconButton,
} from "@mui/material";
import { PhotoCamera, Delete, Close, ZoomIn, ZoomOut, Crop } from "@mui/icons-material";
import React, { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLogin } from "state";
import Dropzone from "react-dropzone";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

const ChangeProfilePictureDialog = ({ open, onClose, currentPicture, userId }) => {
  const { palette } = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  // State for cropped preview
  const [croppedPreview, setCroppedPreview] = useState(null);

  // State to force re-renders of profile pictures
  const [profilePictureKey, setProfilePictureKey] = useState(Date.now());

  // Listen for profile picture updates
  React.useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setProfilePictureKey(Date.now());
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  // Cropping states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const handleFileSelect = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);

      // Create preview for cropping
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cropping handlers
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Convert cropped image to blob
  const getCroppedImg = async (imageSrc, cropAreaPixels) => {
    const image = new Image();
    image.src = imageSrc;

    return new Promise((resolve) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = cropAreaPixels.width;
        canvas.height = cropAreaPixels.height;

        ctx.drawImage(
          image,
          cropAreaPixels.x,
          cropAreaPixels.y,
          cropAreaPixels.width,
          cropAreaPixels.height,
          0,
          0,
          cropAreaPixels.width,
          cropAreaPixels.height
        );

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      };
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      let croppedImageBlob;

      // Use cropped preview if available, otherwise create cropped image
      if (croppedPreview) {
        // Convert the preview URL back to a blob
        const response = await fetch(croppedPreview);
        croppedImageBlob = await response.blob();
      } else if (croppedAreaPixels) {
        // Create cropped image from original
        croppedImageBlob = await getCroppedImg(preview, croppedAreaPixels);
      } else {
        // No cropping, use original file
        croppedImageBlob = selectedFile;
      }

      // Create file from blob with cache-busting timestamp
      const timestamp = Date.now();
      const croppedFile = new File([croppedImageBlob], `${timestamp}_${selectedFile.name}`, {
        type: croppedImageBlob.type || 'image/jpeg',
      });

      const formData = new FormData();
      formData.append("picture", croppedFile);

      const response = await fetch(`https://mockingbird-server-453975176199.asia-south1.run.app//users/${userId}/profile-picture`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();

        // Update Redux state with new user data and cache-busting timestamp
        dispatch(setLogin({
          user: updatedUser,
          token: token,
        }));

        // Close dialog and reset state
        handleClose();

        // Show success message
        console.log("Profile picture updated successfully!");

        // Force refresh of all components by dispatching a custom event
        window.dispatchEvent(new CustomEvent('profilePictureUpdated'));
      } else {
        throw new Error("Failed to update profile picture");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Failed to update profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const response = await fetch(`https://mockingbird-server-453975176199.asia-south1.run.app//users/${userId}/profile-picture`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const updatedUser = await response.json();
        
        // Update Redux state
        dispatch(setLogin({
          user: updatedUser,
          token: token,
        }));

        // Dispatch event to force re-render of all components
        window.dispatchEvent(new CustomEvent('profilePictureUpdated'));

        handleClose();
        console.log("Profile picture removed successfully!");
      } else {
        throw new Error("Failed to remove profile picture");
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      alert("Failed to remove profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setShowCropper(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    // Clear cropped preview
    if (croppedPreview) {
      URL.revokeObjectURL(croppedPreview);
      setCroppedPreview(null);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "1rem",
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "1.5rem",
          fontWeight: 600,
        }}
      >
        <PhotoCamera sx={{ color: palette.primary.main }} />
        Change Profile Picture
        <Button
          onClick={handleClose}
          sx={{ minWidth: "auto", p: 0.5 }}
        >
          <Close />
        </Button>
      </DialogTitle>
      
      <DialogContent>
        <Box textAlign="center" mb={3}>
          {/* Current Picture Preview */}
          {!showCropper && (
            <Avatar
              src={croppedPreview || (currentPicture ? `https://mockingbird-server-453975176199.asia-south1.run.app//assets/${currentPicture}?v=${profilePictureKey}` : undefined)}
              sx={{
                width: 120,
                height: 120,
                mx: "auto",
                mb: 2,
                border: `3px solid ${palette.primary.main}`,
              }}
            >
              <PhotoCamera sx={{ fontSize: "3rem", color: palette.primary.main }} />
            </Avatar>
          )}

          {/* Image Cropper */}
          {showCropper && preview && (
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                <Crop sx={{ mr: 1, verticalAlign: 'middle' }} />
                Crop Your Image
              </Typography>

              {/* Cropper Container */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 300,
                  backgroundColor: '#333',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  mb: 2,
                }}
              >
                <Cropper
                  image={preview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </Box>

              {/* Zoom Controls */}
              <Box display="flex" alignItems="center" justifyContent="center" gap={2} mb={2}>
                <IconButton onClick={() => setZoom(Math.max(1, zoom - 0.1))}>
                  <ZoomOut />
                </IconButton>

                <Slider
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e, newValue) => setZoom(newValue)}
                  sx={{ width: 120 }}
                />

                <IconButton onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
                  <ZoomIn />
                </IconButton>
              </Box>

              {/* Crop Actions */}
              <Box display="flex" gap={1} justifyContent="center" mb={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowCropper(false);
                    setSelectedFile(null);
                    setPreview(null);
                    // Clear cropped preview
                    if (croppedPreview) {
                      URL.revokeObjectURL(croppedPreview);
                      setCroppedPreview(null);
                    }
                  }}
                >
                  Cancel Crop
                </Button>
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (croppedAreaPixels) {
                      try {
                        const croppedImageBlob = await getCroppedImg(preview, croppedAreaPixels);
                        const croppedPreviewUrl = URL.createObjectURL(croppedImageBlob);
                        setCroppedPreview(croppedPreviewUrl);
                      } catch (error) {
                        console.error("Error creating cropped preview:", error);
                      }
                    }
                    setShowCropper(false);
                  }}
                  disabled={!croppedAreaPixels}
                >
                  Apply Crop
                </Button>
              </Box>
            </Box>
          )}

          {/* Upload Area - Only show when not cropping */}
          {!showCropper && (
            <Dropzone
              acceptedFiles={[".jpg", ".jpeg", ".png"]}
              multiple={false}
              onDrop={handleFileSelect}
            >
              {({ getRootProps, getInputProps }) => (
                <Box
                  {...getRootProps()}
                  sx={{
                    border: `2px dashed ${palette.primary.main}`,
                    borderRadius: "12px",
                    padding: "2rem",
                    cursor: "pointer",
                    backgroundColor: palette.background.alt,
                    "&:hover": {
                      backgroundColor: palette.primary.light + "10",
                    },
                    mb: 2,
                  }}
                >
                  <input {...getInputProps()} />
                  <PhotoCamera
                    sx={{
                      fontSize: "3rem",
                      color: palette.primary.main,
                      mb: 1
                    }}
                  />
                  <Typography variant="h6" color="primary">
                    {selectedFile ? selectedFile.name : "Click or drag to upload new picture"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Supported formats: JPG, JPEG, PNG
                  </Typography>
                </Box>
              )}
            </Dropzone>
          )}

          {/* Remove Current Picture Option */}
          {currentPicture && !selectedFile && !showCropper && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleRemove}
              disabled={uploading}
              sx={{ mt: 1 }}
            >
              Remove Current Picture
            </Button>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: "center", pb: 2, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={uploading}
          sx={{
            borderRadius: "25px",
            px: 3,
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || showCropper || uploading}
          sx={{
            backgroundColor: palette.primary.main,
            color: "white",
            borderRadius: "25px",
            px: 3,
            "&:hover": {
              backgroundColor: palette.primary.dark,
            }
          }}
        >
          {uploading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Uploading...
            </>
          ) : (
            "Update Picture"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeProfilePictureDialog;
