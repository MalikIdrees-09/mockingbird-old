import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  ContentCopy,
  Twitter,
  Facebook,
  WhatsApp,
  Email,
  Close,
} from "@mui/icons-material";
import { useState } from "react";

const ShareDialog = ({ open, onClose, postId, postDescription }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Generate shareable URL
  const shareUrl = `${window.location.origin}/post/${postId}`;
  const shareText = postDescription
    ? `Check out this post: "${postDescription.substring(0, 100)}${postDescription.length > 100 ? '...' : ''}"`
    : "Check out this post on Mockingbird!";

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setSnackbar({
        open: true,
        message: "Link copied to clipboard!",
        severity: "success",
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setSnackbar({
          open: true,
          message: "Link copied to clipboard!",
          severity: "success",
        });
      } catch (fallbackErr) {
        setSnackbar({
          open: true,
          message: "Failed to copy link. Please copy manually.",
          severity: "error",
        });
      }
      document.body.removeChild(textArea);
    }
  };

  // Share to different platforms
  const shareToPlatform = (platform) => {
    let url = "";
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent("Check out this post")}&body=${encodedText}%20${encodedUrl}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleClose = () => {
    setSnackbar({ open: false, message: "", severity: "success" });
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div">
              Share Post
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Copy Link Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Copy Link
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shareUrl}
              </Typography>
              <Tooltip title="Copy link">
                <IconButton onClick={copyToClipboard} size="small">
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Social Media Share Buttons */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Share on Social Media
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Tooltip title="Share on Twitter">
                <IconButton
                  onClick={() => shareToPlatform("twitter")}
                  sx={{
                    bgcolor: "#1DA1F2",
                    color: "white",
                    "&:hover": { bgcolor: "#0d95e8" },
                  }}
                >
                  <Twitter />
                </IconButton>
              </Tooltip>

              <Tooltip title="Share on Facebook">
                <IconButton
                  onClick={() => shareToPlatform("facebook")}
                  sx={{
                    bgcolor: "#1877F2",
                    color: "white",
                    "&:hover": { bgcolor: "#166fe5" },
                  }}
                >
                  <Facebook />
                </IconButton>
              </Tooltip>

              <Tooltip title="Share on WhatsApp">
                <IconButton
                  onClick={() => shareToPlatform("whatsapp")}
                  sx={{
                    bgcolor: "#25D366",
                    color: "white",
                    "&:hover": { bgcolor: "#20c157" },
                  }}
                >
                  <WhatsApp />
                </IconButton>
              </Tooltip>

              <Tooltip title="Share via Email">
                <IconButton
                  onClick={() => shareToPlatform("email")}
                  sx={{
                    bgcolor: "#EA4335",
                    color: "white",
                    "&:hover": { bgcolor: "#d33b2c" },
                  }}
                >
                  <Email />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareDialog;
