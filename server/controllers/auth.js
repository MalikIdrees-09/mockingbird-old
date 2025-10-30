import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendVerificationEmail, sendEmailChangeConfirmation, sendEmailChangeVerification, sendPasswordResetEmail } from "../utils/nodemailer.js";
import { generateOTP, getOTPExpiry, generateVerificationToken, isOTPExpired, validateOTPFormat } from "../utils/otp.js";

/* REGISTER USER */
const register = async (req, res) => {
  try {
    console.log("Registration attempt with data:", req.body);
    console.log("Files received:", req.file);

    const {
      firstName,
      lastName,
      email,
      password,
      picturePath,
      friends,
      location,
      bio,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      console.log("Missing required fields:", { firstName, lastName, email, password: !!password });
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["firstName", "lastName", "email", "password"],
        received: { firstName, lastName, email, password: !!password }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists with email:", email);
      return res.status(400).json({ 
        error: "User already exists with this email",
        email: email
      });
    }

    console.log("Hashing password...");
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    console.log("Creating new user...");
    
    // Handle picture path - use uploaded file name if available, otherwise use default
    let finalPicturePath = "default.jpg"; // Default profile picture
    if (req.file) {
      finalPicturePath = req.file.filename;
      console.log("File uploaded:", req.file.filename);
    } else if (picturePath) {
      finalPicturePath = picturePath;
      console.log("Using provided picturePath:", picturePath);
    } else {
      console.log("Using default profile picture: default.jpg");
    }

    // Generate OTP and verification token
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    const verificationToken = generateVerificationToken();

    console.log(`Generated OTP: ${otp} (expires: ${otpExpiry})`);
    
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      picturePath: finalPicturePath,
      friends: friends || [],
      location: location || "",
      bio: bio || "",
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
      isVerified: false, // User starts as unverified
      verificationOTP: otp,
      otpExpiry: otpExpiry,
      verificationToken: verificationToken,
    });

    console.log("Saving user to database...");
    const savedUser = await newUser.save();
    console.log("User saved successfully:", savedUser.email);

    // Send verification email
    try {
      console.log("Sending verification email...");
      await sendVerificationEmail(savedUser.email, otp);
      console.log("Verification email sent successfully");
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Don't fail registration if email fails, but log it
    }
    
    // Return response indicating verification is required
    res.status(201).json({
      message: "Registration successful! Please check your email for verification code.",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        picturePath: savedUser.picturePath,
        isVerified: false,
        verificationRequired: true,
      },
      requiresVerification: true,
    });
  } catch (err) {
    console.error("Registration error:", err);
    
    // Handle specific MongoDB errors
    if (err.code === 11000) {
      return res.status(400).json({ 
        error: "Email already exists",
        field: Object.keys(err.keyPattern)[0]
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation failed",
        details: err.message
      });
    }

    res.status(500).json({ 
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};

/* LOGGING IN */
const login = async (req, res) => {
  try {
    console.log("Login attempt:", req.body);
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({ 
        msg: "Email and password are required",
        error: "MISSING_CREDENTIALS"
      });
    }

    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET not found in environment variables");
      return res.status(500).json({ 
        msg: "Server configuration error",
        error: "MISSING_JWT_SECRET"
      });
    }

    console.log("Looking for user with email:", email);
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(400).json({ 
        msg: "User does not exist",
        error: "USER_NOT_FOUND"
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      console.log("Banned user attempted login:", email);
      const banDate = user.bannedAt ? new Date(user.bannedAt).toLocaleDateString() : "Unknown";
      return res.status(403).json({
        message: "Your account has been banned",
        error: "USER_BANNED",
        bannedAt: banDate,
        bannedBy: user.bannedBy || "Administrator",
        logout: true, // Client should handle logout
        details: "Your account has been suspended. If you feel this is a mistake, reach out to me at malikidreeshasankhan@idrees.in and provide an explanation"
      });
    }

    // Check if user email is verified
    if (!user.isVerified) {
      console.log("Unverified user attempted login:", email);
      return res.status(403).json({
        msg: "Email not verified",
        error: "EMAIL_NOT_VERIFIED",
        details: "Please verify your email address before logging in. Check your email for the verification code.",
        email: user.email,
        requiresVerification: true,
      });
    }

    console.log("User found, checking password");
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(400).json({ 
        msg: "Invalid credentials",
        error: "INVALID_PASSWORD"
      });
    }

    console.log("Password match, generating token");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    // Create user object without password
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      picturePath: user.picturePath,
      friends: user.friends,
      friendRequests: user.friendRequests,
      sentFriendRequests: user.sentFriendRequests,
      location: user.location,
      bio: user.bio,
      viewedProfile: user.viewedProfile,
      impressions: user.impressions,
      isAdmin: user.isAdmin,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    console.log("Login successful for user:", email);
    res.status(200).json({ token, user: userResponse });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};

/* VERIFY EMAIL WITH OTP */
const verifyEmail = async (req, res) => {
  try {
    console.log("Email verification attempt:", req.body);

    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        msg: "Email and OTP are required",
        error: "MISSING_FIELDS"
      });
    }

    // Validate OTP format
    if (!validateOTPFormat(otp)) {
      return res.status(400).json({
        msg: "Invalid OTP format. Please enter a 6-digit code.",
        error: "INVALID_OTP_FORMAT"
      });
    }

    console.log("Looking for user with email:", email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        msg: "Email is already verified",
        error: "ALREADY_VERIFIED"
      });
    }

    // Check if OTP exists
    if (!user.verificationOTP) {
      return res.status(400).json({
        msg: "No verification code found. Please request a new one.",
        error: "NO_OTP_FOUND"
      });
    }

    // Check if OTP has expired
    if (isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({
        msg: "Verification code has expired. Please request a new one.",
        error: "OTP_EXPIRED"
      });
    }

    // Verify OTP
    if (user.verificationOTP !== otp) {
      return res.status(400).json({
        msg: "Invalid verification code",
        error: "INVALID_OTP"
      });
    }

    // Update user as verified and clear verification fields
    user.isVerified = true;
    user.verificationOTP = null;
    user.otpExpiry = null;
    user.verificationToken = null;

    await user.save();

    // Generate JWT token for auto-login after verification
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Create user response object
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      picturePath: user.picturePath,
      friends: user.friends,
      friendRequests: user.friendRequests,
      sentFriendRequests: user.sentFriendRequests,
      location: user.location,
      bio: user.bio,
      viewedProfile: user.viewedProfile,
      impressions: user.impressions,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log("Email verification successful for user:", email);
    res.status(200).json({
      message: "Email verified successfully! Welcome to Mockingbird!",
      token,
      user: userResponse
    });

  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};

