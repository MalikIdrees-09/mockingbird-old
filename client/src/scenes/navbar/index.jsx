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
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
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

  return (
    <FlexBetween padding="1rem 6%" backgroundColor={alt}>
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
            backgroundColor={neutralLight}
            borderRadius="9px"
            gap="3rem"
            padding="0.1rem 1.5rem"
          >
            <InputBase 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <IconButton onClick={handleSearch}>
              <Search />
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
          backgroundColor={background}
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
