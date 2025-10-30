import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  useTheme,
  Grid,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Close,
  NavigateBefore,
  NavigateNext,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Download,
} from '@mui/icons-material';

const ImageGallery = ({ 
  images, 
  imageTypes = [], 
  imageSizes = [],
  maxDisplay = 4,
  showCount = true,
  enableLightbox = true 
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const theme = useTheme();

  if (!images || images.length === 0) return null;

  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;

  const openLightbox = (index) => {
    if (!enableLightbox) return;
    setCurrentImageIndex(index);
    setLightboxOpen(true);
    setZoomLevel(1);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
  };

  const navigateImage = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % images.length
      : (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(newIndex);
    setZoomLevel(1);
  };

  const handleZoom = (direction) => {
    const newZoom = direction === 'in' 
      ? Math.min(zoomLevel * 1.2, 3)
      : Math.max(zoomLevel / 1.2, 0.5);
    setZoomLevel(newZoom);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = images[currentImageIndex];
    link.download = `image-${currentImageIndex + 1}.jpg`;
    link.click();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getImageType = (index) => {
    return imageTypes[index] || 'image';
  };

  const getImageSize = (index) => {
    return imageSizes[index] || 0;
  };

  return (
    <>
      <Box sx={{ mt: '0.75rem' }}>
        {images.length === 1 ? (
          // Single image - display full width
          <Box
            sx={{
              position: 'relative',
              cursor: enableLightbox ? 'pointer' : 'default',
              '&:hover': enableLightbox ? {
                '& .zoom-overlay': {
                  opacity: 1,
                }
              } : {}
            }}
            onClick={() => openLightbox(0)}
          >
            <img
              width="100%"
              height="auto"
              alt="post"
              src={images[0]}
              style={{
                borderRadius: "0.75rem",
                maxHeight: '500px',
                objectFit: 'cover'
              }}
            />
            {enableLightbox && (
              <Box
                className="zoom-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  borderRadius: "0.75rem",
                }}
              >
                <ZoomIn sx={{ color: 'white', fontSize: '2rem' }} />
              </Box>
            )}
          </Box>
        ) : (
          // Multiple images - display in grid
          <Box sx={{ 
            display: "grid", 
            gap: 1, 
            gridTemplateColumns: images.length === 2 
              ? "1fr 1fr" 
              : images.length === 3 
                ? "2fr 1fr 1fr" 
                : "repeat(2, 1fr)",
            maxHeight: '500px',
            overflow: 'hidden'
          }}>
            {displayImages.map((image, index) => (
              <Box
                key={index}
                sx={{
                  position: "relative",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  cursor: enableLightbox ? 'pointer' : 'default',
                  '&:hover': enableLightbox ? {
                    '& .zoom-overlay': {
                      opacity: 1,
                    }
                  } : {}
                }}
                onClick={() => openLightbox(index)}
              >
                <img
                  width="100%"
                  height="100%"
                  alt={`post ${index + 1}`}
                  src={image}
                  style={{
                    objectFit: "cover",
                    minHeight: index === 0 && images.length === 3 ? '200px' : '100px'
                  }}
                />
                {enableLightbox && (
                  <Box
                    className="zoom-overlay"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <ZoomIn sx={{ color: 'white', fontSize: '1.5rem' }} />
                  </Box>
                )}
                
                {/* Show remaining count on last visible image */}
                {index === displayImages.length - 1 && remainingCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    +{remainingCount}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Image info chips */}
        {showCount && images.length > 1 && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${images.length} image${images.length > 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {imageTypes.some(type => type === 'audio') && (
              <Chip 
                label="Audio included"
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Box>

      {/* Lightbox Dialog */}
      <Dialog
        open={lightboxOpen}
        onClose={closeLightbox}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0,0,0,0.9)',
            color: 'white',
            maxWidth: '90vw',
            maxHeight: '90vh',
            margin: 'auto'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {/* Close button */}
          <IconButton
            onClick={closeLightbox}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)',
              }
            }}
          >
            <Close />
          </IconButton>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <IconButton
                onClick={() => navigateImage('prev')}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <NavigateBefore />
              </IconButton>
              <IconButton
                onClick={() => navigateImage('next')}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.7)',
                  }
                }}
              >
                <NavigateNext />
              </IconButton>
            </>
          )}

          {/* Zoom controls */}
          <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1, display: 'flex', gap: 1 }}>
            <IconButton
              onClick={() => handleZoom('out')}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                }
              }}
            >
              <ZoomOut />
            </IconButton>
            <IconButton
              onClick={() => handleZoom('in')}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                }
              }}
            >
              <ZoomIn />
            </IconButton>
            <IconButton
              onClick={downloadImage}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.7)',
                }
              }}
            >
              <Download />
            </IconButton>
          </Box>

          {/* Current image */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
            <img
              src={images[currentImageIndex]}
              alt={`Gallery image ${currentImageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease',
                cursor: zoomLevel > 1 ? 'grab' : 'zoom-in'
              }}
              onClick={() => handleZoom('in')}
            />
          </Box>

          {/* Image counter and info */}
          <Box sx={{ 
            position: 'absolute', 
            bottom: 16, 
            left: 16, 
            right: 16, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '8px 16px',
            borderRadius: '8px'
          }}>
            <Typography variant="body2">
              {currentImageIndex + 1} of {images.length}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {getImageSize(currentImageIndex) > 0 && (
                <Typography variant="caption">
                  {formatFileSize(getImageSize(currentImageIndex))}
                </Typography>
              )}
              <Typography variant="caption">
                {getImageType(currentImageIndex).toUpperCase()}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;

