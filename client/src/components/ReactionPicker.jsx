import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Popover,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import {
  ThumbUpOutlined,
  ThumbUp,
  FavoriteBorderOutlined,
  Favorite,
} from '@mui/icons-material';

const ReactionPicker = ({ 
  postId, 
  currentReaction, 
  reactionCounts = {}, 
  onReactionChange,
  disabled = false,
  density = 'regular',
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const theme = useTheme();
  const open = Boolean(anchorEl);
  const isCompact = density === 'compact';

  const reactions = [
    { type: 'like', icon: ThumbUpOutlined, activeIcon: ThumbUp, label: 'Like', color: '#1877F2', isIcon: true },
    { type: 'love', icon: FavoriteBorderOutlined, activeIcon: Favorite, label: 'Love', color: '#F02849', isIcon: true },
    { type: 'laugh', emoji: '😂', label: 'Haha', color: '#F7B928', isIcon: false },
    { type: 'wow', emoji: '😮', label: 'Wow', color: '#F7B928', isIcon: false },
    { type: 'sad', emoji: '😢', label: 'Sad', color: '#5890FF', isIcon: false },
    { type: 'angry', emoji: '😠', label: 'Angry', color: '#F02849', isIcon: false },
  ];

  const handleReactionClick = async (reactionType) => {
    if (disabled || isSubmitting) return;
    
    setIsSubmitting(true);
    setAnchorEl(null);
    
    try {
      await onReactionChange(reactionType);
    } catch (error) {
      console.error('Error updating reaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeButtonClick = (event) => {
    if (disabled || isSubmitting) return;
    
    if (currentReaction) {
      // If there's already a reaction, show the picker
      setAnchorEl(event.currentTarget);
    } else {
      // If no reaction, just like
      handleReactionClick('like');
    }
  };

  const handleLongPress = (event) => {
    if (disabled || isSubmitting) return;
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleMouseDown = (event) => {
    if (disabled || isSubmitting) return;
    
    // Start long press timer
    const timer = setTimeout(() => {
      setIsLongPressing(true);
      handleLongPress(event);
    }, 500); // 500ms for long press

    const handleMouseUp = () => {
      clearTimeout(timer);
      setIsLongPressing(false);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseLeave = () => {
      clearTimeout(timer);
      setIsLongPressing(false);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
  };

  const handleTouchStart = (event) => {
    if (disabled || isSubmitting) return;
    
    // Start long press timer for mobile
    const timer = setTimeout(() => {
      setIsLongPressing(true);
      handleLongPress(event);
    }, 500); // 500ms for long press

    const handleTouchEnd = () => {
      clearTimeout(timer);
      setIsLongPressing(false);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    const handleTouchCancel = () => {
      clearTimeout(timer);
      setIsLongPressing(false);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };

    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchCancel);
  };

  const getTotalReactionCount = () => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  const getReactionDisplay = () => {
    if (currentReaction) {
      const reaction = reactions.find(r => r.type === currentReaction);
      return {
        icon: reaction?.activeIcon,
        emoji: reaction?.emoji,
        isIcon: reaction?.isIcon,
        color: reaction?.color || '#1877F2',
        count: reactionCounts[currentReaction] || 0
      };
    }
    
    return {
      icon: ThumbUpOutlined,
      isIcon: true,
      color: theme.palette.neutral.main,
      count: getTotalReactionCount()
    };
  };

  const display = getReactionDisplay();
  const IconComponent = display.icon;

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: isCompact ? 0.35 : 0.5 }}>
        <Tooltip title={currentReaction ? `Remove ${currentReaction} reaction` : 'Click to like, long press for more reactions'}>
          <IconButton
            onClick={handleLikeButtonClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            disabled={disabled || isSubmitting}
            sx={{ 
              padding: isCompact ? '0.35rem' : '0.5rem',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
              ...(isLongPressing && {
                backgroundColor: 'rgba(0,0,0,0.1)',
                transform: 'scale(1.1)',
                transition: 'all 0.2s ease'
              })
            }}
          >
            {display.isIcon ? (
              <IconComponent 
                sx={{ 
                  fontSize: isCompact ? '1.3rem' : '1.5rem',
                  color: display.color,
                  transition: 'all 0.2s ease'
                }} 
              />
            ) : (
              <Typography
                sx={{
                  fontSize: isCompact ? '1.3rem' : '1.5rem',
                  lineHeight: 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {display.emoji}
              </Typography>
            )}
          </IconButton>
        </Tooltip>
        
        {display.count > 0 && (
          <Typography 
            sx={{ 
              fontSize: isCompact ? '0.85rem' : '1rem', 
              fontWeight: 500,
              color: theme.palette.neutral.main,
              minWidth: isCompact ? '1.3rem' : '1.5rem',
              textAlign: 'center'
            }}
          >
            {display.count}
          </Typography>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            padding: '0.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Grid container spacing={1} sx={{ minWidth: isCompact ? '160px' : '200px' }}>
          {reactions.map((reaction) => {
            const isActive = currentReaction === reaction.type;
            const count = reactionCounts[reaction.type] || 0;
            
            return (
              <Grid item xs={4} key={reaction.type}>
                <Tooltip title={`${reaction.label} (${count})`}>
                  <Box
                    onClick={() => handleReactionClick(reaction.type)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: isCompact ? '0.4rem' : '0.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {reaction.isIcon ? (
                      // Render Material-UI icons for like and love
                      isActive ? (
                        <reaction.activeIcon 
                          sx={{ 
                            fontSize: isCompact ? '1.5rem' : '1.8rem', 
                            color: reaction.color,
                            animation: 'bounce 0.3s ease'
                          }} 
                        />
                      ) : (
                        <reaction.icon 
                          sx={{ 
                            fontSize: isCompact ? '1.5rem' : '1.8rem', 
                            color: reaction.color,
                            opacity: 0.7
                          }} 
                        />
                      )
                    ) : (
                      // Render emojis for other reactions
                      <Typography
                        sx={{
                          fontSize: isCompact ? '1.5rem' : '1.8rem',
                          lineHeight: 1,
                          opacity: isActive ? 1 : 0.7,
                          filter: isActive ? 'none' : 'grayscale(0.3)',
                          animation: isActive ? 'bounce 0.3s ease' : 'none',
                        }}
                      >
                        {reaction.emoji}
                      </Typography>
                    )}
                    {count > 0 && (
                      <Typography 
                        sx={{ 
                          fontSize: isCompact ? '0.7rem' : '0.75rem', 
                          fontWeight: 600,
                          color: theme.palette.neutral.main,
                          mt: 0.25
                        }}
                      >
                        {count}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              </Grid>
            );
          })}
        </Grid>
      </Popover>
    </>
  );
};

export default ReactionPicker;
