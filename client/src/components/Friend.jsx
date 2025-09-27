import { 
  PersonAddOutlined, 
  PersonRemoveOutlined,
  Check,
  Close,
  Schedule,
} from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  setFriends,
  addSentFriendRequest,
  removeSentFriendRequest,
  addFriendRequest,
  removeFriendRequest,
  addFriend
} from "state";
import FlexBetween from "./FlexBetween";
import UserImage from "./UserImage";
import AdminBadge from "./AdminBadge";
import { API_BASE_URL } from "../utils/api";

const Friend = ({ 
  friendId, 
  name, 
  subtitle, 
  userPicturePath, 
  isAdmin = false, 
  size = "55px", 
  showAddFriend = true,
  friendStatus = 'none', // 'none', 'friends', 'request_sent', 'request_received'
  onFriendAction = null
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends || []);

  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  const isFriend = Array.isArray(friends) ? friends.find((friend) => friend._id === friendId) : false;

  const sendFriendRequest = async () => {
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

  const acceptFriendRequest = async () => {
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

  const rejectFriendRequest = async () => {
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

  const cancelFriendRequest = async () => {
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

  const removeFriend = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${_id}/${friendId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        const friendsData = await response.json();
        dispatch(setFriends({ friends: friendsData }));
      } else {
        console.error("Failed to remove friend");
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  return (
    <FlexBetween>
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
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
      {showAddFriend && friendId !== _id && (
        <Box sx={{ display: "flex", gap: "0.5rem" }}>
          {friendStatus === 'none' && (
            <IconButton
              onClick={sendFriendRequest}
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
          
          {friendStatus === 'request_sent' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <IconButton
                onClick={cancelFriendRequest}
                sx={{ 
                  backgroundColor: palette.warning.light, 
                  p: "0.6rem",
                  '&:hover': { backgroundColor: palette.warning.main }
                }}
                title="Cancel friend request"
              >
                <Schedule sx={{ color: palette.warning.dark }} />
              </IconButton>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: palette.warning.dark, 
                  fontSize: '0.7rem',
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                Request Sent
              </Typography>
            </Box>
          )}
          
          {friendStatus === 'request_received' && (
            <>
              <Button
                onClick={acceptFriendRequest}
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
                onClick={rejectFriendRequest}
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
            <IconButton
              onClick={removeFriend}
              sx={{ 
                backgroundColor: primaryLight, 
                p: "0.6rem",
                '&:hover': { 
                  backgroundColor: palette.error.main,
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
              title="Remove friend"
            >
              <PersonRemoveOutlined sx={{ color: primaryDark }} />
            </IconButton>
          )}
        </Box>
      )}
    </FlexBetween>
  );
};

export default Friend;
