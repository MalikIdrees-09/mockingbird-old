import { Box, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Navbar from "scenes/navbar";
import Footer from "components/Footer";
import UserWidget from "scenes/widgets/UserWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import CombinedFriendsWidget from "scenes/widgets/CombinedFriendsWidget";

const HomePage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const isMobile = useMediaQuery("(max-width: 600px)");
  const { _id, picturePath } = useSelector((state) => state.user);
  const theme = useSelector((state) => state.theme);

  // Force re-render when profile picture updates
  const [profilePictureKey, setProfilePictureKey] = useState(Date.now());

  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setProfilePictureKey(Date.now());
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column", 
      minHeight: "100vh"
    }}>
      <Navbar />
      <Box
        width="100%"
        padding={isMobile ? "1rem 2%" : "2rem 6%"}
        display={isNonMobileScreens ? "flex" : "block"}
        justifyContent={isNonMobileScreens ? "flex-start" : "initial"}
        flex={1}
        gap={2}
      >
        {/* Far-left panel (user + friends) */}
        <Box flexBasis={isNonMobileScreens ? "28%" : undefined}>
          <UserWidget 
            userId={_id} 
            picturePath={picturePath} 
            allowProfileEdits={true} 
            key={`user-widget-${profilePictureKey}`} 
          />
          <Box m={isMobile ? "1.5rem 0" : "2rem 0"} />
          {isNonMobileScreens && (
            <CombinedFriendsWidget userId={_id} />
          )}
        </Box>
        {/* Center posts column */}
        <Box
          flexBasis={isNonMobileScreens ? "44%" : undefined}
          mt={isNonMobileScreens ? undefined : isMobile ? "1rem" : "2rem"}
          sx={{ ml: { xs: 0, md: 2 }, mr: { xs: 0, md: 'auto' }, width: '100%', maxWidth: { xs: '100%', md: 760 } }}
        >
          <MyPostWidget 
            picturePath={picturePath} 
            key={`my-post-${profilePictureKey}`} 
          />
          <Box m={isMobile ? "1.5rem 0" : "2rem 0"} />
          <PostsWidget userId={_id} />
        </Box>
        
        {/* Right column removed; friends combined on left; hidden on mobile */}
      </Box>
      <Footer />
    </Box>
  );
};

export default HomePage;
