import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Box
} from '@mui/material';
import {
  Share as ShareIcon,
  Link as LinkIcon,
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkedIcon,
  Report as ReportIcon,
  Block as BlockIcon,
  PersonAdd as AddFriendIcon,
  PersonRemove as RemoveFriendIcon,
  Message as MessageIcon,
  MoreVert as MoreIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const ContextMenu = ({
  children,
  items = [],
  onItemClick,
  disabled = false,
  size = 'small'
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (event) => {
    event.preventDefault();
    if (disabled) return;

    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null,
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
    handleClose();
  };

  return (
    <>
      <Box onContextMenu={handleContextMenu} sx={{ cursor: 'context-menu' }}>
        {children}
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            borderRadius: '8px',
            minWidth: '200px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id || index}>
            {item.divider && <Divider />}
            <MenuItem
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              sx={{
                py: 1.5,
                px: 2,
                fontSize: '0.875rem',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                ...(item.danger && {
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                  }
                })
              }}
            >
              {item.icon && (
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    fontWeight: item.important ? 600 : 400
                  }
                }}
              />
            </MenuItem>
          </React.Fragment>
        ))}
      </Menu>
    </>
  );
};

// Predefined context menu configurations
export const PostContextMenu = ({
  children,
  postId,
  postUserId,
  currentUserId,
  isLiked,
  isBookmarked,
  onLike,
  onShare,
  onBookmark,
  onReport,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false
}) => {
  const items = [
    {
      id: 'share',
      label: 'Share',
      icon: <ShareIcon fontSize="small" />,
      onClick: () => onShare && onShare()
    },
    {
      id: 'copy-link',
      label: 'Copy link',
      icon: <LinkIcon fontSize="small" />,
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      }
    },
    {
      id: 'bookmark',
      label: isBookmarked ? 'Remove bookmark' : 'Bookmark',
      icon: isBookmarked ? <BookmarkedIcon fontSize="small" /> : <BookmarkIcon fontSize="small" />,
      onClick: () => onBookmark && onBookmark()
    },
    ...(canEdit ? [{
      id: 'edit',
      label: 'Edit post',
      icon: <EditIcon fontSize="small" />,
      onClick: () => onEdit && onEdit()
    }] : []),
    ...(canDelete ? [{
      id: 'delete',
      label: 'Delete post',
      icon: <DeleteIcon fontSize="small" />,
      danger: true,
      onClick: () => onDelete && onDelete()
    }] : []),
    {
      divider: true
    },
    {
      id: 'report',
      label: 'Report post',
      icon: <ReportIcon fontSize="small" />,
      onClick: () => onReport && onReport()
    }
  ];

  return (
    <ContextMenu items={items}>
      {children}
    </ContextMenu>
  );
};

export const UserContextMenu = ({
  children,
  userId,
  currentUserId,
  isFriend,
  isBlocked,
  hasSentRequest,
  hasReceivedRequest,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriend,
  onBlock,
  onUnblock,
  onMessage,
  onViewProfile
}) => {
  const items = [
    {
      id: 'view-profile',
      label: 'View profile',
      icon: <PersonIcon fontSize="small" />,
      onClick: () => onViewProfile && onViewProfile()
    },
    {
      id: 'message',
      label: 'Send message',
      icon: <MessageIcon fontSize="small" />,
      onClick: () => onMessage && onMessage()
    },
    ...(currentUserId !== userId ? [
      ...(hasReceivedRequest ? [{
        id: 'accept-request',
        label: 'Accept friend request',
        icon: <CheckCircleIcon fontSize="small" />,
        important: true,
        onClick: () => onAcceptFriendRequest && onAcceptFriendRequest()
      }] : []),
      ...(hasSentRequest ? [{
        id: 'cancel-request',
        label: 'Cancel friend request',
        icon: <CancelIcon fontSize="small" />,
        onClick: () => onDeclineFriendRequest && onDeclineFriendRequest()
      }] : []),
      ...(isFriend ? [{
        id: 'remove-friend',
        label: 'Remove friend',
        icon: <RemoveFriendIcon fontSize="small" />,
        onClick: () => onRemoveFriend && onRemoveFriend()
      }] : [{
        id: 'add-friend',
        label: 'Add friend',
        icon: <AddFriendIcon fontSize="small" />,
        onClick: () => onSendFriendRequest && onSendFriendRequest()
      }]),
      {
        divider: true
      },
      ...(isBlocked ? [{
        id: 'unblock',
        label: 'Unblock user',
        icon: <UnblockIcon fontSize="small" />,
        onClick: () => onUnblock && onUnblock()
      }] : [{
        id: 'block',
        label: 'Block user',
        icon: <BlockIcon fontSize="small" />,
        danger: true,
        onClick: () => onBlock && onBlock()
      }]),
      {
        id: 'report',
        label: 'Report user',
        icon: <ReportIcon fontSize="small" />,
        onClick: () => onReport && onReport()
      }
    ] : [])
  ];

  return (
    <ContextMenu items={items}>
      {children}
    </ContextMenu>
  );
};

export default ContextMenu;
