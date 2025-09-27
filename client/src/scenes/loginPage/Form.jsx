import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  useMediaQuery,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";
import EmailVerification from "components/EmailVerification";
import { useDispatch } from "react-redux";
import { setLogin } from "state";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { handleBannedUserError } from "utils/api";

const registerSchema = yup.object().shape({
  firstName: yup.string().required("required"),
  lastName: yup.string().required("required"),
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
  location: yup.string().required("required"),
  bio: yup.string().required("required"),
  // picture: yup.string().required("required"), // Removed required validation for picture
});

const loginSchema = yup.object().shape({
  email: yup.string().email("invalid email").required("required"),
  password: yup.string().required("required"),
});

const initialValuesRegister = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  location: "",
  bio: "",
  picture: "",
};

const initialValuesLogin = {
  email: "",
  password: "",
};

const Form = () => {
  const [pageType, setPageType] = useState("login");
  const [verificationMode, setVerificationMode] = useState({ active: false, email: "" });
  const [resetPasswordDialog, setResetPasswordDialog] = useState({ open: false });
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { palette } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const isLogin = pageType === "login";
  const isRegister = pageType === "register";

  const register = async (values, onSubmitProps) => {
    try {
      console.log("Registration attempt with values:", values);
      
      // this allows us to send form info with image
      const formData = new FormData();
      for (let value in values) {
        if (value === "picture") {
          // Handle file upload
          if (values.picture) {
            formData.append("picture", values.picture);
          }
        } else {
          formData.append(value, values[value]);
        }
      }
      
      // Only append picturePath if picture exists
      if (values.picture && values.picture.name) {
        formData.append("picturePath", values.picture.name);
      }

      console.log("Sending registration request...");
      const savedUserResponse = await fetch(
        "https://mockingbird-backend-453975176199.us-central1.run.app/auth/register",
        {
          method: "POST",
          body: formData,
        }
      );
      
      const savedUser = await savedUserResponse.json();
      console.log("Registration response:", savedUser);
      
      if (savedUserResponse.ok && savedUser.user && savedUser.requiresVerification) {
        console.log("Registration successful, switching to verification mode");
        setVerificationMode({ active: true, email: savedUser.user.email });
        alert("Registration successful! Please check your email for the verification code.");
      } else if (savedUserResponse.ok && savedUser._id) {
        // Fallback for old response format
        console.log("Registration successful");
        setPageType("login");
        alert("Registration successful! Please login.");
      } else {
        console.error("Registration failed:", savedUser);
        alert(`Registration failed: ${savedUser.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Network error during registration. Please check if the server is running.");
    }
    onSubmitProps.resetForm();
  };

  const login = async (values, onSubmitProps) => {
    try {
      console.log("Attempting login with:", values);
      const response = await fetch("https://mockingbird-backend-453975176199.us-central1.run.app/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      // Check for banned user error first
      const handledResponse = await handleBannedUserError(response, dispatch);
      if (handledResponse === null) return; // User was logged out due to ban

      const loggedIn = await handledResponse.json();
      console.log("Login response:", loggedIn);

      if (handledResponse.ok && loggedIn.token && loggedIn.user) {
        dispatch(
          setLogin({
            user: loggedIn.user,
            token: loggedIn.token,
          })
        );
        navigate("/home");
      } else {
        // Handle other error responses
        console.error("Login failed:", loggedIn);

        if (loggedIn.error === "EMAIL_NOT_VERIFIED") {
          // Handle unverified email - automatically switch to verification mode
          console.log("Unverified user detected, switching to verification mode");
          setVerificationMode({ active: true, email: loggedIn.email });
        } else {
          alert(`Login failed: ${loggedIn.msg || loggedIn.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Network error. Please check if the server is running on port 5000.");
    }
    onSubmitProps.resetForm();
  };

  const handlePasswordResetRequest = async () => {
    if (!resetEmail) {
      alert("Please enter your email address");
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("https://mockingbird-backend-453975176199.us-central1.run.app/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("If this email is registered, a password reset link has been sent.");
        setResetPasswordDialog({ open: false });
        setResetEmail("");
      } else {
        alert(data.msg || "Failed to send reset email");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }

    setResetLoading(false);
  };

  const handleBackToLogin = () => {
    setVerificationMode({ active: false, email: "" });
    setPageType("login");
  };

  const handleSwitchToLogin = () => {
    setPageType("login");
    setVerificationMode({ active: false, email: "" });
  };

  const handleSwitchToRegister = () => {
    setPageType("register");
    setVerificationMode({ active: false, email: "" });
  };

  const handleFormSubmit = async (values, onSubmitProps) => {
    if (isLogin) await login(values, onSubmitProps);
    if (isRegister) await register(values, onSubmitProps);
  };

  return (
    <>
      {verificationMode.active ? (
        <EmailVerification
          email={verificationMode.email}
          onBackToLogin={handleBackToLogin}
        />
      ) : (
        <Formik
          key={pageType} // Force re-initialization when switching between login/register
          onSubmit={handleFormSubmit}
          initialValues={isLogin ? initialValuesLogin : initialValuesRegister}
          validationSchema={isLogin ? loginSchema : registerSchema}
          enableReinitialize={true} // Allow form to reinitialize when initial values change
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
            setFieldValue,
            resetForm,
          }) => (
            <form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gap={isNonMobile ? "30px" : "20px"}
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
                }}
              >
                {isRegister && (
                  <>
                    <TextField
                      label="First Name"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.firstName || ""}
                      name="firstName"
                      autoComplete="off"
                      error={
                        Boolean(touched.firstName) && Boolean(errors.firstName)
                      }
                      helperText={touched.firstName && errors.firstName}
                      sx={{ gridColumn: "span 2" }}
                    />
                    <TextField
                      label="Last Name"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.lastName || ""}
                      name="lastName"
                      autoComplete="off"
                      error={Boolean(touched.lastName) && Boolean(errors.lastName)}
                      helperText={touched.lastName && errors.lastName}
                      sx={{ gridColumn: "span 2" }}
                    />
                    <TextField
                      label="Location"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.location || ""}
                      name="location"
                      autoComplete="off"
                      error={Boolean(touched.location) && Boolean(errors.location)}
                      helperText={touched.location && errors.location}
                      sx={{ gridColumn: "span 4" }}
                    />
                    <TextField
                      label="Bio"
                      onBlur={handleBlur}
                      onChange={handleChange}
                      value={values.bio || ""}
                      name="bio"
                      autoComplete="off"
                      multiline
                      rows={3}
                      error={
                        Boolean(touched.bio) && Boolean(errors.bio)
                      }
                      helperText={touched.bio && errors.bio}
                      sx={{ gridColumn: "span 4" }}
                    />
                    <Box
                      gridColumn="span 4"
                      border={`1px solid ${palette.neutral.medium}`}
                      borderRadius="5px"
                      p="1rem"
                    >
                      <Dropzone
                        acceptedFiles={[".jpg", ".jpeg", ".png"]}
                        multiple={false}
                        onDrop={(acceptedFiles) =>
                          setFieldValue("picture", acceptedFiles[0])
                        }
                      >
                        {({ getRootProps, getInputProps }) => (
                          <Box
                            {...getRootProps()}
                            border={`2px dashed ${palette.primary.main}`}
                            p="1rem"
                            sx={{ "&:hover": { cursor: "pointer" } }}
                          >
                            <input {...getInputProps()} />
                            {!values.picture ? (
                              <p>Add Picture Here</p>
                            ) : (
                              <FlexBetween>
                                <Typography>{values.picture.name}</Typography>
                                <EditOutlinedIcon />
                              </FlexBetween>
                            )}
                          </Box>
                        )}
                      </Dropzone>
                    </Box>
                  </>
                )}

                <TextField
                  label="Email"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.email || ""}
                  name="email"
                  autoComplete="off"
                  error={Boolean(touched.email) && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  sx={{ gridColumn: "span 4" }}
                />
                <TextField
                  label="Password"
                  type="password"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.password || ""}
                  name="password"
                  autoComplete="off"
                  error={Boolean(touched.password) && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  sx={{ gridColumn: "span 4" }}
                />

                {/* Forgot Password Link */}
                <Box sx={{ gridColumn: "span 4", textAlign: "right", mt: 1 }}>
                  <Typography
                    onClick={() => setResetPasswordDialog({ open: true })}
                    sx={{
                      color: palette.primary.main,
                      "&:hover": {
                        cursor: "pointer",
                        color: palette.primary.light,
                        textDecoration: "underline",
                      },
                      fontSize: "0.875rem",
                    }}
                  >
                    Forgot Password?
                  </Typography>
                </Box>
              </Box>

              {/* BUTTONS */}
              <Box>
                <Button
                  fullWidth
                  type="submit"
                  sx={{
                    m: isNonMobile ? "2rem 0" : "1.5rem 0",
                    p: isNonMobile ? "1rem" : "1.25rem",
                    backgroundColor: palette.primary.main,
                    color: "white",
                    fontSize: isNonMobile ? "1rem" : "1.1rem",
                    fontWeight: 600,
                    "&:hover": { 
                      backgroundColor: palette.primary.dark,
                      color: "white"
                    },
                    borderRadius: "12px",
                    minHeight: "48px",
                  }}
                >
                  {isLogin ? "LOGIN" : "REGISTER"}
                </Button>
                <Typography
                  onClick={() => {
                    if (isLogin) {
                      handleSwitchToRegister();
                    } else {
                      handleSwitchToLogin();
                    }
                    resetForm();
                  }}
                  sx={{
                    textDecoration: "underline",
                    color: palette.primary.main,
                    "&:hover": {
                      cursor: "pointer",
                      color: palette.primary.light,
                    },
                    fontSize: isNonMobile ? "0.9rem" : "1rem",
                    textAlign: "center",
                    display: "block",
                    mt: isNonMobile ? 1 : 2,
                    px: 1,
                    py: 1,
                    borderRadius: "8px",
                    "&:active": {
                      backgroundColor: "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  {isLogin
                    ? "Don't have an account? Sign Up here."
                    : "Already have an account? Login here."}
                </Typography>
              </Box>
            </form>
          )}
        </Formik>
      )}

      {/* Password Reset Dialog */}
      <Dialog
        open={resetPasswordDialog.open}
        onClose={() => setResetPasswordDialog({ open: false })}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            m: isNonMobile ? 2 : 1,
            borderRadius: isNonMobile ? "12px" : "16px",
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: "center", 
          fontWeight: "bold",
          fontSize: isNonMobile ? "1.25rem" : "1.5rem",
          pb: 1
        }}>
          Reset Your Password
        </DialogTitle>
        <DialogContent sx={{ px: isNonMobile ? 3 : 2 }}>
          <Typography variant="body2" sx={{ 
            mb: 3, 
            textAlign: "center", 
            color: "text.secondary",
            fontSize: isNonMobile ? "0.875rem" : "1rem"
          }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          <TextField
            fullWidth
            type="email"
            label="Email Address"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            autoComplete="off"
            sx={{ 
              mb: 2,
              "& .MuiInputLabel-root": {
                fontSize: isNonMobile ? "0.9rem" : "1rem"
              },
              "& .MuiInputBase-input": {
                fontSize: isNonMobile ? "1rem" : "1.1rem",
                padding: isNonMobile ? "12px 14px" : "16px 14px"
              }
            }}
            required
          />
        </DialogContent>
        <DialogActions sx={{ 
          px: isNonMobile ? 3 : 2, 
          pb: isNonMobile ? 2 : 3,
          gap: 1,
          flexDirection: isNonMobile ? "row" : "column"
        }}>
          <Button
            onClick={() => setResetPasswordDialog({ open: false })}
            disabled={resetLoading}
            variant="outlined"
            fullWidth={!isNonMobile}
            sx={{
              minHeight: "44px",
              fontSize: isNonMobile ? "0.9rem" : "1rem"
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordResetRequest}
            variant="contained"
            disabled={resetLoading || !resetEmail}
            fullWidth={!isNonMobile}
            sx={{
              minHeight: "44px",
              fontSize: isNonMobile ? "0.9rem" : "1rem",
              fontWeight: 600
            }}
          >
            {resetLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Form;
