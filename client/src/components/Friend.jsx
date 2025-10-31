import { 
  PersonAddOutlined, 
  Check,
  Close,
} from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  setFriends,
  removeSentFriendRequest,
  removeFriendRequest,
  addFriend,
  addSentFriendRequest
} from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import AdminBadge from "./AdminBadge";
import NewsBadge from "./NewsBadge";
import { API_BASE_URL } from "../utils/api";

const Friend = ({ 
  friendId, 
  name, 
  subtitle, 
  userPicturePath, 
  isAdmin = false, 
  size = "55px", 
  showAddFriend = true,
  showAcceptReject = true,
  friendStatus = 'none', // 'none', 'friends', 'request_sent', 'request_received'
  onFriendAction = null
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  const theme = useTheme();
  const { palette } = theme;
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;
  const isDarkMode = theme.palette.mode === 'dark';

  const containerGradient = isDarkMode
    ? 'linear-gradient(135deg, rgba(25, 28, 38, 0.95), rgba(14, 17, 26, 0.9))'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(246, 248, 255, 0.94))';
  const containerBorder = isDarkMode ? 'rgba(148, 163, 184, 0.18)' : 'rgba(15, 23, 42, 0.08)';
  const containerShadow = isDarkMode ? '0 16px 36px rgba(5, 12, 28, 0.55)' : '0 12px 28px rgba(15, 23, 42, 0.15)';
  const containerHoverShadow = isDarkMode ? '0 20px 48px rgba(5, 12, 28, 0.68)' : '0 16px 36px rgba(15, 23, 42, 0.22)';

  const normalizedName = name?.toLowerCase() || "";
  const isProtectedNewsAccount =
    normalizedName.startsWith('al jazeera') ||
    normalizedName.startsWith('bbc') ||
    normalizedName.startsWith('nasa') ||
    subtitle?.toLowerCase() === 'news feed' ||
    (typeof userPicturePath === 'string' && (
      userPicturePath.includes('aljazeera') ||
      userPicturePath.includes('bbc-logo') ||
      userPicturePath.includes('nasa-logo')
    ));

  const canSendFriendRequest = showAddFriend && friendId !== _id && !isProtectedNewsAccount;
  const canRespondToRequest = showAcceptReject && friendId !== _id;

  const sendFriendRequest = async (event) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${_id}/friend-request/${friendId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        dispatch(addSentFriendRequest({ userId: friendId }));
        if (onFriendAction) {
          onFriendAction('request_sent', friendId);
        }
      } else {
        console.error("Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const acceptFriendRequest = async (event) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${_id}/accept-friend/${friendId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        // Clear pending request indicators
        dispatch(removeFriendRequest({ userId: friendId }));
        dispatch(removeSentFriendRequest({ userId: friendId }));

        // Update friends list
        const friendsResponse = await fetch(`${API_BASE_URL}/users/${_id}/friends`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          dispatch(setFriends({ friends: friendsData }));
          dispatch(addFriend({ userId: friendId }));
        }
        
        if (onFriendAction) {
          onFriendAction('accepted', friendId);
        }
      } else {
        console.error("Failed to accept friend request");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const rejectFriendRequest = async (event) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${_id}/reject-friend/${friendId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        dispatch(removeFriendRequest({ userId: friendId }));
        dispatch(removeSentFriendRequest({ userId: friendId }));
        if (onFriendAction) {
          onFriendAction('rejected', friendId);
        }
      } else {
        console.error("Failed to reject friend request");
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const cancelFriendRequest = async (event) => {
    event.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${_id}/cancel-friend/${friendId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        dispatch(removeSentFriendRequest({ userId: friendId }));
        if (onFriendAction) {
          onFriendAction('cancelled', friendId);
        }
      } else {
        console.error("Failed to cancel friend request");
      }
    } catch (error) {
      console.error("Error cancelling friend request:", error);
    }
  };

  return (
    <FlexBetween
      sx={{
        position: 'relative',
        gap: '1rem',
        padding: '0.85rem 1.1rem',
        borderRadius: '16px',
        background: containerGradient,
        border: `1px solid ${containerBorder}`,
        boxShadow: containerShadow,
        transition: 'transform 0.2s ease, box-shadow 0.25s ease',
        backdropFilter: isDarkMode ? 'saturate(160%) blur(12px)' : 'none',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: containerHoverShadow,
        },
      }}
    >
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size={size} name={name} />
        <Box
          onClick={() => {
            navigate(`/profile/${friendId}`);
          }}
        >
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              "&:hover": {
                color: palette.primary.light,
                cursor: "pointer",
              },
            }}
          >
            {name || `${friendId || 'Unknown'} User`}
            {isAdmin && <AdminBadge size="small" />}
            {(!isAdmin && isProtectedNewsAccount) && (
              <NewsBadge size="small" />
            )}
          </Typography>
          <Typography color={isDarkMode ? 'rgba(226, 232, 240, 0.7)' : 'rgba(71, 85, 105, 0.75)'} fontSize="0.8rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
      {(canSendFriendRequest || canRespondToRequest) && (
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          {friendStatus === 'none' && canSendFriendRequest && (
            <IconButton
              onClick={(e) => sendFriendRequest(e)}
              sx={{ 
                backgroundColor: primaryLight, 
                p: "0.6rem",
                '&:hover': { 
                  backgroundColor: primaryDark,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
              title="Send friend request"
            >
              <PersonAddOutlined sx={{ color: primaryDark }} />
            </IconButton>
          )}
          
          {friendStatus === 'request_sent' && canSendFriendRequest && (
            <Button
              onClick={(e) => cancelFriendRequest(e)}
              variant="contained"
              size="small"
              sx={{ 
                backgroundColor: palette.neutral.medium,
                color: 'white',
                minWidth: '100px',
                '&:hover': { 
                  backgroundColor: palette.neutral.main,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
              title="Cancel friend request"
            >
              Request Sent
            </Button>
          )}
          
          {friendStatus === 'request_received' && canRespondToRequest && (
            <>
              <Button
                onClick={(e) => acceptFriendRequest(e)}
                variant="contained"
                size="small"
                sx={{ 
                  minWidth: "auto", 
                  px: 1,
                  backgroundColor: palette.success.main,
                  "&:hover": { backgroundColor: palette.success.dark }
                }}
                title="Accept friend request"
              >
                <Check fontSize="small" />
              </Button>
              <Button
                onClick={(e) => rejectFriendRequest(e)}
                variant="outlined"
                size="small"
                sx={{ 
                  minWidth: "auto", 
                  px: 1,
                  borderColor: palette.error.main,
                  color: palette.error.main,
                  "&:hover": { 
                    borderColor: palette.error.dark,
                    backgroundColor: palette.error.light + "20"
                  }
                }}
                title="Reject friend request"
              >
                <Close fontSize="small" />
              </Button>
            </>
          )}
          
          {friendStatus === 'friends' && (
            <Box sx={{ display: "flex", gap: "0.5rem" }}>
              {/* Message functionality removed */}
            </Box>
          )}
        </Box>
      )}
    </FlexBetween>
  );
};

export default Friend;
