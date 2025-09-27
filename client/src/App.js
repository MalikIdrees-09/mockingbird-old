import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "scenes/homePage";
import LoginPage from "scenes/loginPage";
import ProfilePage from "scenes/profilePage";
import SettingsPage from "scenes/settingsPage";
import ResetPasswordPage from "scenes/resetPasswordPage";
import AdminPage from "scenes/adminPage";
import SearchPage from "scenes/searchPage";
import PostDetail from "scenes/postDetail";
import Page404 from "scenes/page404";
import { useMemo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import { setLogout } from "./state";
import { API_BASE_URL } from "./utils/api";
import SplashScreen from "./components/SplashScreen";

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isAuth = Boolean(useSelector((state) => state.token));
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const isAdmin = user && (user.isAdmin || user._id === "idrees");
  const dispatch = useDispatch();
  const [showSplash, setShowSplash] = useState(true);

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
            <CssBaseline />
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
          </ThemeProvider>
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
