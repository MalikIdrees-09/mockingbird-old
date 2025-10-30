import { Chip } from "@mui/material";
import { Verified } from "@mui/icons-material";

const VerifiedBadge = ({ size = "small", sx = {} }) => {
  return (
    <Chip
      icon={<Verified sx={{ fontSize: "0.8rem !important" }} />}
      label="Verified"
      size={size}
      sx={{
        ml: 0.5,
        height: size === "small" ? "20px" : "24px",
        fontSize: size === "small" ? "0.65rem" : "0.75rem",
        fontWeight: "bold",
        background: "linear-gradient(45deg,rgb(3, 254, 158) 30%, #42a5f5 90%)",
        color: "white",
        border: "1px solidrgb(0, 249, 116)",
        boxShadow: "0 2px 4px rgba(29, 161, 242, 0.2)",
        "& .MuiChip-icon": {
          color: "white",
          marginLeft: "4px",
        },
        "& .MuiChip-label": {
          paddingLeft: "2px",
          paddingRight: "6px",
        },
        ...sx,
      }}
    />
  );
};

export default VerifiedBadge;
