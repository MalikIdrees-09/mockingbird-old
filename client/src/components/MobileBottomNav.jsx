import { useEffect, useState } from "react";
import { BottomNavigation, BottomNavigationAction, Paper, useMediaQuery, Box } from "@mui/material";
import { Home, Search, Chat, AccountCircle } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Home", icon: <Home />, path: "/home" },
  { label: "Search", icon: <Search />, path: "/search" },
  { label: "Chat", icon: <Chat />, path: "/chat" },
  { label: "You", icon: <AccountCircle />, path: "/settings" },
];

export default function MobileBottomNav() {
  const isMobile = useMediaQuery("(max-width: 999px)");
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);

  useEffect(() => {
    const idx = navItems.findIndex(i => location.pathname.startsWith(i.path));
    setValue(idx >= 0 ? idx : 0);
  }, [location.pathname]);

  if (!isMobile) return null;
  if (location.pathname === "/") return null; // hide on login

  return (
    <>
      <Box sx={{ height: "calc(env(safe-area-inset-bottom) + 64px)" }} />
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          pb: "env(safe-area-inset-bottom)",
        }}
      >
      <BottomNavigation
        value={value}
        onChange={(e, newValue) => {
          setValue(newValue);
          const item = navItems[newValue];
          if (item) navigate(item.path);
        }}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
      </Paper>
    </>
  );
}


