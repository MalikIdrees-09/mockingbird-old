import { useState } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Typography,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search,
  DarkMode,
  LightMode,
  Menu,
  Close,
  AdminPanelSettings,
  Chat,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { alpha } from "@mui/material/styles";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import NotificationBell from "components/NotificationBell";

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const isAdmin = user && (user.isAdmin || user._id === "idrees");

  const theme = useTheme();
  const neutralLight = theme.palette.neutral.light;
  const dark = theme.palette.neutral.dark;
  const background = theme.palette.background.default;
  const alt = theme.palette.background.alt;
  const uiTheme = useSelector((state) => state.uiTheme);
  const isCustomTheme = !!uiTheme?.backgroundType; // only when user set image/gradient
  const isDarkMode = theme.palette.mode === "dark";
  const navBackground = isCustomTheme
    ? (isDarkMode ? alpha('#050812', 0.88) : alpha('#ffffff', 0.9))
    : (isDarkMode ? (theme.palette.background.subtle || theme.palette.background.alt || alt) : alt);
  const navBorderColor = isCustomTheme
    ? alpha('#000', isDarkMode ? 0.45 : 0.12)
    : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
  const navShadow = isCustomTheme
    ? 'none'
    : (isDarkMode ? '0 12px 32px rgba(5, 8, 20, 0.45)' : '0 8px 20px rgba(0, 0, 0, 0.08)');
  const navBackdrop = (isCustomTheme || isDarkMode) ? 'saturate(180%) blur(16px)' : 'none';

  const fullName = user.firstName;

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchExpanded(false); // Collapse after search
      setSearchQuery(""); // Clear search
    }
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSearchExpansion = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // Focus will be handled by autoFocus when expanded
    } else {
      setSearchQuery(""); // Clear search when collapsing
    }
  };

  if (!isNonMobileScreens) return null; // hide navbar on mobile

  return (
    <FlexBetween
      padding="1rem 6%"
      sx={{
        backgroundColor: navBackground,
        backdropFilter: navBackdrop,
        WebkitBackdropFilter: navBackdrop,
        borderBottom: `1px solid ${navBorderColor}`,
        boxShadow: navShadow,
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <FlexBetween gap="1.75rem">
        <Box
          onClick={() => navigate("/home")}
          sx={{
            cursor: "pointer",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.02)",
              filter: "brightness(1.1)",
            },
          }}
        >
          <img
            src="/assets/logo.png"
            alt="Logo"
            style={{
              height: "65px",
              width: "auto",
            }}
          />
        </Box>
        {isNonMobileScreens && (
          <FlexBetween
            backgroundColor={theme.palette.mode === 'dark' ? 'rgba(30, 36, 48, 0.9)' : neutralLight}
            borderRadius="9px"
            gap="1.1rem"
            padding="0.2rem 1rem"
            sx={{
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(5, 8, 20, 0.3)'
                : 'none',
              border: theme.palette.mode === 'dark'
                ? '1px solid rgba(120, 130, 155, 0.2)'
                : 'none',
              minWidth: '220px',
              maxWidth: '320px',
            }}
          >
            <InputBase 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              sx={{
                fontSize: '0.95rem',
                width: '100%',
                '& input': {
                  padding: '0.2rem 0',
                }
              }}
            />
            <IconButton onClick={handleSearch} size="small" sx={{
              p: 0.5,
              color: theme.palette.neutral.main,
            }}>
              <Search sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </FlexBetween>
        )}
      </FlexBetween>

      {/* DESKTOP NAV */}
      {isNonMobileScreens ? (
        <FlexBetween gap="2rem">
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <DarkMode sx={{ fontSize: "25px" }} />
            ) : (
              <LightMode sx={{ color: dark, fontSize: "25px" }} />
            )}
          </IconButton>
          <NotificationBell />
          <IconButton onClick={() => navigate("/chat")}>
            <Chat sx={{ fontSize: "25px" }} />
          </IconButton>
          {isAdmin && (
            <IconButton onClick={() => navigate("/admin")}>
              <AdminPanelSettings 
                sx={{ 
                  fontSize: "25px", 
                  color: theme.palette.secondary.main 
                }} 
              />
            </IconButton>
          )}
          <FormControl variant="standard" value={fullName}>
            <Select
              value={fullName}
              sx={{
                backgroundColor: neutralLight,
                width: "150px",
                borderRadius: "0.25rem",
                p: "0.25rem 1rem",
                
                "& .MuiSelect-select:focus": {
                  backgroundColor: neutralLight,
                },
              }}
              input={<InputBase />}
            >
              <MenuItem value={fullName}>
                <Typography>{fullName}</Typography>
              </MenuItem>
              <MenuItem onClick={() => navigate("/settings")}>Settings</MenuItem>
              <MenuItem onClick={() => dispatch(setLogout())}>Log Out</MenuItem>
            </Select>
          </FormControl>
        </FlexBetween>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
          {isSearchExpanded ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: neutralLight,
                borderRadius: "20px",
                padding: "0.25rem 0.75rem",
                width: "200px",
                animation: "expand 0.3s ease-out",
                "@keyframes expand": {
                  from: { width: "40px" },
                  to: { width: "200px" },
                },
              }}
            >
              <InputBase
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                autoFocus
                sx={{
                  flex: 1,
                  fontSize: "0.875rem",
                  "& input::placeholder": {
                    fontSize: "0.875rem",
                  },
                }}
              />
              <IconButton onClick={handleSearch} size="small">
                <Search sx={{ fontSize: "18px" }} />
              </IconButton>
              <IconButton onClick={toggleSearchExpansion} size="small">
                <Close sx={{ fontSize: "18px" }} />
              </IconButton>
            </Box>
          ) : (
            <IconButton onClick={toggleSearchExpansion}>
              <Search sx={{ fontSize: "20px", color: dark }} />
            </IconButton>
          )}
          <IconButton
            onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
          >
            <Menu />
          </IconButton>
          <IconButton onClick={() => navigate("/chat")}>
            <Chat sx={{ fontSize: "20px", color: dark }} />
          </IconButton>
        </Box>
      )}

      {/* MOBILE NAV */}
      {!isNonMobileScreens && isMobileMenuToggled && (
        <Box
          position="fixed"
          right="0"
          bottom="0"
          height="100%"
          zIndex="10"
          maxWidth="500px"
          minWidth="300px"
          sx={{
            backgroundColor: navBackground,
            backdropFilter: navBackdrop,
            WebkitBackdropFilter: navBackdrop,
            borderLeft: `1px solid ${navBorderColor}`,
            boxShadow: navShadow,
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {/* CLOSE ICON */}
          <Box display="flex" justifyContent="flex-end" p="1rem">
            <IconButton
              onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
            >
              <Close />
            </IconButton>
          </Box>

          {/* MENU ITEMS */}
          <FlexBetween
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            gap="3rem"
          >
            <IconButton
              onClick={() => dispatch(setMode())}
              sx={{ fontSize: "25px" }}
            >
              {theme.palette.mode === "dark" ? (
                <DarkMode sx={{ fontSize: "25px" }} />
              ) : (
                <LightMode sx={{ color: dark, fontSize: "25px" }} />
              )}
            </IconButton>
            <NotificationBell />
            <IconButton onClick={() => navigate("/chat")}> 
              <Chat sx={{ fontSize: "25px" }} />
            </IconButton>
            {isAdmin && (
              <IconButton onClick={() => navigate("/admin")}>
                <AdminPanelSettings 
                  sx={{ 
                    fontSize: "25px", 
                    color: theme.palette.secondary.main 
                  }} 
                />
              </IconButton>
            )}
            <FormControl variant="standard" value={fullName}>
              <Select
                value={fullName}
                sx={{
                  backgroundColor: neutralLight,
                  width: "150px",
                  borderRadius: "0.25rem",
                  p: "0.25rem 1rem",
                  "& .MuiSvgIcon-root": {
                    pr: "0.25rem",
                    width: "3rem",
                  },
                  "& .MuiSelect-select:focus": {
                    backgroundColor: neutralLight,
                  },
                }}
                input={<InputBase />}
              >
                <MenuItem value={fullName}>
                  <Typography>{fullName}</Typography>
                </MenuItem>
                <MenuItem onClick={() => navigate("/settings")}>Settings</MenuItem>
                <MenuItem onClick={() => dispatch(setLogout())}>
                  Log Out
                </MenuItem>
              </Select>
            </FormControl>
          </FlexBetween>
        </Box>
      )}
    </FlexBetween>
  );
};

export default Navbar;
