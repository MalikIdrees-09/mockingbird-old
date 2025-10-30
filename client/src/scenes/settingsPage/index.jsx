import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  Divider,
  useTheme,
  Avatar,
  Grid,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Slider,
  useMediaQuery,
} from "@mui/material";
import {
  Person,
  Email,
  Lock,
  PhotoCamera,
  Save,
  Security,
  AccountBox,
  Warning,
  CheckCircle,
  Error,
  Info,
  Palette,
} from "@mui/icons-material";
import { updateUser, setBackgroundTheme, clearBackgroundTheme } from "state";
import Navbar from "scenes/navbar";
import WidgetWrapper from "components/WidgetWrapper";
import ChangeProfilePictureDialog from "components/ChangeProfilePictureDialog";
import { useNavigate } from "react-router-dom";
import { setLogout } from "state";

const Settings = () => {
  const { palette } = useTheme();
  const isMobile = useMediaQuery('(max-width:999px)');
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Tab state
  const [tabValue, setTabValue] = useState(0);
  // Appearance state (reads from Redux uiTheme if present)
  const uiTheme = useSelector((state) => state.uiTheme);
  const [bgType, setBgType] = useState(uiTheme?.backgroundType || null);
  const [bgValue, setBgValue] = useState(uiTheme?.backgroundValue || "");
  const [bgBlur, setBgBlur] = useState(uiTheme?.blur || 0);
  const [bgDim, setBgDim] = useState(uiTheme?.dim || 0);
  const [gradAngle, setGradAngle] = useState(135);
  const [gradC1, setGradC1] = useState('#1e3c72');
  const [gradC2, setGradC2] = useState('#2a5298');
  const applyAppearance = () => {
    dispatch(setBackgroundTheme({ backgroundType: bgType, backgroundValue: bgValue, blur: bgBlur, dim: bgDim }));
  };
  const resetAppearance = () => {
    dispatch(clearBackgroundTheme());
    setBgType(null); setBgValue(""); setBgBlur(0); setBgDim(0);
  };
  const themePresets = [
    { label: 'Tropical', type: 'image', value: '/assets/themes/tropical.jpg' },
    { label: 'Sunset', type: 'image', value: '/assets/themes/sunset.jpg' },
    { label: 'Aurora', type: 'image', value: '/assets/themes/aurora.jpg' },
  ];

  // Live preview: update global theme whenever local controls change
  useEffect(() => {
    dispatch(setBackgroundTheme({
      backgroundType: bgType,
      backgroundValue: bgValue,
      blur: bgBlur,
      dim: bgDim,
    }));
  }, [bgType, bgValue, bgBlur, bgDim, dispatch]);

  // Form states for different sections
  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    location: user.location || "",
    bio: user.bio || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [emailForm, setEmailForm] = useState({
    currentPassword: "",
    newEmail: "",
  });

  // Profile picture cropping dialog
  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const [emailVerification, setEmailVerification] = useState({
    needed: false,
    otp: '',
    newEmail: '',
    message: '',
    error: ''
  });

  // Success state for profile update
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);

  // Success state for password change
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // State to force re-renders of profile pictures
  const [profilePictureKey, setProfilePictureKey] = useState(Date.now());

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Force component re-render when profile picture is updated
  useEffect(() => {
    const handleProfilePictureUpdate = () => {
      // Force re-render by updating the key
      setProfilePictureKey(Date.now());
    };

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    console.log("📝 Starting profile update process...");
    console.log("📝 Profile form data:", profileForm);

    setProfileLoading(true);

    try {
      console.log("📡 Making API call to update profile...");
      const response = await fetch(
        `http://localhost:5000/users/${user._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            location: profileForm.location,
            bio: profileForm.bio,
          }),
        }
      );

      console.log("📡 API Response status:", response.status);

      if (response.ok) {
        const updatedUser = await response.json();
        console.log("✅ Profile update successful!", updatedUser);

        // Update Redux state with the updated user data
        dispatch(updateUser(updatedUser));

        // Set success state for inline display
        setProfileUpdateSuccess(true);

        setSnackbar({
          open: true,
          message: "Profile updated successfully! Your changes have been saved.",
          severity: "success",
        });

        // Clear success state after 5 seconds
        setTimeout(() => {
          setProfileUpdateSuccess(false);
        }, 5000);
      } else {
        const errorData = await response.json();
        console.log("❌ Profile update failed:", errorData);
        setSnackbar({
          open: true,
          message: errorData.message || "Failed to update profile",
          severity: "error",
        });
      }
    } catch (error) {
      console.log("❌ Network error during profile update:", error);
      setSnackbar({
        open: true,
        message: "Network error. Please try again.",
        severity: "error",
      });
    }

    setProfileLoading(false);
    console.log("🏁 Profile update process completed");
  };

  const getAccountStatusColor = () => {
    if (user.isBanned) return "error";
    if (user.isVerified || user.isAdmin) return "success";
    return "warning";
  };

  const getAccountStatusText = () => {
    if (user.isBanned) return "Banned";
    if (user.isVerified || user.isAdmin) return "Verified";
    return "Unverified";
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    console.log("🔑 Starting password change process...");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      console.log("❌ Password confirmation validation failed");
      setSnackbar({
        open: true,
        message: "Passwords don't match",
        severity: "error",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      console.log("❌ Password length validation failed");
      setSnackbar({
        open: true,
        message: "New password must be at least 6 characters long",
        severity: "error",
      });
      return;
    }

    console.log("✅ Password validation passed");
    setPasswordLoading(true);

    try {
      console.log("📡 Making API call to change password...");
      const response = await fetch("http://localhost:5000/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      console.log("📡 API Response status:", response.status);
      const data = await response.json();
      console.log("📡 API Response data:", data);

      if (response.ok) {
        console.log("✅ Password change successful!");
        setSnackbar({
          open: true,
          message: "Password changed successfully!",
          severity: "success",
        });

        // Set success state for inline display
        setPasswordChangeSuccess(true);

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        // Clear success state after 5 seconds
        setTimeout(() => {
          setPasswordChangeSuccess(false);
        }, 5000);
      } else {
        console.log("❌ Password change failed:", data);
        setSnackbar({
          open: true,
          message: data.msg || "Failed to change password",
          severity: "error",
        });
        console.error("Password change error:", data);
      }
    } catch (error) {
      console.log("❌ Network error during password change:", error);
      setSnackbar({
        open: true,
        message: "Network error. Please try again.",
        severity: "error",
      });
      console.error("Network error:", error);
    }

    setPasswordLoading(false);
    console.log("🏁 Password change process completed");
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();

    if (!emailVerification.otp.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter the verification code",
        severity: "error",
      });
      return;
    }

    // Clear any previous error
    setEmailVerification(prev => ({ ...prev, error: '' }));

    setEmailLoading(true);

    try {
      console.log("🔢 Verifying email change OTP...");
      const response = await fetch("http://localhost:5000/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailVerification.newEmail,
          otp: emailVerification.otp.trim(),
        }),
      });

      console.log("📡 Verification response status:", response.status);
      const data = await response.json();
      console.log("📡 Verification response data:", data);

      if (response.ok) {
        console.log("✅ Email change verified successfully!");

        // Update user state with new email and verified status
        const updatedUser = { ...user, email: emailVerification.newEmail, isVerified: true };
        dispatch(updateUser(updatedUser));

        setSnackbar({
          open: true,
          message: "Email address changed successfully! Your new email is now verified.",
          severity: "success",
        });

        // Reset verification state
        setEmailVerification({
          needed: false,
          otp: '',
          newEmail: '',
          message: '',
          error: ''
        });
      } else {
        console.log("❌ Email verification failed:", data);
        setSnackbar({
          open: true,
          message: data.msg || "Invalid verification code. Please try again.",
          severity: "error",
        });

        // Set error state for inline display
        setEmailVerification(prev => ({
          ...prev,
          error: data.msg || "Invalid verification code. Please try again."
        }));
      }
    } catch (error) {
      console.log("❌ Network error during verification:", error);
      setSnackbar({
        open: true,
        message: "Network error. Please try again.",
        severity: "error",
      });
    }

    setEmailLoading(false);
    console.log("🏁 Email verification process completed");
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();

    console.log("🚀 Starting email change process...");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.newEmail)) {
      console.log("❌ Email validation failed");
      setSnackbar({
        open: true,
        message: "Please enter a valid email address",
        severity: "error",
      });
      return;
    }

    if (emailForm.newEmail.toLowerCase() === user.email.toLowerCase()) {
      console.log("❌ Same email validation failed");
      setSnackbar({
        open: true,
        message: "New email must be different from current email",
        severity: "error",
      });
      return;
    }

    console.log("✅ Email validation passed");
    setEmailLoading(true);

    try {
      console.log("📡 Making API call to change email...");
      const response = await fetch("http://localhost:5000/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: emailForm.currentPassword,
          newEmail: emailForm.newEmail,
        }),
      });

      console.log("📡 API Response status:", response.status);
      const data = await response.json();
      console.log("📡 API Response data:", data);

      if (response.ok) {
        console.log("✅ Email change initiated!", data);

        // Check if verification is required
        if (data.requiresVerification) {
          setEmailVerification({
            needed: true,
            otp: '',
            newEmail: data.newEmail,
            message: data.verificationMessage || 'Please check your new email for the verification code.'
          });

          setSnackbar({
            open: true,
            message: data.message || "Email change initiated! Please check your new email for the verification code.",
            severity: "info",
          });
        } else {
          // Email change was direct (no verification needed)
          setSnackbar({
            open: true,
            message: data.message || "Email address updated successfully!",
            severity: "success",
          });

          // Update local user state to reflect the new email immediately
          const updatedUser = { ...user, email: emailForm.newEmail };
          dispatch(updateUser(updatedUser));
        }

        setEmailForm({
          currentPassword: "",
          newEmail: "",
        });
      } else {
        console.log("❌ Email change failed:", data);
        setSnackbar({
          open: true,
          message: data.msg || "Failed to change email",
          severity: "error",
        });
        console.error("Email change error:", data);
      }
    } catch (error) {
      console.log("❌ Network error:", error);
      setSnackbar({
        open: true,
        message: "Network error. Please try again.",
        severity: "error",
      });
    }

    setEmailLoading(false);
    console.log("🏁 Email change process completed");
  };

  // Always render the full settings UI; it is now responsive for mobile as well

  return (
    <>
      <Navbar />
      <Box
        width="100%"
        sx={{
          p: { xs: '0.5rem', md: '2rem 6%' },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          flexBasis="100%"
          maxWidth={{ xs: '100%', md: '1200px' }}
          mt={{ xs: '1rem', md: '2rem' }}
        >
          <WidgetWrapper sx={{ p: { xs: '0.5rem', md: '1.5rem' } }}>
            <Box sx={{ width: "100%" }}>
              {/* Header */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant={{ xs: 'h5', md: 'h3' }}
                  sx={{
                    fontFamily: "Playfair Display, serif",
                    fontWeight: 700,
                    color: "secondary.main",
                    textAlign: "center",
                    mb: 1,
                  }}
                >
                  Account Management
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: palette.neutral.main,
                    textAlign: "center",
                    fontStyle: "italic",
                  }}
                >
                  Manage your account settings
                </Typography>
              </Box>

              {/* Account Overview Card */}
              <Card
                sx={{
                  mb: 4,
                  backgroundColor: palette.neutral.light + "10",
                  borderRadius: "20px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  border: `2px solid ${palette.primary.main}20`,
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Avatar
                      src={
                        user.picturePath ? `http://localhost:5000/assets/${user.picturePath}?v=${profilePictureKey}` : undefined
                      }
                      sx={{
                        width: 80,
                        height: 80,
                        mr: 3,
                        border: `3px solid ${palette.primary.main}`,
                      }}
                    >
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body1" sx={{ color: palette.neutral.main, mb: 1 }}>
                        {user.email}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Chip
                          label={getAccountStatusText()}
                          color={getAccountStatusColor()}
                          variant="outlined"
                          icon={
                            user.isBanned ? <Error /> :
                            (user.isVerified || user.isAdmin) ? <CheckCircle /> : <Warning />
                          }
                        />
                        <Chip
                          label={user.isAdmin ? "Administrator" : "Standard User"}
                          color={user.isAdmin ? "secondary" : "primary"}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ color: palette.neutral.main }}>
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: palette.neutral.main }}>
                      Last updated {new Date(user.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="settings tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    "& .MuiTab-root": {
                      minWidth: 120,
                      fontWeight: 600,
                      fontSize: "1rem",
                    },
                  }}
                >
                  <Tab
                    icon={<AccountBox />}
                    label="Profile"
                    iconPosition="start"
                    sx={{ textTransform: "none" }}
                  />
                  <Tab
                    icon={<Security />}
                    label="Security"
                    iconPosition="start"
                    sx={{ textTransform: "none" }}
                  />
                  <Tab
                    icon={<Info />}
                    label="Account Info"
                    iconPosition="start"
                    sx={{ textTransform: "none" }}
                  />
                  <Tab
                    icon={<Palette />}
                    label="Appearance"
                    iconPosition="start"
                    sx={{ textTransform: "none" }}
                  />
                </Tabs>
              </Box>

              {/* Profile Tab */}
              {tabValue === 0 && (
                <Grid container spacing={{ xs: 2, md: 4 }}>
                  {/* Profile Picture Section */}
                  <Grid item xs={12} md={4}>
                    <Card
                      sx={{
                        height: "100%",
                        backgroundColor: palette.neutral.light + "10",
                        borderRadius: "16px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        border: `1px solid ${palette.primary.main}20`,
                      }}
                    >
                      <CardHeader
                        title="Profile Picture"
                        sx={{
                          textAlign: "center",
                          backgroundColor: palette.primary.light + "20",
                          "& .MuiCardHeader-title": {
                            fontWeight: 600,
                            fontSize: "1.2rem",
                          },
                        }}
                      />
                      <CardContent sx={{ textAlign: "center", pb: 3 }}>
                        <Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
                          <Avatar
                            src={user.picturePath ? `http://localhost:5000/assets/${user.picturePath}?v=${profilePictureKey}` : undefined}
                            sx={{
                              width: 150,
                              height: 150,
                              border: `4px solid ${palette.primary.main}`,
                              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                            }}
                          >
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </Avatar>

                          <IconButton
                            onClick={() => setCropDialogOpen(true)}
                            sx={{
                              position: "absolute",
                              bottom: 10,
                              right: 10,
                              backgroundColor: palette.primary.main,
                              color: "white",
                              "&:hover": {
                                backgroundColor: palette.primary.dark,
                                transform: "scale(1.1)",
                              },
                              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                              transition: "all 0.3s ease",
                            }}
                          >
                            <PhotoCamera />
                          </IconButton>
                        </Box>

                        <Typography variant="body2" sx={{ textAlign: "center", color: palette.neutral.main, mb: 1 }}>
                          Click the camera icon to change your profile picture.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Profile Information Section */}
                  <Grid item xs={12} md={8}>
                    <Card
                      sx={{
                        backgroundColor: palette.neutral.light + "10",
                        borderRadius: "16px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        border: `1px solid ${palette.secondary.main}20`,
                      }}
                    >
                      <CardHeader
                        title="Personal Information"
                        subheader="Update your profile details"
                        sx={{
                          backgroundColor: palette.secondary.light + "20",
                          "& .MuiCardHeader-title": {
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          },
                          "& .MuiCardHeader-subheader": {
                            color: palette.neutral.main,
                          },
                        }}
                        avatar={<Person sx={{ color: palette.secondary.main }} />}
                      />
                      <CardContent>
                        <Box component="form" onSubmit={handleProfileUpdate}>
                          <Grid container spacing={{ xs: 2, md: 3 }}>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="First Name"
                                value={profileForm.firstName}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, firstName: e.target.value })
                                }
                                required
                                variant="outlined"
                              />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <TextField
                                fullWidth
                                label="Last Name"
                                value={profileForm.lastName}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, lastName: e.target.value })
                                }
                                required
                                variant="outlined"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Location"
                                value={profileForm.location}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, location: e.target.value })
                                }
                                variant="outlined"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Bio"
                                value={profileForm.bio}
                                onChange={(e) =>
                                  setProfileForm({ ...profileForm, bio: e.target.value })
                                }
                                multiline
                                rows={4}
                                variant="outlined"
                                placeholder="Tell us about yourself..."
                              />
                            </Grid>
                          </Grid>

                          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                            <Button
                              type="submit"
                              variant="contained"
                              color="secondary"
                              disabled={profileLoading}
                              startIcon={<Save />}
                              sx={{ minWidth: 140 }}
                            >
                              {profileLoading ? "Updating..." : "Update Profile"}
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setProfileForm({
                                  firstName: user.firstName,
                                  lastName: user.lastName,
                                  location: user.location,
                                  bio: user.bio,
                                });
                              }}
                              sx={{ minWidth: 140 }}
                            >
                              Reset Changes
                            </Button>
                          </Box>

                          {/* Success Message */}
                          {profileUpdateSuccess && (
                            <Box sx={{ mt: 3, p: 2, backgroundColor: "#e8f5e8", border: "1px solid #4caf50", borderRadius: 2, textAlign: "center" }}>
                              <Typography variant="body1" sx={{ color: "#2e7d32", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                                ✅ Profile Updated Successfully!
                              </Typography>
                              <Typography variant="body2" sx={{ color: "#2e7d32", mt: 1 }}>
                                Your profile information has been saved and updated throughout the site.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Security Tab */}
              {tabValue === 1 && (
                <Grid container spacing={4}>
                  {/* Change Password Section */}
                  <Grid item xs={12} md={6}>
                    <Card
                      sx={{
                        backgroundColor: palette.neutral.light + "10",
                        borderRadius: "16px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        border: `1px solid ${palette.primary.main}20`,
                      }}
                    >
                      <CardHeader
                        title="Change Password"
                        subheader="Update your account password"
                        sx={{
                          backgroundColor: palette.primary.light + "20",
                          "& .MuiCardHeader-title": {
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          },
                        }}
                        avatar={<Lock sx={{ color: palette.primary.main }} />}
                      />
                      <CardContent>
                        <Box component="form" onSubmit={handlePasswordChange}>
                          <TextField
                            fullWidth
                            type="password"
                            label="Current Password"
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                            }
                            sx={{ mb: 2 }}
                            required
                            variant="outlined"
                          />
                          <TextField
                            fullWidth
                            type="password"
                            label="New Password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            sx={{ mb: 2 }}
                            helperText="Must be at least 6 characters long"
                            required
                            variant="outlined"
                          />
                          <TextField
                            fullWidth
                            type="password"
                            label="Confirm New Password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            sx={{ mb: 3 }}
                            required
                            variant="outlined"
                          />
                          <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={passwordLoading}
                            startIcon={<Save />}
                            sx={{ minWidth: 140 }}
                          >
                            {passwordLoading ? "Updating..." : "Change Password"}
                          </Button>
                        </Box>
                      </CardContent>

                      {/* Success Message */}
                      {passwordChangeSuccess && (
                        <Box sx={{ mt: 3, p: 2, backgroundColor: "#e8f5e8", border: "1px solid #4caf50", borderRadius: 2, textAlign: "center" }}>
                          <Typography variant="body1" sx={{ color: "#2e7d32", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                            ✅ Password Changed Successfully!
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#2e7d32", mt: 1 }}>
                            Your password has been updated. Please use your new password for future logins.
                          </Typography>
                        </Box>
                      )}
                    </Card>
                  </Grid>

                  {/* Change Email Section */}
                  <Grid item xs={12} md={6}>
                    <Card
                      sx={{
                        backgroundColor: palette.neutral.light + "10",
                        borderRadius: "16px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        border: `1px solid ${palette.warning.main}20`,
                      }}
                    >
                      <CardHeader
                        title="Change Email Address"
                        subheader="Update your email address"
                        sx={{
                          backgroundColor: palette.warning.light + "20",
                          "& .MuiCardHeader-title": {
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          },
                        }}
                        avatar={<Email sx={{ color: palette.warning.main }} />}
                      />
                      <CardContent>
                        <Alert severity="info" sx={{ mb: 2, fontSize: "0.875rem" }}>
                          <strong>Important:</strong> Changing your email address will require you to verify the new email before you can log in again.
                        </Alert>

                        <Box component="form" onSubmit={handleEmailChange}>
                          <TextField
                            fullWidth
                            type="email"
                            label="New Email Address"
                            value={emailForm.newEmail}
                            onChange={(e) =>
                              setEmailForm({ ...emailForm, newEmail: e.target.value })
                            }
                            sx={{ mb: 2 }}
                            required
                            variant="outlined"
                          />
                          <TextField
                            fullWidth
                            type="password"
                            label="Current Password"
                            value={emailForm.currentPassword}
                            onChange={(e) =>
                              setEmailForm({ ...emailForm, currentPassword: e.target.value })
                            }
                            sx={{ mb: 3 }}
                            required
                            variant="outlined"
                          />
                          <Button
                            type="submit"
                            variant="contained"
                            color="warning"
                            disabled={emailLoading}
                            startIcon={<Save />}
                            sx={{ minWidth: 140 }}
                          >
                            {emailLoading ? "Updating..." : "Change Email"}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Danger Zone Tab */}
              {tabValue === 2 && (
                <Card
                  sx={{
                    backgroundColor: palette.neutral.light + "10",
                    borderRadius: "16px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: `2px solid ${palette.primary.main}20`,
                  }}
                >
                  <CardHeader
                    title="Account Information"
                    subheader="Your account details and status"
                    sx={{
                      backgroundColor: palette.primary.light + "20",
                      "& .MuiCardHeader-title": {
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: palette.primary.main,
                      },
                    }}
                    avatar={<Info sx={{ color: palette.primary.main }} />}
                  />
                  <CardContent>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <strong>Account Status: ACTIVE</strong> 
                    </Alert>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <Box>
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                          Account Details
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: palette.neutral.main }}>
                          Email: {user.email}<br />
                          Member since: {new Date(user.createdAt).toLocaleDateString()}<br />
                          Account status: {user.isVerified ? "Verified" : "Unverified"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Appearance Tab */}
              {tabValue === 3 && (
                <Card
                  sx={{
                    backgroundColor: palette.neutral.light + "10",
                    borderRadius: "16px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    border: `1px solid ${palette.primary.main}20`,
                  }}
                >
                  <CardHeader
                    title="Appearance"
                    subheader="Customize your background"
                    sx={{
                      backgroundColor: palette.primary.light + "20",
                      "& .MuiCardHeader-title": { fontWeight: 600 },
                    }}
                    avatar={<Palette sx={{ color: palette.primary.main }} />}
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {themePresets.map(p => (
                        <Button key={p.label} variant="outlined" onClick={() => { setBgType(p.type); setBgValue(p.value); }}>
                          {p.label}
                        </Button>
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Button variant={bgType === null ? 'contained' : 'outlined'} onClick={() => setBgType(null)}>None</Button>
                      <Button variant={bgType === 'image' ? 'contained' : 'outlined'} onClick={() => setBgType('image')}>Image</Button>
                      <Button variant={bgType === 'gradient' ? 'contained' : 'outlined'} onClick={() => setBgType('gradient')}>Gradient</Button>
                    </Box>
                    {/* Custom image upload */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Button variant="outlined" component="label">
                        Upload Image
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setBgType('image');
                              setBgValue(url);
                            }
                          }}
                        />
                      </Button>
                      {bgType === 'image' && bgValue && (
                        <Box sx={{ width: 80, height: 48, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                          <img src={bgValue} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      )}
                    </Box>
                    {bgType === 'image' && (
                      <TextField fullWidth label={'Image URL'} value={bgValue} onChange={(e) => setBgValue(e.target.value)} sx={{ mb: 2 }} />
                    )}
                    {bgType === 'gradient' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>Create your gradient</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ minWidth: 60 }}>Angle</Typography>
                            <Slider value={gradAngle} onChange={(e, v) => { setGradAngle(v); const g = `linear-gradient(${v}deg, ${gradC1} 0%, ${gradC2} 100%)`; setBgValue(g); }} min={0} max={360} sx={{ width: 200 }} />
                            <Typography variant="caption" sx={{ width: 36, textAlign: 'right' }}>{gradAngle}°</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">Color 1</Typography>
                              <input type="color" value={gradC1} onChange={(e) => { const c = e.target.value; setGradC1(c); const g = `linear-gradient(${gradAngle}deg, ${c} 0%, ${gradC2} 100%)`; setBgValue(g); }} />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">Color 2</Typography>
                              <input type="color" value={gradC2} onChange={(e) => { const c = e.target.value; setGradC2(c); const g = `linear-gradient(${gradAngle}deg, ${gradC1} 0%, ${c} 100%)`; setBgValue(g); }} />
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ height: 48, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: bgValue || 'transparent' }} />
                      </Box>
                    )}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Blur</Typography>
                      <Slider value={bgBlur} onChange={(e, v) => setBgBlur(v)} min={0} max={12} />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">Dim</Typography>
                      <Slider value={bgDim} onChange={(e, v) => setBgDim(v)} min={0} max={80} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" onClick={applyAppearance}>Apply</Button>
                      <Button variant="text" onClick={resetAppearance}>Reset</Button>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </WidgetWrapper>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={8000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontSize: "1.1rem",
            fontWeight: "bold",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            borderRadius: "12px",
            padding: "16px 24px",
            minWidth: "400px",
            textAlign: "center",
          }}
          icon={snackbar.severity === 'success' ? '🎉' : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Profile Picture Cropping Dialog */}
      <ChangeProfilePictureDialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        currentPicture={user.picturePath}
        userId={user._id}
      />

      {/* Email Verification Dialog */}
      {emailVerification.needed && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Card sx={{ maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <CardHeader
              title="Verify Email Address Change"
              subheader="Enter the verification code sent to your new email"
              sx={{
                backgroundColor: palette.info.light + "20",
                "& .MuiCardHeader-title": {
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: palette.info.main,
                },
              }}
              avatar={<Email sx={{ color: palette.info.main }} />}
            />
            <CardContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                {emailVerification.message}
              </Alert>

              <Typography variant="body2" sx={{ mb: 2, color: palette.neutral.main }}>
                <strong>New Email:</strong> {emailVerification.newEmail}
              </Typography>

              <Box component="form" onSubmit={handleVerifyEmailChange}>
                <TextField
                  fullWidth
                  label="Verification Code"
                  value={emailVerification.otp}
                  onChange={(e) =>
                    setEmailVerification(prev => ({
                      ...prev,
                      otp: e.target.value.replace(/\D/g, '').slice(0, 6),
                      error: '' // Clear error when user starts typing
                    }))
                  }
                  sx={{ mb: 3 }}
                  placeholder="Enter 6-digit code"
                  required
                  variant="outlined"
                  inputProps={{ maxLength: 6 }}
                  helperText="Enter the 6-digit code sent to your new email address"
                />

                {/* Error Message */}
                {emailVerification.error && (
                  <Box sx={{ mt: 1, p: 1.5, backgroundColor: "#ffebee", border: "1px solid #f44336", borderRadius: 1, textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: "#d32f2f", fontWeight: "bold" }}>
                      ❌ {emailVerification.error}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setEmailVerification({
                      needed: false,
                      otp: '',
                      newEmail: '',
                      message: '',
                      error: ''
                    })}
                    sx={{ minWidth: 100 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    disabled={emailLoading || emailVerification.otp.length !== 6}
                    startIcon={<CheckCircle />}
                    sx={{ minWidth: 140 }}
                  >
                    {emailLoading ? "Verifying..." : "Verify Email"}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
  </>
);

};

export default Settings;