/* CHANGE PASSWORD */
const changePassword = async (req, res) => {
  try {
    console.log("Password change attempt");

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        msg: "Current password and new password are required",
        error: "MISSING_FIELDS"
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        msg: "New password must be at least 6 characters long",
        error: "PASSWORD_TOO_SHORT"
      });
    }

    console.log("Looking for user with ID:", userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        msg: "Current password is incorrect",
        error: "INVALID_CURRENT_PASSWORD"
      });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        msg: "New password must be different from current password",
        error: "SAME_PASSWORD"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = newPasswordHash;
    await user.save();

    console.log("Password changed successfully for user:", user.email);
    res.status(200).json({
      message: "Password changed successfully",
      email: user.email
    });

  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};

/* CHANGE EMAIL ADDRESS */
const changeEmail = async (req, res) => {
  try {
    console.log("Email change attempt");

    const { currentPassword, newEmail } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newEmail) {
      return res.status(400).json({
        msg: "Current password and new email are required",
        error: "MISSING_FIELDS"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        msg: "Invalid email format",
        error: "INVALID_EMAIL_FORMAT"
      });
    }

    console.log("Looking for user with ID:", userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        msg: "Current password is incorrect",
        error: "INVALID_CURRENT_PASSWORD"
      });
    }

    // Check if new email is different from current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({
        msg: "New email must be different from current email",
        error: "SAME_EMAIL"
      });
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        msg: "This email is already registered to another account",
        error: "EMAIL_ALREADY_EXISTS"
      });
    }

    // Store old email for logging
    const oldEmail = user.email;

    // Update email but mark as unverified
    user.email = newEmail.toLowerCase();
    user.isVerified = false;

    // Generate new OTP and verification details for email change
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    const verificationToken = generateVerificationToken();

    user.verificationOTP = otp;
    user.otpExpiry = otpExpiry;
    user.verificationToken = verificationToken;

    await user.save();

    // Send email change verification to new address
    try {
      console.log("Sending email change verification to new address...");
      await sendEmailChangeVerification(user.email, otp, oldEmail, newEmail);
      console.log("Email change verification sent successfully to new address");
    } catch (emailError) {
      console.error("Failed to send email change verification to new address:", emailError);
      return res.status(500).json({
        msg: "Email address updated but failed to send verification email. Please try resending verification.",
        error: "EMAIL_SEND_FAILED"
      });
    }

    console.log(`Email change initiated from ${oldEmail} to ${user.email} - verification required`);
    res.status(200).json({
      message: "Email change initiated! Please check your new email address for the verification code.",
      newEmail: user.email,
      requiresVerification: true,
      verificationMessage: "A verification code has been sent to your new email address. Please enter it to complete the email change."
    });

  } catch (err) {
    console.error("Email change error:", err);
    res.status(500).json({
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};

/* REQUEST PASSWORD RESET */
const requestPasswordReset = async (req, res) => {
  try {
    console.log("Password reset request attempt");

    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        msg: "Email is required",
        error: "MISSING_EMAIL"
      });
    }

    console.log("Looking for user with email:", email);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If this email is registered, a password reset link has been sent."
      });
    }

    // Generate reset token and expiry
    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.verificationToken = resetToken;
    user.otpExpiry = resetTokenExpiry;

    await user.save();

    // Send password reset email
    try {
      console.log("Sending password reset email...");
      await sendPasswordResetEmail(user.email, resetToken);
      console.log("Password reset email sent successfully");
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return res.status(500).json({
        msg: "Failed to send password reset email. Please try again.",
        error: "EMAIL_SEND_FAILED"
      });
    }

    console.log("Password reset request processed for user:", user.email);
    res.status(200).json({
      message: "If this email is registered, a password reset link has been sent."
    });

  } catch (err) {
    console.error("Password reset request error:", err);
    res.status(500).json({
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};

/* RESEND VERIFICATION EMAIL */
const resendVerification = async (req, res) => {
  try {
    console.log("Resend verification attempt:", req.body);

    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        msg: "Email is required",
        error: "MISSING_EMAIL"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        msg: "Invalid email format",
        error: "INVALID_EMAIL_FORMAT"
      });
    }

    console.log("Looking for user with email:", email);
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If this email is registered, a verification code has been sent."
      });
    }

    // Check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({
        msg: "Email is already verified",
        error: "ALREADY_VERIFIED"
      });
    }

    // Check if OTP exists
    if (!user.verificationOTP) {
      return res.status(400).json({
        msg: "No verification code found. Please register again.",
        error: "NO_OTP_FOUND"
      });
    }

    // Generate new OTP and update expiry
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.verificationOTP = otp;
    user.otpExpiry = otpExpiry;

    await user.save();

    // Send verification email
    try {
      console.log("Sending verification email...");
      await sendVerificationEmail(user.email, otp);
      console.log("Verification email sent successfully");
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({
        msg: "Failed to send verification email. Please try again.",
        error: "EMAIL_SEND_FAILED"
      });
    }

    console.log("Verification email resent for user:", user.email);
    res.status(200).json({
      message: "Verification code has been sent to your email.",
      email: user.email
    });

  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};

