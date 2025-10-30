import { useState, useEffect, useCallback } from "react";
import {
  Badge,
  IconButton,
  Popover,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { handleBannedUserError } from "utils/api";
import NotificationDropdown from "./NotificationDropdown";
import { useSocket } from "./Chat/SocketProvider";

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();
  const theme = useTheme();
  const dark = theme.palette.neutral.dark;
  const socketCtx = useSocket();
  const socket = socketCtx?.socket;

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("https://mockingbird-backend.idrees.in/notifications/unread-count", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check for banned user error
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out

      if (handledResponse.ok) {
        const data = await handledResponse.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [token, dispatch]);

  useEffect(() => {
    fetchUnreadCount();

    // Poll as a fallback
    const interval = setInterval(fetchUnreadCount, 30000);

    // Realtime update on incoming direct_message
    if (socket && socket.on) {
      const handler = () => fetchUnreadCount();
      socket.on('direct_message', handler);
      return () => {
        clearInterval(interval);
        socket.off('direct_message', handler);
      };
    }
    return () => clearInterval(interval);
  }, [fetchUnreadCount, socket]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: dark,
          "&:hover": {
            backgroundColor: theme.palette.mode === "dark" 
              ? "rgba(255, 255, 255, 0.1)" 
              : "rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        sx={{
          "& .MuiPopover-paper": {
            width: { xs: '90vw', sm: 360, md: 400 },
            maxHeight: { xs: '70vh', sm: 520, md: 600 },
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          },
        }}
      >
        <NotificationDropdown onClose={handleClose} onUnreadCountChange={setUnreadCount} />
      </Popover>
    </>
  );
};

export default NotificationBell;
