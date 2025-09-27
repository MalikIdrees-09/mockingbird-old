import { Box, Typography, useTheme } from "@mui/material";

const Footer = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.alt,
        padding: "1rem 6%",
        borderTop: `1px solid ${theme.palette.divider}`,
        textAlign: "center",
        mt: "auto",
      }}
    >
      <Typography variant="body2" color="text.secondary">
         
      </Typography>
    </Box>
  );
};

export default Footer;