/* RESET PASSWORD WITH TOKEN */
const resetPassword = async (req, res) => {
  try {
    console.log("Password reset attempt with token");

    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        msg: "Reset token and new password are required",
        error: "MISSING_FIELDS"
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        msg: "Password must be at least 6 characters long",
        error: "PASSWORD_TOO_SHORT"
      });
    }

    console.log("Looking for user with reset token:", token);
    const user = await User.findOne({
      verificationToken: token,
      otpExpiry: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid or expired reset token",
        error: "INVALID_TOKEN"
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.password = newPasswordHash;
    user.verificationToken = null;
    user.otpExpiry = null;

    await user.save();

    console.log("Password reset successfully for user:", user.email);
    res.status(200).json({
      message: "Password reset successfully! You can now log in with your new password.",
      email: user.email
    });

  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({
      error: err.message,
      type: "SERVER_ERROR"
    });
  }
};
const submitAppeal = async (req, res) => {
  try {
    const { appealReason, banReason } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!appealReason || appealReason.trim().length === 0) {
      return res.status(400).json({ message: "Appeal reason is required" });
    }

    if (appealReason.length > 1000) {
      return res.status(400).json({ message: "Appeal reason cannot exceed 1000 characters" });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is actually banned
    if (!user.isBanned) {
      return res.status(400).json({ message: "You are not currently banned" });
    }

    console.log(`🎯 New ban appeal submitted by ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`📝 Appeal reason: ${appealReason}`);
    console.log(`🚫 Original ban reason: ${banReason}`);

    // TODO: In a real application, you would:
    // 1. Save the appeal to a database table
    // 2. Send email notifications to admins
    // 3. Create a moderation queue
    // For now, we'll just log it and acknowledge receipt

    // You could also create an Appeal model to store appeals:
    // const appeal = new Appeal({
    //   userId,
    //   userName: `${user.firstName} ${user.lastName}`,
    //   userEmail: user.email,
    //   appealReason: appealReason.trim(),
    //   originalBanReason: banReason,
    //   banDate: user.bannedAt,
    //   bannedBy: user.bannedBy,
    //   status: 'pending'
    // });
    // await appeal.save();

    res.status(200).json({
      message: "Appeal submitted successfully. Our moderation team will review your case and respond via email.",
      appealId: `appeal_${Date.now()}`, // Mock appeal ID
    });

  } catch (err) {
    console.error("Appeal submission error:", err);
    res.status(500).json({ message: err.message });
  }
};

export { login, register, verifyEmail, changePassword, changeEmail, requestPasswordReset, resetPassword, resendVerification, submitAppeal };
