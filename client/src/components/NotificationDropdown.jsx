import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
  List,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  MarkEmailRead as MarkReadIcon,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { handleBannedUserError } from "utils/api";
import NotificationItem from "./NotificationItem";

const NotificationDropdown = ({ onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [pagination, setPagination] = useState(null);

  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1) => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `https://mockingbird-server-453975176199.asia-south1.run.app//notifications?page=${page}&limit=10`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        const data = await handledResponse.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination);
        onUnreadCountChange && onUnreadCountChange(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [token, dispatch, onUnreadCountChange]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      setMarkingAllRead(true);
      const response = await fetch("https://mockingbird-server-453975176199.asia-south1.run.app//notifications/mark-all-read", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        onUnreadCountChange && onUnreadCountChange(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Handle notification read
  const handleNotificationRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    // Update unread count
    onUnreadCountChange && onUnreadCountChange(prev => Math.max(0, prev - 1));
  };

  // Handle notification delete
  const handleNotificationDelete = (notificationId) => {
    setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Notifications
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {notifications.some(n => !n.isRead) && (
            <Button
              size="small"
              onClick={markAllAsRead}
              disabled={markingAllRead}
              startIcon={markingAllRead ? <CircularProgress size={16} /> : <MarkReadIcon />}
            >
              {markingAllRead ? "Marking..." : "Mark All Read"}
            </Button>
          )}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ maxHeight: 400, overflow: "auto" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: "center", p: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              You'll see notifications here when people interact with your posts
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {notifications.map((notification, index) => (
              <div key={notification._id}>
                <NotificationItem
                  notification={notification}
                  onRead={handleNotificationRead}
                  onDelete={handleNotificationDelete}
                />
                {index < notifications.length - 1 && <Divider />}
              </div>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      {pagination && pagination.hasNextPage && (
        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            fullWidth
            onClick={() => fetchNotifications(pagination.currentPage + 1)}
            disabled={loading}
          >
            Load More
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NotificationDropdown;
