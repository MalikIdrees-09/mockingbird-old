import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Snackbar,
  useTheme,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import WidgetWrapper from "components/WidgetWrapper";

const ResetPassword = () => {
  const { palette } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!token) {
      setSnackbar({
        open: true,
        message: "Invalid reset link. Please request a new password reset.",
        severity: "error",
      });
      setTimeout(() => navigate("/"), 3000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setSnackbar({
        open: true,
        message: "Invalid reset token",
        severity: "error",
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: "Passwords don't match",
        severity: "error",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: "Password must be at least 6 characters long",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("https://mockingbird-backend-453975176199.us-central1.run.app/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Password reset successfully! You can now log in with your new password.",
          severity: "success",
        });

        // Redirect to login page after success
        setTimeout(() => navigate("/"), 3000);
      } else {
        setSnackbar({
          open: true,
          message: data.msg || "Failed to reset password",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Network error. Please try again.",
        severity: "error",
      });
    }

    setLoading(false);
  };

  if (!token) {
    return (
      <WidgetWrapper>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="50vh"
          textAlign="center"
        >
          <Typography variant="h5" color="error" gutterBottom>
            Invalid Reset Link
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This password reset link is invalid or has expired.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Redirecting to login page...
          </Typography>
        </Box>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="70vh"
      >
        <Card sx={{ maxWidth: 500, width: "100%" }}>
          <CardHeader
            title="Reset Your Password"
            subheader="Enter your new password below"
            sx={{
              textAlign: "center",
              backgroundColor: palette.neutral.light + "20",
              "& .MuiCardHeader-title": {
                fontWeight: 600,
              },
            }}
          />
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please choose a strong password that is at least 6 characters long.
            </Alert>

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                sx={{ mb: 2 }}
                required
              />

              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                sx={{ mb: 3 }}
                required
              />

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/")}
                  sx={{ flex: 1 }}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </WidgetWrapper>
  );
};

export default ResetPassword;
