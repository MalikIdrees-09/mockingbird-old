import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { API_BASE_URL } from "../utils/api";

const UserImage = ({ image, size = "60px", name = "" }) => {
  const [profilePictureKey, setProfilePictureKey] = useState(Date.now());
  const [loadError, setLoadError] = useState(false);

  // Listen for profile picture updates
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      setProfilePictureKey(Date.now());
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  useEffect(() => {
    setLoadError(false);
  }, [image, profilePictureKey]);

  let imageUrl = null;
  if (image) {
    const isAbsolute = /^https?:\/\//i.test(image);
    if (isAbsolute) {
      imageUrl = `${image}${image.includes('?') ? '&' : '?'}v=${profilePictureKey}`;
    } else if (image.startsWith('/assets/')) {
      const base = API_BASE_URL.replace(/\/$/, '');
      imageUrl = `${base}${image}${image.includes('?') ? '&' : '?'}v=${profilePictureKey}`;
    } else {
      imageUrl = `${API_BASE_URL}/assets/${image}?v=${profilePictureKey}`;
    }
  }

  const resolvedLabel = imageUrl || image || "(no image)";

  const initials = (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .trim();
  const fallbackLabel = initials || "?";

  return (
    <Box
      width={size}
      height={size}
      sx={{
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title={`${loadError ? "Failed to load" : "Resolved URL"}: ${resolvedLabel}`}
    >
      {!loadError && imageUrl ? (
        <img
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
          alt={name || "user"}
          src={imageUrl}
          onError={(event) => {
            setLoadError(true);
            console.warn("Failed to load profile image", {
              name,
              attemptedSrc: event?.target?.src,
              rawValue: image,
            });
          }}
        />
      ) : (
        <span
          style={{
            fontSize: "calc(0.4 * " + size + ")",
            color: "#555",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {fallbackLabel}
        </span>
      )}
    </Box>
  );
};

export default UserImage;
