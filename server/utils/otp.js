import crypto from 'crypto';

// Generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a secure verification token
export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Check if OTP is expired
export const isOTPExpired = (otpExpiry) => {
  return new Date() > new Date(otpExpiry);
};

// Calculate OTP expiry time (10 minutes from now)
export const getOTPExpiry = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10); // 10 minutes expiry
  return now;
};

// Validate OTP format (6 digits)
export const validateOTPFormat = (otp) => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};
