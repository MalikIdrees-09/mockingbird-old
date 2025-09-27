import React, { useEffect } from "react";
import { Box } from "@mui/material";

const SplashScreen = ({ onVideoEnd }) => {
  useEffect(() => {
    const timer = setTimeout(onVideoEnd, 10000); // Fallback after 10 seconds
    return () => clearTimeout(timer);
  }, [onVideoEnd]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
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
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
        }}
        src="/assets/splashscreen.mp4"
      />
    </Box>
  );
};

export default SplashScreen;
