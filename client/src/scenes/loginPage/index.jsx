import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Form from "./Form";

const LoginPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
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
        p="1rem 6%"
        textAlign="center"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 1,
          }}
        >
          <img
            src="/assets/logo.png"
            alt="Logo"
            style={{
              height: "130px",
              width: "auto",
            }}
          />
        </Box>
      </Box>

      <Box
        width={isNonMobileScreens ? "50%" : "93%"}
        p="2rem"
        m="2rem auto"
        borderRadius="1.5rem"
        backgroundColor={theme.palette.background.alt}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            mb: "1rem",
            fontFamily: "Playfair Display, serif",
            fontWeight: 600,
            color: theme.palette.secondary.main,
            textAlign: "center",
          }}
        >
          Welcome, New User!        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: "2rem",
            fontFamily: "Lora, serif",
            color: theme.palette.text.secondary,
            textAlign: "center",
            fontStyle: "italic",
            lineHeight: 1.8,
          }}
        >
"The one thing that doesn't abide by majority rule is a person's conscience"        </Typography>
        <Form />
      </Box>
    </Box>
  );
};

export default LoginPage;
