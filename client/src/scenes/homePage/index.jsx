import { Box, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import Footer from "components/Footer";
import UserWidget from "scenes/widgets/UserWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import FriendListWidget from "scenes/widgets/FriendListWidget";
import FriendRequestsWidget from "scenes/widgets/FriendRequestsWidget";

const HomePage = () => {
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const isMobile = useMediaQuery("(max-width: 600px)");
  const { _id, picturePath } = useSelector((state) => state.user);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar />
      <Box
        width="100%"
        padding={isMobile ? "0.5rem 2%" : "2rem 6%"}
        display={isNonMobileScreens ? "flex" : "block"}
        justifyContent="space-between"
        flex={1}
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <UserWidget userId={_id} picturePath={picturePath} allowProfileEdits={false} />
          <Box m={isMobile ? "1rem 0" : "2rem 0"} />
          <FriendRequestsWidget userId={_id} />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : isMobile ? "1rem" : "2rem"}
        >
          <MyPostWidget picturePath={picturePath} />
          <Box m={isMobile ? "1rem 0" : "2rem 0"} />
          <PostsWidget userId={_id} />
        </Box>
        {isNonMobileScreens && (
          <Box flexBasis="26%">
            <FriendListWidget userId={_id} />
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default HomePage;
