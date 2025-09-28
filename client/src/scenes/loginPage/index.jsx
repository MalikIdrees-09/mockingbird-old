import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Form from "./Form";

const LoginPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const isMobile = useMediaQuery("(max-width: 600px)");
  const isAuth = Boolean(useSelector((state) => state.token));
  const navigate = useNavigate();

  // Redirect authenticated users to home page
  useEffect(() => {
    if (isAuth) {
      navigate("/home");
    }
  }, [isAuth, navigate]);

  return (
    <Box>
      <Box
        width="100%"
        backgroundColor={theme.palette.background.alt}
        p={isMobile ? "0.5rem 3%" : "1rem 6%"}
        textAlign="center"
        minHeight={isMobile ? "80px" : "auto"}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: isMobile ? 0.5 : 1,
          }}
        >
          <img
            src="/assets/logo.png"
            alt="Logo"
            style={{
              height: isMobile ? "60px" : "130px",
              width: "auto",
              maxWidth: "100%",
            }}
          />
        </Box>
      </Box>

      <Box
        width={isNonMobileScreens ? "50%" : isMobile ? "97%" : "93%"}
        p={isMobile ? "1rem" : "2rem"}
        m={isMobile ? "0.5rem auto" : "2rem auto"}
        borderRadius={isMobile ? "1rem" : "1.5rem"}
        backgroundColor={theme.palette.background.alt}
        maxWidth={isMobile ? "none" : "600px"}
      >
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          sx={{ 
            mb: isMobile ? "0.75rem" : "1rem",
            fontFamily: "Playfair Display, serif",
            fontWeight: 600,
            color: theme.palette.secondary.main,
            textAlign: "center",
            fontSize: isMobile ? "1.25rem" : "2.125rem",
          }}
        >
          Welcome, New User!
        </Typography>
        <Typography 
          variant={isMobile ? "body2" : "body1"} 
          sx={{ 
            mb: isMobile ? "1.5rem" : "2rem",
            fontFamily: "Lora, serif",
            color: theme.palette.text.secondary,
            textAlign: "center",
            fontStyle: "italic",
            lineHeight: 1.8,
            fontSize: isMobile ? "0.875rem" : "1rem",
            px: isMobile ? 1 : 0,
          }}
        >
"The one thing that doesn't abide by majority rule is a person's conscience"
        </Typography>
        <Form />
      </Box>
    </Box>
  );
};

export default LoginPage;
