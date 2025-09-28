import { Box, Avatar } from "@mui/material";
import { API_BASE_URL } from "../utils/api";

const UserImage = ({ image, size = "60px", name = "" }) => {
  const imageUrl = image ? `${API_BASE_URL}/assets/${image}` : null;
  
  // If no image, show initials
  if (!imageUrl) {
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
      
    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          bgcolor: 'primary.main',
          fontSize: `calc(${size} * 0.4)`,
          fontWeight: 'bold'
        }}
      >
        {initials || '?'}
      </Avatar>
    );
  }

  return (
    <Box width={size} height={size}>
      <img
        style={{ objectFit: "cover", borderRadius: "50%" }}
        width={size}
        height={size}
        alt="user"
        src={imageUrl}
        onError={(e) => {
          // If image fails to load, show initials
          const initials = name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
            
          e.target.style.display = 'none';
          e.target.parentNode.innerHTML = `
            <div style="
              width: ${size}; 
              height: ${size}; 
              border-radius: 50%; 
              background-color: #1976d2; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-weight: bold; 
              font-size: calc(${size} * 0.4);
            ">
              ${initials || '?'}
            </div>
          `;
        }}
      />
    </Box>
  );
};

export default UserImage;
