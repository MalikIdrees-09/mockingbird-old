// Mockingbird - NY Times Inspired Color Palette
export const colorTokens = {
  grey: {
    0: "#FFFFFF",
    10: "#FEFEFE", 
    50: "#F8F8F8",
    100: "#F0F0F0",
    200: "#E8E8E8",
    300: "#D0D0D0",
    400: "#A8A8A8",
    500: "#808080",
    600: "#606060",
    700: "#404040",
    800: "#2A2A2A",
    900: "#1A1A1A",
    1000: "#000000",
  },
  // Southern Gold - warm, aged brass like courthouse fixtures
  primary: {
    50: "#FFFEF7",
    100: "#FFF8E1",
    200: "#FFECB3",
    300: "#FFE082",
    400: "#FFD54F",
    500: "#DAA520", // Goldenrod - warm Southern brass
    600: "#B8941F",
    700: "#8B6914",
    800: "#6B5B10",
    900: "#4A3F0B",
  },
  // Deep Burgundy - like old courthouse brick and autumn leaves
  secondary: {
    50: "#FFF8F8",
    100: "#FFEBEB",
    200: "#FFD6D6",
    300: "#FFB3B3",
    400: "#FF8A8A",
    500: "#A0522D", // Sienna - earthy Southern red
    600: "#8B4513",
    700: "#6B3410",
    800: "#4A240B",
    900: "#2F1707",
  },
  // Autumn accent colors - like Southern oak leaves
  accent: {
    50: "#FFF8F0",
    100: "#FFEFDB",
    200: "#FFDDB3",
    300: "#FFCA85",
    400: "#FFB84D",
    500: "#D2691E", // Chocolate - warm autumn orange
    600: "#B8651F",
    700: "#9E5A1A",
    800: "#844F15",
    900: "#6A4410",
  },
  // Classic newspaper colors
  newsprint: {
    50: "#FEFEFE",
    100: "#F7F7F7",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#424242",
    800: "#212121",
    900: "#0D0D0D",
  },
};

