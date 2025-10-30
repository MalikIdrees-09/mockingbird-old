import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  useTheme,
  TextField,
} from "@mui/material";
import { Block, Warning, Gavel, Send } from "@mui/icons-material";
import { useState } from "react";
import { useSelector } from "react-redux";

const BannedUserDialog = ({ open, onClose, banInfo }) => {
  const { palette } = useTheme();
  const [appealText, setAppealText] = useState("");
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const token = useSelector((state) => state.token);

  if (!banInfo) return null;

  const handleAppealSubmit = async () => {
    if (!appealText.trim()) return;

    setSubmittingAppeal(true);
    try {
      const response = await fetch("https://mockingbird-backend.idrees.in/auth/submit-appeal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appealReason: appealText.trim(),
          banReason: banInfo.details,
        }),
      });

      if (response.ok) {
        alert("Appeal submitted successfully! We'll review your case and get back to you.");
        setAppealText("");
        setShowAppealForm(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to submit appeal. Please try again.");
      }
    } catch (error) {
      console.error("Appeal submission error:", error);
      alert("Network error. Please try again.");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          padding: "1rem",
          border: `3px solid ${palette.error.main}`,
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          color: palette.error.main,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          fontSize: "1.8rem",
          fontWeight: 700,
          mb: 1,
        }}
      >
        <Block sx={{ fontSize: "2.5rem", color: palette.error.main }} />
        🚫 ACCOUNT BANNED 🚫
      </DialogTitle>

      <DialogContent>
        <Box textAlign="center" mb={3}>
          <Block
            sx={{
              fontSize: "5rem",
              color: palette.error.main,
              mb: 2,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
                "100%": { transform: "scale(1)" },
              }
            }}
          />

          <Typography
            variant="h5"
            color="error"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            Your Account Has Been Suspended
          </Typography>

          <Typography variant="body1" color="textPrimary" paragraph>
            Your account has been banned due to a violation of our community guidelines.
          </Typography>

          <Box
            sx={{
              backgroundColor: palette.error.light + "20",
              borderRadius: "12px",
              padding: "1rem",
              mt: 2,
              mb: 2,
              border: `2px solid ${palette.error.light}`,
            }}
          >
            <Typography variant="body2" color="textPrimary" sx={{ fontWeight: 600, mb: 1 }}>
              Reason for ban:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {banInfo.details || "Violation of community guidelines"}
            </Typography>
          </Box>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            sx={{
              backgroundColor: palette.warning.light + "20",
              borderRadius: "8px",
              padding: "0.75rem",
              mt: 2,
              border: `1px solid ${palette.warning.main}`,
            }}
          >
            <Warning sx={{ color: palette.warning.main }} />
            <Typography variant="body2" color="textPrimary" sx={{ fontWeight: 500 }}>
              If you believe this is a mistake, you can submit an appeal
            </Typography>
          </Box>

          {!showAppealForm ? (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  fontStyle: "italic",
                  opacity: 0.8,
                  mb: 2
                }}
              >
                Please be respectful in your community! - Idrees
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Submit an Appeal
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Explain why you should be unbanned"
                placeholder="Please provide details about why you believe this ban was unjustified..."
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ maxLength: 1000 }}
                helperText={`${appealText.length}/1000 characters`}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Your appeal will be reviewed by our moderation team. We'll get back to you via email.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2, gap: 2 }}>
        {!showAppealForm ? (
          <>
            <Button
              onClick={() => setShowAppealForm(true)}
              variant="outlined"
              startIcon={<Gavel />}
              sx={{
                borderRadius: "25px",
                px: 3,
              }}
            >
              Appeal Ban
            </Button>
            <Button
              onClick={onClose}
              variant="contained"
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
              I Understand
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                setShowAppealForm(false);
                setAppealText("");
              }}
              variant="outlined"
              disabled={submittingAppeal}
              sx={{
                borderRadius: "25px",
                px: 3,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAppealSubmit}
              variant="contained"
              disabled={!appealText.trim() || submittingAppeal}
              startIcon={submittingAppeal ? null : <Send />}
              sx={{
                backgroundColor: palette.success.main,
                color: "white",
                borderRadius: "25px",
                px: 3,
                "&:hover": {
                  backgroundColor: palette.success.dark,
                }
              }}
            >
              {submittingAppeal ? "Submitting..." : "Submit Appeal"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BannedUserDialog;
