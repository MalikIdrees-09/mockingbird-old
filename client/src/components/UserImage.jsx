import { useMemo, useState, useEffect } from "react";
import { Avatar } from "@mui/material";
import { API_BASE_URL } from "../utils/api";

const buildImageUrl = (image, versionKey) => {
  if (!image) return null;

  const cacheBuster = `v=${versionKey}`;
  const appendQuery = (url) => `${url}${url.includes("?") ? "&" : "?"}${cacheBuster}`;

  if (/^https?:\/\//i.test(image)) {
    return appendQuery(image);
  }

  const base = API_BASE_URL.replace(/\/$/, "");

  if (image.startsWith("/")) {
    return appendQuery(`${base}${image}`);
  }

  return `${base}/assets/${image}?${cacheBuster}`;
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const UserImage = ({ image, size = "60px", name = "" }) => {
  const [profilePictureKey, setProfilePictureKey] = useState(Date.now());

  useEffect(() => {
    const handleProfilePictureUpdate = () => setProfilePictureKey(Date.now());

    window.addEventListener("profilePictureUpdated", handleProfilePictureUpdate);
    return () => window.removeEventListener("profilePictureUpdated", handleProfilePictureUpdate);
  }, []);

  const imageUrl = useMemo(() => buildImageUrl(image, profilePictureKey), [image, profilePictureKey]);
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <Avatar
      src={imageUrl || undefined}
      alt={name || "User"}
      sx={{
        width: size,
        height: size,
        fontSize: `calc(${size} * 0.4)`,
        fontWeight: "bold",
        bgcolor: imageUrl ? undefined : "primary.main",
      }}
    >
      {initials || "?"}
    </Avatar>
  );
};

export default UserImage;
