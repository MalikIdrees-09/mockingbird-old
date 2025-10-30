import { Box, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import Footer from "components/Footer";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";
import { API_BASE_URL } from "../../utils/api";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const { userId } = useParams();
  const token = useSelector((state) => state.token);
  const currentUserId = useSelector((state) => state.user._id);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");

  // Force re-render when profile picture updates
  const [profilePictureKey, setProfilePictureKey] = useState(Date.now());

  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setProfilePictureKey(Date.now());
      // Also refetch user data if this is the current user's profile
      if (userId === currentUserId) {
        getUser();
      }
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, [userId, currentUserId]);

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

  if (!user) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
        flex={1}
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <UserWidget userId={userId} picturePath={user.picturePath} key={`user-widget-${profilePictureKey}`} />
          <Box m="2rem 0" />
          <FriendListWidget userId={userId} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          {userId === currentUserId && (
            <>
              <MyPostWidget picturePath={user.picturePath} key={`my-post-${profilePictureKey}`} />
              <Box m="2rem 0" />
            </>
          )}
          <PostsWidget userId={userId} isProfile />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default ProfilePage;
