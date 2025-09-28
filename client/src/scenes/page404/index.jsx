import { Box, Typography, Button, useTheme, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import { useState } from "react";

const Page404 = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const neutralMain = palette.neutral.main;
  const primaryMain = palette.primary.main;
  const [showGame, setShowGame] = useState(false);

  return (
    <Box
      width="100%"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: palette.background.default,
        color: neutralMain,
      }}
    >
      <FlexBetween flexDirection="column" gap="2rem">
        <Box textAlign="center">
          <Typography
            variant="h1"
            sx={{
              fontSize: "8rem",
              fontWeight: "bold",
              color: primaryMain,
              mb: 2,
            }}
          >
            404
          </Typography>
          <Typography
            variant="h4"
            sx={{
              mb: 2,
              color: neutralMain,
            }}
          >
            Page Not Found
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              color: palette.neutral.medium,
              maxWidth: "400px",
            }}
          >
            The page you're looking for doesn't exist or has been moved.
          </Typography>
        </Box>

        <Box display="flex" gap="1rem">
          <Button
            variant="contained"
            onClick={() => navigate("/home")}
            sx={{
              backgroundColor: primaryMain,
              "&:hover": {
                backgroundColor: palette.primary.dark,
              },
            }}
          >
            Go to Home
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            sx={{
              borderColor: primaryMain,
              color: primaryMain,
              "&:hover": {
                borderColor: palette.primary.dark,
                color: palette.primary.dark,
              },
            }}
          >
            Go Back
          </Button>
        </Box>

        {!showGame ? (
          <Box textAlign="center" mt={4}>
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                color: neutralMain,
              }}
            >
       
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowGame(true)}
              sx={{
                backgroundColor: palette.secondary.main,
                color: "white",
                fontSize: "1.1rem",
                padding: "12px 24px",
                "&:hover": {
                  backgroundColor: palette.secondary.dark,
                  transform: "scale(1.05)",
                },
                transition: "all 0.2s ease",
                borderRadius: "25px",
              }}
            >
              Play a game?
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
              backgroundColor: "rgba(0,0,0,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton
              onClick={() => setShowGame(false)}
              sx={{
                position: "absolute",
                top: 20,
                right: 20,
                zIndex: 10000,
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.3)",
                },
                width: 48,
                height: 48,
              }}
            >
              <Close />
            </IconButton>
            <Box
              sx={{
                width: "100%",
                height: "100%",
                maxWidth: "100vw",
                maxHeight: "100vh",
                borderRadius: 0,
                overflow: "hidden",
              }}
            >
              <iframe
                src="https://mockingbird-the-game.idrees.in/mockingbird_game.html"
                title="Mockingbird Game"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                style={{
                  border: "none",
                }}
              />
            </Box>
          </Box>
        )}
      </FlexBetween>
    </Box>
  );
};

export default Page404;
