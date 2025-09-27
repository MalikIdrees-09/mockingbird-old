import { Box, Typography, Button, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";

const Page404 = () => {
  const navigate = useNavigate();
  const { palette } = useTheme();
  const neutralMain = palette.neutral.main;
  const primaryMain = palette.primary.main;

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
      </FlexBetween>
    </Box>
  );
};

export default Page404;
