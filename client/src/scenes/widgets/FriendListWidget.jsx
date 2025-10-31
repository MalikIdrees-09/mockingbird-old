

import { Box, Typography, TextField, InputAdornment, IconButton, Button, Chip } from "@mui/material";
import { Search as SearchIcon, PersonAdd as PersonAddIcon, Clear as ClearIcon } from "@mui/icons-material";
import Friend from "components/Friend";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setFriends } from "state";
import { API_BASE_URL } from "utils/api";

const FriendListWidget = ({ userId }) => {
  const dispatch = useDispatch();
  const { palette } = useSelector((state) => state.theme || {});
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends || []);
  const currentUser = useSelector((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Handle friend action updates
  const handleFriendAction = (action, friendId) => {
    // Update search results if the action affects a user in search results
    if (searchResults && searchResults.users) {
      setSearchResults(prev => ({
        ...prev,
        users: prev.users.map(user => {
          if (user._id === friendId) {
            let newFriendStatus = 'none';
            if (action === 'request_sent') {
              newFriendStatus = 'request_sent';
            } else if (action === 'accepted') {
              newFriendStatus = 'friends';
            } else if (action === 'cancelled' || action === 'rejected') {
              newFriendStatus = 'none';
            }
            return { ...user, friendStatus: newFriendStatus };
          }
          return user;
        })
      }));
    }
  };

  // Helper function to determine friend status
  const getFriendStatus = (userId) => {
    if (currentUser.friends?.includes(userId)) {
      return 'friends';
    }
    if (currentUser.sentFriendRequests?.includes(userId)) {
      return 'request_sent';
    }
    if (currentUser.friendRequests?.includes(userId)) {
      return 'request_received';
    }
    return 'none';
  };

  const getFriends = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/${userId}/friends`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch friends:", response.status);
        return;
      }

      const data = await response.json();
      // Filter out invalid friends (those with missing essential data)
      const validFriends = Array.isArray(data) ? data.filter(friend => 
        friend && 
        friend._id && 
        friend.firstName && 
        friend.lastName
      ) : [];
      dispatch(setFriends({ friends: validFriends }));
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/users/search?query=${encodeURIComponent(query.trim())}&limit=20`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        console.error("Failed to search users:", response.status);
        return;
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchUsers(searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setShowSearch(false);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery("");
      setSearchResults(null);
    }
  };

  useEffect(() => {
    getFriends();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WidgetWrapper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="1.5rem">
        <Typography
          color={palette?.neutral?.dark || "#333"}
          variant="h5"
          fontWeight="500"
        >
          Friend List
          {friends.length > 0 && (
            <Chip
              label={friends.length}
              size="small"
              sx={{ ml: 1, fontSize: "0.8rem" }}
            />
          )}
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={toggleSearch}
          sx={{ minWidth: "auto" }}
        >
          {showSearch ? "Hide Search" : "Find Friends"}
        </Button>
      </Box>

      {/* Search Section */}
      {showSearch && (
        <Box mb={3}>
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder="Search for people to connect with..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={clearSearch}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            <Box display="flex" gap={1}>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={searchLoading || searchQuery.length < 2}
                sx={{ flex: 1 }}
              >
                {searchLoading ? "Searching..." : "Search"}
              </Button>
              {searchQuery && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              )}
            </Box>
          </form>

          {/* Search Results */}
          {searchResults && (
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Search Results
                <Chip
                  label={`${searchResults.pagination?.totalUsers || 0} found`}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>

              {searchResults.users?.length > 0 ? (
                <Box display="flex" flexDirection="column" gap="1rem">
                  {searchResults.users.slice(0, 10).map((user) => (
                    <Friend
                      key={user._id}
                      friendId={user._id}
                      name={`${user.firstName} ${user.lastName}`}
                      subtitle={user.bio ? (user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio) : " "}
                      userPicturePath={user.picturePath}
                      friendStatus={getFriendStatus(user._id)}
                      onFriendAction={handleFriendAction}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  No users found matching "{searchQuery}"
                </Typography>
              )}

              {searchResults.pagination?.hasNextPage && (
                <Box textAlign="center" mt={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => searchUsers(searchQuery)}
                  >
                    Load More
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Friends List */}
      {!showSearch && (
        <Box display="flex" flexDirection="column" gap="1.5rem">
          {Array.isArray(friends) && friends.length > 0 ? (
            friends
              .filter(friend => friend && friend._id && friend.firstName && friend.lastName) // Extra validation
              .map((friend) => (
                <Friend
                  key={friend._id}
                  friendId={friend._id}
                  name={`${friend.firstName || 'Unknown'} ${friend.lastName || 'User'}`}
                  subtitle={friend.bio ? (friend.bio.length > 100 ? `${friend.bio.substring(0, 100)}...` : friend.bio) : " "}
                  userPicturePath={friend.picturePath}
                  friendStatus="friends"
                />
              ))
          ) : (
            <Box textAlign="center" py={4}>
              <PersonAddIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No friends yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click "Find Friends" to discover and connect with people!
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </WidgetWrapper>
  );
};

export default FriendListWidget;
