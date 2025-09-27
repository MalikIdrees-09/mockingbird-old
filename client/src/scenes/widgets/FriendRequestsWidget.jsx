import { Box, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import WidgetWrapper from "components/WidgetWrapper";
import { API_BASE_URL } from "utils/api";
import { setFriendRequests } from "state";

const FriendRequestsWidget = ({ userId }) => {
  const [friendRequests, setLocalFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  const getFriendRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/friend-requests`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [];
        // Ensure data is serializable by creating clean copies
        const serializableData = dataArray.map(request => ({
          _id: request._id,
          firstName: request.firstName,
          lastName: request.lastName,
          bio: request.bio || "",
          location: request.location || "",
          picturePath: request.picturePath || ""
        }));
        setLocalFriendRequests(serializableData);
        // Store friend request IDs in Redux state
        const requestIds = serializableData.map(request => request._id);
        dispatch(setFriendRequests({ friendRequests: requestIds }));
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFriendRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFriendAction = (action, friendId) => {
    // Remove the friend request from the list when it's accepted/rejected
    if (action === 'accepted' || action === 'rejected') {
      setLocalFriendRequests(prev => prev.filter(request => request._id !== friendId));
    }
  };

  if (loading) {
    return (
      <WidgetWrapper>
        <Typography>Loading friend requests...</Typography>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper>
      <Typography
        color={palette.neutral.dark}
        variant="h5"
        fontWeight="500"
        sx={{ mb: "1.5rem" }}
      >
        Friend Requests ({friendRequests.length})
      </Typography>

      {friendRequests.length === 0 ? (
        <Typography color={palette.neutral.medium}>
          No pending friend requests
        </Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap="1.5rem">
          {friendRequests.map((request) => (
            <Friend
              key={request._id}
              friendId={request._id}
              name={`${request.firstName} ${request.lastName}`}
              subtitle={request.bio ? (request.bio.length > 100 ? `${request.bio.substring(0, 100)}...` : request.bio) : "No bio yet"}
              userPicturePath={request.picturePath}
              friendStatus="request_received"
              onFriendAction={handleFriendAction}
            />
          ))}
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default FriendRequestsWidget;