// mui theme settings
export const themeSettings = (mode) => {
  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            // Dark Mode - Elegant Evening Edition
            primary: {
              dark: colorTokens.primary[300],
              main: colorTokens.primary[500],
              light: colorTokens.primary[700],
            },
            secondary: {
              dark: colorTokens.secondary[300],
              main: colorTokens.secondary[500],
              light: colorTokens.secondary[700],
            },
            accent: {
              dark: colorTokens.accent[300],
              main: colorTokens.accent[500],
              light: colorTokens.accent[700],
            },
            neutral: {
              dark: colorTokens.newsprint[100],
              main: colorTokens.newsprint[300],
              mediumMain: colorTokens.newsprint[400],
              medium: colorTokens.newsprint[500],
              light: colorTokens.newsprint[700],
            },
            background: {
              default: colorTokens.newsprint[900],
              alt: colorTokens.newsprint[800],
              paper: colorTokens.newsprint[800],
            },
            text: {
              primary: colorTokens.newsprint[100],
              secondary: colorTokens.newsprint[300],
            },
          }
        : {
            // Light Mode - Classic Morning Edition
            primary: {
              dark: colorTokens.primary[700],
              main: colorTokens.primary[500],
              light: colorTokens.primary[200],
            },
            secondary: {
              dark: colorTokens.secondary[700],
              main: colorTokens.secondary[500],
              light: colorTokens.secondary[200],
            },
            accent: {
              dark: colorTokens.accent[700],
              main: colorTokens.accent[500],
              light: colorTokens.accent[200],
            },
            neutral: {
              dark: colorTokens.newsprint[800],
              main: colorTokens.newsprint[600],
              mediumMain: colorTokens.newsprint[500],
              medium: colorTokens.newsprint[400],
              light: colorTokens.newsprint[100],
            },
            background: {
              default: colorTokens.newsprint[50],
              alt: colorTokens.newsprint[0],
              paper: "#FFFFFF",
            },
            text: {
              primary: colorTokens.newsprint[900],
              secondary: colorTokens.newsprint[700],
            },
          }),
    },
    typography: {
      // Classic newspaper typography with serif fonts
      fontFamily: ["Playfair Display", "Times New Roman", "Georgia", "serif"].join(","),
      fontSize: 16,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      
      // Headlines - Bold serif for impact
      h1: {
        fontFamily: ["Playfair Display", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "3rem",
        fontWeight: 900,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        textTransform: "none",
        "@media (max-width:600px)": {
          fontSize: "2.25rem",
          lineHeight: 1.2,
        },
        "@media (max-width:400px)": {
          fontSize: "1.875rem",
          lineHeight: 1.3,
        },
      },
      h2: {
        fontFamily: ["Playfair Display", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "2.25rem",
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
        "@media (max-width:600px)": {
          fontSize: "1.75rem",
          lineHeight: 1.3,
        },
        "@media (max-width:400px)": {
          fontSize: "1.5rem",
          lineHeight: 1.4,
        },
      },
      h3: {
        fontFamily: ["Playfair Display", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "1.875rem",
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: "0em",
        "@media (max-width:600px)": {
          fontSize: "1.5rem",
          lineHeight: 1.4,
        },
        "@media (max-width:400px)": {
          fontSize: "1.25rem",
          lineHeight: 1.5,
        },
      },
      h4: {
        fontFamily: ["Playfair Display", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "1.5rem",
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: "0.01em",
        "@media (max-width:600px)": {
          fontSize: "1.25rem",
          lineHeight: 1.5,
        },
        "@media (max-width:400px)": {
          fontSize: "1.125rem",
          lineHeight: 1.6,
        },
      },
      h5: {
        fontFamily: ["Lora", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "1.25rem",
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: "0em",
        "@media (max-width:600px)": {
          fontSize: "1.125rem",
          lineHeight: 1.6,
        },
        "@media (max-width:400px)": {
          fontSize: "1rem",
          lineHeight: 1.6,
        },
      },
      h6: {
        fontFamily: ["Lora", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "1.125rem",
        fontWeight: 500,
        lineHeight: 1.6,
        letterSpacing: "0.01em",
        "@media (max-width:600px)": {
          fontSize: "1rem",
          lineHeight: 1.6,
        },
        "@media (max-width:400px)": {
          fontSize: "0.9rem",
          lineHeight: 1.6,
        },
      },
      
      // Body text - Readable serif
      body1: {
        fontFamily: ["Lora", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "1rem",
        lineHeight: 1.6,
        letterSpacing: "0.01em",
        "@media (max-width:600px)": {
          fontSize: "0.95rem",
          lineHeight: 1.7,
        },
        "@media (max-width:400px)": {
          fontSize: "0.9rem",
          lineHeight: 1.7,
        },
      },
      body2: {
        fontFamily: ["Lora", "Times New Roman", "Georgia", "serif"].join(","),
        fontSize: "0.875rem",
        lineHeight: 1.5,
        letterSpacing: "0.01em",
        "@media (max-width:600px)": {
          fontSize: "0.85rem",
          lineHeight: 1.6,
        },
        "@media (max-width:400px)": {
          fontSize: "0.8rem",
          lineHeight: 1.6,
        },
      },
      
      // UI elements - Clean sans-serif for contrast
      button: {
        fontFamily: ["Source Sans Pro", "Arial", "sans-serif"].join(","),
        fontWeight: 600,
        fontSize: "0.875rem",
        lineHeight: 1.75,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        "@media (max-width:600px)": {
          fontSize: "0.8rem",
          letterSpacing: "0.03em",
        },
        "@media (max-width:400px)": {
          fontSize: "0.75rem",
          letterSpacing: "0.02em",
        },
      },
      caption: {
        fontFamily: ["Source Sans Pro", "Arial", "sans-serif"].join(","),
        fontSize: "0.75rem",
        lineHeight: 1.4,
        letterSpacing: "0.03em",
        fontStyle: "italic",
        "@media (max-width:600px)": {
          fontSize: "0.7rem",
          lineHeight: 1.5,
        },
        "@media (max-width:400px)": {
          fontSize: "0.65rem",
          lineHeight: 1.5,
        },
      },
    },
    components: {
      // Elegant button styling
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: "4px",
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
            padding: "12px 24px",
            minHeight: "44px", // Ensure minimum touch target size
            "@media (max-width:600px)": {
              padding: "10px 20px",
              minHeight: "44px",
              fontSize: "0.8rem",
            },
            "@media (max-width:400px)": {
              padding: "8px 16px",
              minHeight: "44px",
              fontSize: "0.75rem",
            },
            boxShadow: theme.palette.mode === "dark"
              ? "0 2px 8px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.1)",
            border: "2px solid transparent",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              boxShadow: theme.palette.mode === "dark"
                ? "0 4px 16px rgba(0,0,0,0.4)"
                : "0 4px 16px rgba(0,0,0,0.12)",
              transform: "translateY(-1px)",
            },
          }),
          contained: ({ theme }) => ({
            "&:hover": {
              boxShadow: theme.palette.mode === "dark"
                ? "0 6px 20px rgba(0,0,0,0.4)"
                : "0 6px 20px rgba(0,0,0,0.15)",
            },
          }),
          outlined: ({ theme }) => ({
            borderWidth: "2px",
            "&:hover": {
              borderWidth: "2px",
              backgroundColor: theme.palette.mode === "dark"
                ? "rgba(218, 165, 32, 0.1)"
                : "rgba(0,0,0,0.04)",
            },
          }),
        },
      },
      
      // Classic card styling
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: "8px",
            boxShadow: theme.palette.mode === "dark"
              ? "0 2px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.1)",
            border: theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(0,0,0,0.08)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              boxShadow: theme.palette.mode === "dark"
                ? "0 8px 24px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)"
                : "0 8px 24px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.12)",
              transform: "translateY(-2px)",
            },
          }),
        },
      },
      
      // Refined input styling
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiOutlinedInput-root": {
              borderRadius: "6px",
              backgroundColor: theme.palette.mode === "dark" 
                ? theme.palette.background.alt 
                : "rgba(255,255,255,0.8)",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: theme.palette.mode === "dark"
                  ? theme.palette.background.paper
                  : "rgba(255,255,255,0.9)",
              },
              "&.Mui-focused": {
                backgroundColor: theme.palette.mode === "dark"
                  ? theme.palette.background.paper
                  : "#ffffff",
                boxShadow: theme.palette.mode === "dark"
                  ? `0 0 0 3px ${theme.palette.primary.main}30`
                  : "0 0 0 3px rgba(184, 134, 11, 0.1)",
              },
            },
          }),
        },
      },
      
      // Typography enhancements
      MuiTypography: {
        styleOverrides: {
          h1: {
            background: `linear-gradient(45deg, #DAA520, #A0522D)`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "none",
          },
          h2: {
            color: "#A0522D",
          },
        },
      },
      
      // Paper styling for elegant backgrounds
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: "none",
            borderRadius: "8px",
            backgroundColor: theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : undefined,
          }),
          elevation1: {
            boxShadow: ({ theme }) => theme.palette.mode === "dark"
              ? "0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)"
              : "0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
          },
          elevation2: {
            boxShadow: ({ theme }) => theme.palette.mode === "dark"
              ? "0 4px 12px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)"
              : "0 4px 12px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.08)",
          },
        },
      },
      
      // Icon button touch targets for mobile
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: "44px",
            minHeight: "44px",
            padding: "12px",
            "@media (max-width:600px)": {
              minWidth: "44px",
              minHeight: "44px",
              padding: "10px",
            },
            "@media (max-width:400px)": {
              minWidth: "44px",
              minHeight: "44px",
              padding: "8px",
            },
          },
        },
      },
    },
  };
};
