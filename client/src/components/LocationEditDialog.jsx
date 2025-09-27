import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  useTheme,
  CircularProgress,
} from "@mui/material";
import { Edit, LocationOn } from "@mui/icons-material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLogin } from "state";

const LocationEditDialog = ({ open, onClose, currentLocation, userId }) => {
  const { palette } = useTheme();
  const [location, setLocation] = useState(currentLocation || "");
  const [updating, setUpdating] = useState(false);
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  const handleSave = async () => {
    if (updating) return;

    setUpdating(true);
    try {
      const response = await fetch(`https://mockingbird-backend-453975176199.us-central1.run.app/users/${userId}/location`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: location.trim() }),
      });

      if (response.ok) {
        const updatedUser = await response.json();

        // Update Redux state with new user data
        dispatch(setLogin({
          user: updatedUser,
          token: token,
        }));

        onClose();
      } else {
        throw new Error("Failed to update location");
      }
    } catch (error) {
      console.error("Error updating location:", error);
      alert("Failed to update location. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setLocation(currentLocation || "");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "1rem",
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          fontSize: "1.5rem",
          fontWeight: 600,
        }}
      >
        <Edit sx={{ color: palette.primary.main }} />
        Edit Location
      </DialogTitle>

      <DialogContent>
        <Box textAlign="center" mb={3}>
          <LocationOn
            sx={{
              fontSize: "4rem",
              color: palette.primary.main,
              mb: 2
            }}
          />

          <Typography variant="body1" color="textSecondary" paragraph>
            Where are you located? 
          </Typography>

          <TextField
            fullWidth
            label="Your Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter your city, country, etc..."
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              }
            }}
            inputProps={{
              maxLength: 100,
            }}
            helperText={`${location.length}/100 characters`}
          />

          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
            Your location will be visible to other users on your profile.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2, gap: 2 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={updating}
          sx={{
            borderRadius: "25px",
            px: 3,
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          disabled={updating || location.trim() === currentLocation}
          sx={{
            backgroundColor: palette.primary.main,
            color: "white",
            borderRadius: "25px",
            px: 3,
            "&:hover": {
              backgroundColor: palette.primary.dark,
            }
          }}
        >
          {updating ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            "Save Location"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationEditDialog;
