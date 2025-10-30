import { Chip } from "@mui/material";
import { Verified } from "@mui/icons-material";

const NewsBadge = ({ size = "small", sx = {} }) => {
  return (
    <Chip
      icon={<Verified sx={{ fontSize: "0.9rem !important" }} />}
      size={size}
      sx={{
        ml: 0.5,
        height: size === "small" ? "20px" : "24px",
        minWidth: size === "small" ? "20px" : "24px",
        px: 0,
        background: "linear-gradient(45deg, #2e7d32 30%, #43a047 90%)",
        color: "white",
        border: "1px solid #2e7d32",
        boxShadow: "0 2px 4px rgba(46, 125, 50, 0.25)",
        "& .MuiChip-icon": {
          color: "white",
          m: 0,
        },
        "& .MuiChip-label": {
          display: "none",
          p: 0,
        },
        ...sx,
      }}
    />
  );
};

export default NewsBadge;


