import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  useTheme,
  Chip,
  Divider,
} from "@mui/material";
import {
  Dashboard,
  People,
  Article,
  Security,
  TrendingUp,
  Warning,
  Block,
} from "@mui/icons-material";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import WidgetWrapper from "components/WidgetWrapper";

const AdminDashboard = ({ userId, activeTab, setActiveTab, showStats = false }) => {
  const { palette } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const token = useSelector((state) => state.token);

  const getDashboardData = useCallback(async () => {
    try {
      console.log("🔄 Fetching dashboard data...");
      console.log("🔑 Token available:", !!token);
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      const response = await fetch(`https://mockingbird-backend.idrees.inadmin/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("📊 Dashboard data received:", data);
      
      // Ensure data has the expected structure
      const safeData = {
        stats: data.stats || {
          totalUsers: 0,
          totalPosts: 0,
          bannedUsers: 0,
          deletedPosts: 0
        },
        recentUsers: data.recentUsers || [],
        recentPosts: data.recentPosts || []
      };
      
      setDashboardData(safeData);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      // Set fallback data to prevent crashes
      setDashboardData({
        stats: {
          totalUsers: 0,
          totalPosts: 0,
          bannedUsers: 0,
          deletedPosts: 0
        },
        recentUsers: [],
        recentPosts: []
      });
    }
  }, [token]);

  useEffect(() => {
    if (showStats) {
      getDashboardData();
    }
  }, [showStats, getDashboardData]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <Dashboard /> },
    { id: "users", label: "User Management", icon: <People /> },
    { id: "posts", label: "Post Management", icon: <Article /> },
    { id: "profanity", label: "Profanity Logs", icon: <Block /> },
  ];

  if (!showStats) {
    return (
      <WidgetWrapper>
        <Typography
          variant="h5"
          sx={{ 
            mb: 2, 
            color: palette.secondary.main,
            fontFamily: "Playfair Display, serif",
            fontWeight: 700,
          }}
        >
          <Security sx={{ mr: 1, verticalAlign: "middle" }} />
          Admin Panel
        </Typography>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => setActiveTab(item.id)}
                selected={activeTab === item.id}
                sx={{
                  borderRadius: "12px",
                  mb: 1,
                  "&.Mui-selected": {
                    backgroundColor: palette.primary.light,
                    color: palette.primary.main,
                    "&:hover": {
                      backgroundColor: palette.primary.light,
                    },
                  },
                }}
              >
                <Box sx={{ mr: 2, color: "inherit" }}>{item.icon}</Box>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </WidgetWrapper>
    );
  }

  if (!dashboardData) {
    return (
      <WidgetWrapper>
        <Typography>Loading dashboard data...</Typography>
      </WidgetWrapper>
    );
  }

  const { stats, recentUsers, recentPosts } = dashboardData;

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.primary.main}, ${palette.primary.dark})`,
              color: "white",
              borderRadius: "16px",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Users
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.secondary.main}, ${palette.secondary.dark})`,
              color: "white",
              borderRadius: "16px",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalPosts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Active Posts
                  </Typography>
                </Box>
                <Article sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.accent.main}, ${palette.accent.dark})`,
              color: "white",
              borderRadius: "16px",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.bannedUsers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Banned Users
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.neutral.main}, ${palette.neutral.dark})`,
              color: "white",
              borderRadius: "16px",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.deletedPosts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Deleted Posts
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <WidgetWrapper>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
              Recent Users
            </Typography>
            <List>
              {recentUsers.map((user, index) => (
                <Box key={user._id}>
                  <ListItem>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    {user.isBanned && (
                      <Chip
                        label="Banned"
                        color="error"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItem>
                  {index < recentUsers.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </WidgetWrapper>
        </Grid>

        <Grid item xs={12} md={6}>
          <WidgetWrapper>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
              Recent Posts
            </Typography>
            <List>
              {recentPosts.map((post, index) => (
                <Box key={post._id}>
                  <ListItem>
                    <ListItemText
                      primary={`${post.firstName} ${post.lastName}`}
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "300px",
                            }}
                          >
                            {post.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentPosts.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </WidgetWrapper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
