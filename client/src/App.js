import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { useMemo, useEffect, useState, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CssBaseline, ThemeProvider, CircularProgress, Box } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import { setLogout } from "./state";
import { API_BASE_URL } from "./utils/api";
import SplashScreen from "./components/SplashScreen";
import SocketProvider from "./components/Chat/SocketProvider";
import MobileBottomNav from "./components/MobileBottomNav";

// Lazy load pages for better performance
const HomePage = lazy(() => import("scenes/homePage"));
const LoginPage = lazy(() => import("scenes/loginPage"));
const ProfilePage = lazy(() => import("scenes/profilePage"));
const SettingsPage = lazy(() => import("scenes/settingsPage"));
const ChatPage = lazy(() => import("scenes/chatPage"));
const ResetPasswordPage = lazy(() => import("scenes/resetPasswordPage"));
const AdminPage = lazy(() => import("scenes/adminPage"));
const SearchPage = lazy(() => import("scenes/searchPage"));
const PostDetail = lazy(() => import("scenes/postDetail"));
const Page404 = lazy(() => import("scenes/page404"));

// Loading fallback component
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const uiTheme = useSelector((state) => state.uiTheme);
  const isAuth = Boolean(useSelector((state) => state.token));
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const isAdmin = user && (user.isAdmin || user._id === "idrees");
  const dispatch = useDispatch();
  const [showSplash, setShowSplash] = useState(() => {
    // Skip splash screen if flag is set (e.g., after comment actions)
    const skipSplash = localStorage.getItem('skipSplash') === 'true';
    if (skipSplash) {
      localStorage.removeItem('skipSplash');
      return false;
    }
    return true;
  });

  // Validate token on app startup (only after persisted data is loaded)
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const validateToken = async () => {
      // Only validate if we have both token and user (persisted data is loaded)
      if (token && user && isMounted) {
        try {
          console.log("Validating persisted token...");
          const response = await fetch(`${API_BASE_URL}/users/validate-token`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.log("Token validation failed:", response.status);
            // Only log out if it's a 401 (unauthorized), not other errors
            if (response.status === 401) {
              console.log("Token invalid, logging out user");
              dispatch(setLogout());
            }
          } else {
            console.log("Token validation successful");
          }
        } catch (error) {
          console.log("Token validation network error:", error);
          // Don't log out on network errors, just log them
        }
      }
    };

    // Run validation when token and user become available (after rehydration)
    if (token && user) {
      const timer = setTimeout(validateToken, 500); // Longer delay for stability
      return () => clearTimeout(timer);
    }

    return () => { isMounted = false; };
  }, [token, user, dispatch]); // Run when token or user changes (i.e., after rehydration)

  return (
    <div className="app">
      {showSplash ? (
        <SplashScreen onVideoEnd={() => setShowSplash(false)} />
      ) : (
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <SocketProvider>
            <CssBaseline />
            {(() => {
              // Hide themed background on login route
              const location = window.location;
              const isLogin = location?.pathname === "/";
              if (isLogin) return null;
              return (
            <Box
              sx={{
                position: 'fixed',
                inset: 0,
                zIndex: -1,
                background: uiTheme?.backgroundType === 'gradient' ? (uiTheme?.backgroundValue || 'none') : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                '&::before': uiTheme?.backgroundType === 'image' ? {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${uiTheme?.backgroundValue || ''})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: uiTheme?.blur ? `blur(${uiTheme.blur}px)` : undefined,
                } : undefined,
                '&::after': uiTheme?.backgroundType ? {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'black',
                  opacity: (uiTheme?.dim || 0) / 100,
                } : undefined,
              }}
            />);
            })()}
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route
                path="/home"
                element={isAuth ? <HomePage /> : <Navigate to="/" />}
              />
              <Route
                path="/profile/:userId"
                element={isAuth ? <ProfilePage /> : <Navigate to="/" />}
              />
              <Route
                path="/post/:postId"
                element={<PostDetail />}
              />
              <Route
                path="/settings"
                element={isAuth ? <SettingsPage /> : <Navigate to="/" />}
              />
              <Route
                path="/chat"
                element={isAuth ? <ChatPage /> : <Navigate to="/" />}
              />
              <Route
                path="/search"
                element={isAuth ? <SearchPage /> : <Navigate to="/" />}
              />
              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />
              <Route
                path="/admin"
                element={isAuth && isAdmin ? <AdminPage /> : <Navigate to="/" />}
              />
              <Route path="*" element={<Page404 />} />
            </Routes>
            </Suspense>
            </SocketProvider>
            <MobileBottomNav />
          </ThemeProvider>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
