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
import { Edit, Description } from "@mui/icons-material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLogin } from "state";

const BioEditDialog = ({ open, onClose, currentBio, userId }) => {
  const { palette } = useTheme();
  const [bio, setBio] = useState(currentBio || "");
  const [updating, setUpdating] = useState(false);
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  const handleSave = async () => {
    if (updating) return;

    setUpdating(true);
    try {
      const response = await fetch(`https://mockingbird-backend-453975176199.us-central1.run.app/users/${userId}/bio`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: bio.trim() }),
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
        throw new Error("Failed to update bio");
      }
    } catch (error) {
      console.error("Error updating bio:", error);
      alert("Failed to update bio. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleClose = () => {
    setBio(currentBio || "");
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
        Edit Bio
      </DialogTitle>

      <DialogContent>
        <Box textAlign="center" mb={3}>
          <Description
            sx={{
              fontSize: "4rem",
              color: palette.primary.main,
              mb: 2
            }}
          />

          <Typography variant="body1" color="textSecondary" paragraph>
            Tell others a bit about yourself. Share your interests, hobbies, or anything you'd like others to know!
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write something about yourself..."
            sx={{
              mt: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
              }
            }}
            inputProps={{
              maxLength: 300,
            }}
            helperText={`${bio.length}/300 characters`}
          />

          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
            Your bio will be visible to other users on your profile.
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
          disabled={updating || bio.trim() === currentBio}
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
            "Save Bio"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BioEditDialog;
