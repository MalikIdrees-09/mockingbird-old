import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Close,
} from '@mui/icons-material';

const LinkPreview = ({ preview, onRemove, compact = false, showRemoveButton = false }) => {
  const theme = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!preview || !preview.url) return null;

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    setImageError(true);
    e.target.style.display = 'none';
  };

  const handleFaviconError = (e) => {
    e.target.style.display = 'none';
  };

  const getSiteName = () => {
    if (preview.siteName) return preview.siteName;
    try {
      return new URL(preview.url).hostname.replace('www.', '');
    } catch {
      return 'Unknown Site';
    }
  };

  return (
    <Box
      component="a"
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        textDecoration: 'none',
        border: `1px solid ${theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(0,0,0,0.08)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        mt: compact ? 0.5 : 1,
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.4)'
            : '0 4px 16px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)',
        },
        position: 'relative',
        cursor: 'pointer',
        display: 'block',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2 }}>
        {/* Preview Image with Loading State */}
        {preview.image && preview.image.trim() !== '' && (
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            {!imageLoaded && !imageError && (
              <Box
                sx={{
                  width: compact ? 120 : 150,
                  height: compact ? 120 : 150,
                  borderRadius: '12px',
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
            <Box
              component="img"
              src={preview.image}
              alt={preview.title || 'Link preview'}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                width: compact ? 120 : 150,
                height: compact ? 120 : 150,
                objectFit: 'cover',
                borderRadius: '12px',
                display: imageLoaded ? 'block' : 'none',
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.05)',
              }}
            />
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Site Name & Favicon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
            {preview.favicon && (
              <Box
                component="img"
                src={preview.favicon}
                alt={`${getSiteName()} favicon`}
                onError={handleFaviconError}
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '3px',
                }}
              />
            )}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
                fontSize: '0.8rem',
              }}
            >
              {getSiteName()}
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            variant={compact ? "body1" : "h6"}
            sx={{
              fontWeight: 600,
              mb: 0.75,
              color: theme.palette.text.primary,
              display: '-webkit-box',
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.4,
              fontSize: compact ? '0.95rem' : '1.1rem',
            }}
          >
            {preview.title || 'No title available'}
          </Typography>

          {/* Description */}
          {!compact && preview.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                mb: 1,
              }}
            >
              {preview.description}
            </Typography>
          )}

          {/* URL - show initially, hide once image loads */}
          {!imageLoaded && !imageError && (
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.8rem',
                opacity: 0.7,
                wordBreak: 'break-all',
              }}
            >
              {preview.url}
            </Typography>
          )}
        </Box>

        {/* Remove Button */}
        {showRemoveButton && onRemove && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(preview.url);
            }}
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: 'white',
              width: 24,
              height: 24,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.8)',
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default LinkPreview;
