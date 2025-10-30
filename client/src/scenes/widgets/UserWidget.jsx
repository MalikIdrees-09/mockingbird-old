import {
  ManageAccountsOutlined,
  LocationOnOutlined,
  EditOutlined,
  DescriptionOutlined,
  PhotoCamera,
} from "@mui/icons-material";
import { Box, Typography, Divider, useTheme, IconButton, Tooltip, Button } from "@mui/material";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import BioEditDialog from "components/BioEditDialog";
import LocationEditDialog from "components/LocationEditDialog";
import ChangeProfilePictureDialog from "components/ChangeProfilePictureDialog";
import AdminBadge from "components/AdminBadge";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../utils/api";

const UserWidget = ({ userId, picturePath, allowProfileEdits = true }) => {
  const [user, setUser] = useState(null);
  const [profilePictureDialog, setProfilePictureDialog] = useState(false);
  const [bioEditDialog, setBioEditDialog] = useState(false);
  const [locationEditDialog, setLocationEditDialog] = useState(false);
  const { palette } = useTheme();
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const currentUser = useSelector((state) => state.user);
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const main = palette.neutral.main;
  
  // Check if this is the current user's profile
  const isOwnProfile = currentUser && currentUser._id === userId;

  const getUser = async () => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
  };

  useEffect(() => {
    getUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return null;
  }

  const {
    firstName,
    lastName,
    location,
    bio,
    friends,
    isAdmin,
  } = user;

  // Check if current user is friends with this user
  const isFriend = currentUser?.friends?.includes(userId);

  return (
    <WidgetWrapper>
      {/* FIRST ROW */}
      <FlexBetween
        gap="0.5rem"
        pb="1.1rem"
        onClick={() => navigate(`/profile/${userId}`)}
      >
        <FlexBetween gap="1rem">
          <Box position="relative">
            <UserImage image={picturePath} name={`${firstName || 'Unknown'} ${lastName || 'User'}`} />
            {allowProfileEdits && isOwnProfile && (
              <Tooltip title="Change profile picture">
                <IconButton
                  onClick={() => setProfilePictureDialog(true)}
                  sx={{
                    position: "absolute",
                    bottom: -5,
                    right: -5,
                    backgroundColor: palette.primary.main,
                    color: "white",
                    width: 30,
                    height: 30,
                    "&:hover": {
                      backgroundColor: palette.primary.dark,
                    },
                  }}
                >
                  <PhotoCamera sx={{ fontSize: "1rem" }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Box>
            <FlexBetween>
              <Typography
                variant="h4"
                color={dark}
                fontWeight="500"
                sx={{
                  "&:hover": {
                    color: palette.primary.light,
                    cursor: "pointer",
                  },
                }}
              >
                {firstName || 'Unknown'} {lastName || 'User'}
                {isAdmin && <AdminBadge size="small" />}
              </Typography>
            </FlexBetween>
            <Typography color={medium}>{friends.filter((friend) => !friend.isBanned).length} friends</Typography>
          </Box>
        </FlexBetween>
        <ManageAccountsOutlined />
      </FlexBetween>

      <Divider />

      {/* SECOND ROW */}
      <Box p="1rem 0">
        <Box display="flex" alignItems="center" gap="1rem" mb="0.5rem">
          <LocationOnOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium}>{location}</Typography>
          {allowProfileEdits && isOwnProfile && (
            <Tooltip title="Edit location">
              <IconButton
                onClick={() => setLocationEditDialog(true)}
                sx={{
                  color: main,
                  "&:hover": {
                    color: palette.primary.main,
                  },
                  width: 24,
                  height: 24,
                }}
              >
                <EditOutlined sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap="1rem">
          <DescriptionOutlined fontSize="large" sx={{ color: main }} />
          <Typography color={medium} sx={{ 
            fontStyle: "italic",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {bio || "No bio yet"}
          </Typography>
          {allowProfileEdits && isOwnProfile && (
            <Tooltip title="Edit bio">
              <IconButton
                onClick={() => setBioEditDialog(true)}
                sx={{
                  color: main,
                  "&:hover": {
                    color: palette.primary.main,
                  },
                  width: 24,
                  height: 24,
                }}
              >
                <EditOutlined sx={{ fontSize: "1rem" }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Profile Picture Change Dialog */}
      <ChangeProfilePictureDialog
        open={profilePictureDialog}
        onClose={() => setProfilePictureDialog(false)}
        currentPicture={user?.picturePath}
        userId={userId}
      />

      {/* Bio Edit Dialog */}
      <BioEditDialog
        open={bioEditDialog}
        onClose={() => setBioEditDialog(false)}
        currentBio={user?.bio}
        userId={userId}
      />

      {/* Location Edit Dialog */}
      <LocationEditDialog
        open={locationEditDialog}
        onClose={() => setLocationEditDialog(false)}
        currentLocation={user?.location}
        userId={userId}
      />
    </WidgetWrapper>
  );
};

export default UserWidget;
