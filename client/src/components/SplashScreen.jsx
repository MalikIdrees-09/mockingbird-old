import React, { useEffect } from "react";
import { Box } from "@mui/material";

const SplashScreen = ({ onVideoEnd }) => {
  useEffect(() => {
    const timer = setTimeout(onVideoEnd, 10000); // Fallback after 10 seconds

    // Handle space key press to skip
    const handleKeyPress = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        onVideoEnd();
      }
    };

    // Handle touch/tap to skip on mobile
    const handleTouchStart = () => {
      onVideoEnd();
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [onVideoEnd]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "white",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        autoPlay
        muted
        onEnded={onVideoEnd}
        style={{
          width: "30vw",
          height: "16.875vw",
          objectFit: "cover",
        }}
        src="/assets/splashscreen.mp4"
      />
    </Box>
  );
};

export default SplashScreen;