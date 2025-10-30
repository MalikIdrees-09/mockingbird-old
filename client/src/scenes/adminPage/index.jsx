import { Box, useMediaQuery, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import Navbar from "scenes/navbar";
import AdminDashboard from "scenes/widgets/AdminDashboard";
import UserManagement from "scenes/widgets/UserManagement";
import PostManagement from "scenes/widgets/PostManagement";
import ProfanityManagement from "scenes/widgets/ProfanityManagement";
import { useState } from "react";

const AdminPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const [activeTab, setActiveTab] = useState("dashboard");
  const { _id } = useSelector((state) => state.user);

  return (
    <Box>
      <Navbar />
      
      {/* Admin Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
          py: 3,
          px: "6%",
          borderBottom: `3px solid ${theme.palette.secondary.main}`,
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontFamily: "Playfair Display, serif",
            fontWeight: 700,
            color: theme.palette.secondary.main,
            textAlign: "center",
            mb: 1,
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontFamily: "Lora, serif",
            fontStyle: "italic",
            textAlign: "center",
            color: theme.palette.text.secondary,
          }}
        >
          Manage users, posts, and community content
        </Typography>
      </Box>

      <Box
        width="100%"
        sx={{ p: { xs: '1rem', md: '2rem 6%' } }}
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="space-between"
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <AdminDashboard 
            userId={_id} 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "70%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          {activeTab === "dashboard" && <AdminDashboard userId={_id} showStats />}
          {activeTab === "users" && <UserManagement userId={_id} />}
          {activeTab === "posts" && <PostManagement userId={_id} />}
          {activeTab === "profanity" && <ProfanityManagement userId={_id} />}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminPage;
