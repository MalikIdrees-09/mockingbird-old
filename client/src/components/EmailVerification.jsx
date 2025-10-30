import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Email, CheckCircle, Refresh } from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { setLogin } from "state";
import { useNavigate } from "react-router-dom";
import WidgetWrapper from "components/WidgetWrapper";

const EmailVerification = ({ email, onBackToLogin }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const { palette } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://mockingbird-server-453975176199.asia-south1.run.app//auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Email verified successfully! Redirecting...");

        // Auto-login after verification
        dispatch(setLogin({
          user: data.user,
          token: data.token,
        }));

        // Redirect to home after a short delay
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      } else {
        setError(data.msg || "Verification failed");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage("");
    setError("");

    try {
      const response = await fetch("https://mockingbird-server-453975176199.asia-south1.run.app//auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendMessage("Verification email sent! Please check your inbox.");
      } else {
        setError(data.msg || "Failed to resend email");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  return (
    <WidgetWrapper>
      <Box textAlign="center" p={3}>
        <Email sx={{ fontSize: "4rem", color: palette.primary.main, mb: 2 }} />

        <Typography variant="h4" fontWeight="bold" mb={2}>
          Verify Your Email
        </Typography>

        <Typography variant="body1" color="textSecondary" mb={3}>
          We've sent a 6-digit verification code to:
        </Typography>

        <Typography variant="h6" fontWeight="medium" mb={3} sx={{ wordBreak: "break-all" }}>
          {email}
        </Typography>

        <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
          <strong>Important:</strong> The verification code is valid for 10 minutes.
          Please check your spam/junk folder if you don't see the email.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <CheckCircle sx={{ mr: 1 }} />
            {success}
          </Alert>
        )}

        {resendMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {resendMessage}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Enter 6-digit code"
          value={otp}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 6);
            setOtp(value);
            setError("");
          }}
          onKeyPress={handleKeyPress}
          inputProps={{
            maxLength: 6,
            style: { textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem" }
          }}
          sx={{ mb: 3 }}
          disabled={loading || !!success}
        />

        <Button
          fullWidth
          variant="contained"
          onClick={handleVerify}
          disabled={loading || otp.length !== 6 || !!success}
          sx={{
            mb: 2,
            py: 1.5,
            fontSize: "1.1rem",
            backgroundColor: palette.primary.main,
            "&:hover": {
              backgroundColor: palette.primary.dark,
            },
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>

        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="outlined"
            onClick={handleResend}
            disabled={resendLoading || !!success}
            startIcon={resendLoading ? <CircularProgress size={16} /> : <Refresh />}
            sx={{ flex: 1 }}
          >
            {resendLoading ? "Sending..." : "Resend Code"}
          </Button>

          <Button
            variant="text"
            onClick={onBackToLogin}
            disabled={loading || !!success}
            sx={{ flex: 1 }}
          >
            Back to Login
          </Button>
        </Box>

        <Typography variant="body2" color="textSecondary">
          Didn't receive the email? Check your spam folder or click "Resend Code"
        </Typography>
      </Box>
    </WidgetWrapper>
  );
};

export default EmailVerification;
