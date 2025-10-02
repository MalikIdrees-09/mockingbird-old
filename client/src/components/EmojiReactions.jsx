import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Avatar,
  Tooltip,
  Fade,
  useTheme
} from '@mui/material';
import {
  ThumbUp as LikeIcon,
  Favorite as LoveIcon,
  EmojiEmotions as LaughIcon,
  SentimentVeryDissatisfied as AngryIcon,
  SentimentDissatisfied as SadIcon,
  MoreHoriz as MoreIcon
} from '@mui/icons-material';

const EmojiReactions = ({
  postId,
  currentReaction = null,
  reactionCounts = {},
  onReaction,
  size = 'medium',
  showCounts = true,
  compact = false
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoveredReaction, setHoveredReaction] = useState(null);

  const reactions = [
    {
      type: 'like',
      icon: LikeIcon,
      label: 'Like',
      color: '#1877F2',
      bgColor: 'rgba(24, 119, 242, 0.1)'
    },
    {
      type: 'love',
      icon: LoveIcon,
      label: 'Love',
      color: '#E41E3F',
      bgColor: 'rgba(228, 30, 63, 0.1)'
    },
    {
      type: 'laugh',
      icon: LaughIcon,
      label: 'Laugh',
      color: '#F7B928',
      bgColor: 'rgba(247, 185, 40, 0.1)'
    },
    {
      type: 'angry',
      icon: AngryIcon,
      label: 'Angry',
      color: '#E9710F',
      bgColor: 'rgba(233, 113, 15, 0.1)'
    },
    {
      type: 'sad',
      icon: SadIcon,
      label: 'Sad',
      color: '#F7B928',
      bgColor: 'rgba(247, 185, 40, 0.1)'
    }
  ];

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  const handleReactionClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleReactionClose = () => {
    setAnchorEl(null);
    setHoveredReaction(null);
  };

  const handleReactionSelect = (reactionType) => {
    if (onReaction) {
      onReaction(postId, reactionType);
    }
    handleReactionClose();
  };

  const getCurrentReactionInfo = () => {
    return reactions.find(r => r.type === currentReaction);
  };

  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getTopReactions = () => {
    return reactions
      .filter(r => reactionCounts[r.type] > 0)
      .sort((a, b) => reactionCounts[b.type] - reactionCounts[a.type])
      .slice(0, 3);
  };

  const open = Boolean(anchorEl);

  if (compact && !currentReaction && totalReactions === 0) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {/* Reaction Display */}
      {totalReactions > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <Box sx={{ display: 'flex', mr: 0.5 }}>
            {getTopReactions().map((reaction, index) => {
              const Icon = reaction.icon;
              return (
                <Box
                  key={reaction.type}
                  sx={{
                    width: size === 'small' ? 16 : 20,
                    height: size === 'small' ? 16 : 20,
                    borderRadius: '50%',
                    backgroundColor: reaction.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.3)',
                    ml: index > 0 ? -0.25 : 0,
                    zIndex: 3 - index
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: size === 'small' ? 10 : 12,
                      color: reaction.color
                    }}
                  />
                </Box>
              );
            })}
          </Box>

          {showCounts && (
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                cursor: 'pointer',
                '&:hover': { color: 'text.primary' }
              }}
            >
              {formatCount(totalReactions)}
            </Typography>
          )}
        </Box>
      )}

      {/* Reaction Button */}
      <Tooltip title={currentReaction ? `Remove ${getCurrentReactionInfo()?.label.toLowerCase()}` : 'React'}>
        <IconButton
          onClick={handleReactionClick}
          size={size}
          sx={{
            color: currentReaction ? getCurrentReactionInfo()?.color : 'text.secondary',
            backgroundColor: currentReaction ? getCurrentReactionInfo()?.bgColor : 'transparent',
            '&:hover': {
              backgroundColor: currentReaction ? getCurrentReactionInfo()?.bgColor : 'action.hover',
              transform: 'scale(1.05)'
            },
            transition: 'all 0.2s ease',
            borderRadius: '20px',
            px: currentReaction ? 1.5 : 1
          }}
        >
          {currentReaction ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {React.createElement(getCurrentReactionInfo().icon, { fontSize: size })}
              {!compact && (
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {getCurrentReactionInfo()?.label}
                </Typography>
              )}
            </Box>
          ) : (
            <LikeIcon fontSize={size} />
          )}
        </IconButton>
      </Tooltip>

      {/* Reaction Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleReactionClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            borderRadius: '12px',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'visible'
          }
        }}
      >
        <Box sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {reactions.map((reaction) => {
              const Icon = reaction.icon;
              const isCurrentReaction = currentReaction === reaction.type;
              const count = reactionCounts[reaction.type] || 0;

              return (
                <Tooltip key={reaction.type} title={`${reaction.label}${count > 0 ? ` (${count})` : ''}`}>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton
                      onClick={() => handleReactionSelect(reaction.type)}
                      onMouseEnter={() => setHoveredReaction(reaction.type)}
                      onMouseLeave={() => setHoveredReaction(null)}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: isCurrentReaction
                          ? reaction.bgColor
                          : hoveredReaction === reaction.type
                            ? reaction.bgColor
                            : 'transparent',
                        color: isCurrentReaction || hoveredReaction === reaction.type
                          ? reaction.color
                          : 'text.secondary',
                        transition: 'all 0.2s ease',
                        transform: (isCurrentReaction || hoveredReaction === reaction.type)
                          ? 'scale(1.2)'
                          : 'scale(1)',
                        '&:hover': {
                          backgroundColor: reaction.bgColor,
                          color: reaction.color,
                          transform: 'scale(1.2)'
                        }
                      }}
                    >
                      <Icon sx={{ fontSize: 20 }} />
                    </IconButton>

                    {/* Reaction count indicator */}
                    {count > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -4,
                          right: -4,
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: '8px',
                          px: 0.5,
                          py: 0.125,
                          minWidth: '16px',
                          height: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            color: 'text.secondary'
                          }}
                        >
                          {formatCount(count)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default EmojiReactions;
