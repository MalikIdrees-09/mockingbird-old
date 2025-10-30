import { useState } from "react";
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Favorite as LikeIcon,
  Comment as CommentIcon,
  PersonAdd as FriendIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  CheckCircle as ReadIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { formatDistanceToNow } from 'date-fns';
import { handleBannedUserError } from "utils/api";

const NotificationItem = ({ notification, onRead, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  // Get notification icon based on type
  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return <LikeIcon sx={{ color: '#e91e63' }} />;
      case 'comment':
        return <CommentIcon sx={{ color: '#2196f3' }} />;
      case 'friend_request':
      case 'friend_accepted':
        return <FriendIcon sx={{ color: '#4caf50' }} />;
      default:
        return <CommentIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  // Handle menu open
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = (event) => {
    event.stopPropagation();
    setMenuAnchor(null);
  };

  // Mark as read
  const handleMarkAsRead = async (event) => {
    event.stopPropagation();
    if (notification.isRead) return;

    try {
      const response = await fetch(
        `https://mockingbird-backend.idrees.in/notifications/${notification._id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        onRead(notification._id);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }

    handleMenuClose();
  };

  // Delete notification
  const handleDelete = async (event) => {
    event.stopPropagation();

    try {
      const response = await fetch(
        `https://mockingbird-backend.idrees.in/notifications/${notification._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        onDelete(notification._id);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }

    handleMenuClose();
  };

  // Handle click on notification
  const handleClick = () => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
        // Navigate to specific post
        if (notification.relatedId) {
          window.location.href = `/post/${notification.relatedId}`;
        } else {
          window.location.href = '/home';
        }
        break;
      case 'friend_request':
      case 'friend_accepted':
        // Navigate to user's profile
        if (notification.relatedId) {
          window.location.href = `/profile/${notification.relatedId}`;
        }
        break;
      default:
        break;
    }

    // Mark as read if not already read
    if (!notification.isRead) {
      handleMarkAsRead(new Event('click'));
    }
  };

  return (
    <>
      <ListItem
        onClick={handleClick}
        sx={{
          cursor: "pointer",
          backgroundColor: notification.isRead ? "transparent" : "rgba(25, 118, 210, 0.08)",
          "&:hover": {
            backgroundColor: notification.isRead
              ? "rgba(0, 0, 0, 0.04)"
              : "rgba(25, 118, 210, 0.12)",
          },
          py: 1.5,
          px: 2,
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            {getNotificationIcon()}
          </Avatar>
        </ListItemAvatar>

        <ListItemText
          primary={
            <Box>
              <Typography variant="body2" fontWeight={notification.isRead ? 400 : 600}>
                <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {notification.senderName}
                </Box>
                {' '}
                {notification.message}
              </Typography>
              {!notification.isRead && (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "primary.main",
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    flexShrink: 0,
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </Typography>
          }
        />

        <IconButton size="small" onClick={handleMenuOpen}>
          <MoreIcon />
        </IconButton>
      </ListItem>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {!notification.isRead && (
          <MenuItem onClick={handleMarkAsRead}>
            <ReadIcon sx={{ mr: 1, fontSize: 18 }} />
            Mark as Read
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationItem;
