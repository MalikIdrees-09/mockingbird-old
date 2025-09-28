import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create transporter for sending emails (Zoho Mail)
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER || "verify_email@idrees.in",
    pass: process.env.EMAIL_PASSWORD || "KxrVn6drgGNt",
  },
  // Add debugging for connection issues
  debug: true,
  logger: true,
  // Add connection timeout
  connectionTimeout: 10000,
  // Add greeting timeout
  greetingTimeout: 10000,
  // Add socket timeout
  socketTimeout: 10000,
});

// Verify transporter configuration
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service is ready to send messages");
  } catch (error) {
    console.error("❌ Email service configuration error:", error);
  }
};

// Send verification email
export const sendVerificationEmail = async (email, otp) => {
  try {
    console.log("🚀 Starting verification email send...");
    console.log("📧 Email:", email);
    console.log("🔑 OTP:", otp);

    const mailOptions = {
      from: `"mockingbird.idrees.in" <${process.env.EMAIL_USER || "verify_email@idrees.in"}>`,
      to: email,
      subject: "Verify Your Email for Mockingbird",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Mockingbird</title>
          <style>
            :root {
              --bg-primary: #F8F8F8;
              --bg-secondary: #FFFFFF;
              --bg-tertiary: #FAFAFA;
              --text-primary: #424242;
              --text-secondary: #666666;
              --text-muted: #757575;
              --text-accent: #DAA520;
              --border: #E0E0E0;
              --border-light: #F0F0F0;
              --shadow-light: rgba(0,0,0,0.1);
              --shadow-medium: rgba(0,0,0,0.15);
              --primary-main: #1976D2;
              --primary-dark: #1565C0;
              --primary-light: #42A5F5;
              --secondary-main: #9C27B0;
              --secondary-dark: #7B1FA2;
              --secondary-light: #BA68C8;
              --accent-main: #FF9800;
              --accent-dark: #F57C00;
              --neutral-main: #757575;
              --neutral-dark: #616161;
              --success-bg: #E8F5E8;
              --success-border: #4CAF50;
              --success-text: #2E7D32;
              --warning-bg: #FFF8E1;
              --warning-border: #FFE082;
              --warning-text: #8B6914;
              --error-bg: #FFEBEE;
              --error-border: #EF5350;
              --error-text: #C62828;
              --gradient-orange: linear-gradient(135deg, #FFA726 0%, #FFD54F 100%);
            }

            @media (prefers-color-scheme: dark) {
              :root {
                --bg-primary: #121212;
                --bg-secondary: #1E1E1E;
                --bg-tertiary: #2A2A2A;
                --text-primary: #FFFFFF;
                --text-secondary: #B3B3B3;
                --text-muted: #888888;
                --text-accent: #FFD700;
                --border: #333333;
                --border-light: #404040;
                --shadow-light: rgba(0,0,0,0.3);
                --shadow-medium: rgba(0,0,0,0.4);
                --primary-main: #2196F3;
                --primary-dark: #1976D2;
                --primary-light: #64B5F6;
                --secondary-main: #BA68C8;
                --secondary-dark: #9C27B0;
                --secondary-light: #CE93D8;
                --accent-main: #FFB74D;
                --accent-dark: #FFA726;
                --neutral-main: #BDBDBD;
                --neutral-dark: #9E9E9E;
                --success-bg: #1B5E20;
                --success-border: #4CAF50;
                --success-text: #81C784;
                --warning-bg: #E65100;
                --warning-border: #FF9800;
                --warning-text: #FFD54F;
                --error-bg: #B71C1C;
                --error-border: #F44336;
                --error-text: #EF5350;
                --gradient-orange: linear-gradient(135deg, #FB8C00 0%, #FFEB3B 100%);
              }
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: var(--bg-primary);
              color: var(--text-primary);
              line-height: 1.6;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }

            .email-wrapper {
              width: 100%;
              background-color: var(--bg-primary);
              padding: 20px;
              text-align: center;
            }

            .email-container {
              max-width: 500px;
              margin: 0 auto;
              background-color: var(--bg-secondary);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 8px 32px var(--shadow-medium);
              border: 1px solid var(--border);
            }

            .email-header {
              background: var(--gradient-orange);
              padding: 35px 30px;
              text-align: center;
              position: relative;
              border-bottom: 3px solid var(--accent-dark);
            }

            .email-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
              pointer-events: none;
            }

            .email-logo {
              width: 200px;
              height: 112px;
              margin-bottom: 20px;
              filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
            }

            .email-title {
              font-family: 'Playfair Display', serif;
              font-size: 32px;
              font-weight: 700;
              color: var(--text-primary);
              margin: 15px 0;
              position: relative;
              z-index: 2;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              letter-spacing: -0.5px;
            }

            .email-subtitle {
              font-family: 'Lora', serif;
              font-size: 18px;
              font-style: italic;
              color: var(--text-secondary);
              margin-bottom: 0;
              position: relative;
              z-index: 2;
              opacity: 0.9;
            }

            .email-content {
              padding: 30px 30px;
            }

            .content-section {
              text-align: center;
              margin-bottom: 10px;
            }

            .welcome-text {
              font-size: 20px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 3px;
              line-height: 1.3;
            }

            .message-text {
              font-size: 14px;
              color: var(--text-secondary);
              line-height: 1.4;
              margin-bottom: 20px;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            }

            .otp-container {
              margin: 20px 0;
            }

            .otp-box {
              background: var(--gradient-orange);
              border-radius: 16px;
              padding: 35px;
              display: inline-block;
              border: 3px solid #FFFFFF;
              box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
              position: relative;
              overflow: hidden;
              min-width: 300px;
            }

            .otp-box::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.08) 100%);
              animation: shimmer 3s infinite;
              pointer-events: none;
            }

            @keyframes shimmer {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }

            .otp-label {
              color: #1a1a1a;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 20px;
              display: block;
              position: relative;
              z-index: 2;
              text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }

            .otp-code {
              color: #1a1a1a;
              font-size: 52px;
              font-weight: 900;
              letter-spacing: 12px;
              font-family: 'Courier New', monospace;
              display: block;
              margin: 0;
              position: relative;
              z-index: 2;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .instructions-section {
              background-color: var(--bg-tertiary);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }

            .instructions-text {
              font-size: 16px;
              color: var(--text-secondary);
              line-height: 1.6;
              margin-bottom: 10px;
            }

            .highlight-text {
              color: var(--accent-main);
              font-weight: 700;
              background: linear-gradient(135deg, var(--accent-main), var(--accent-dark));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-size: 18px;
            }

            .expiry-notice {
              font-size: 14px;
              color: var(--text-muted);
              text-align: center;
              margin-top: 20px;
              font-style: italic;
            }

            .email-footer {
              background-color: var(--bg-tertiary);
              padding: 30px;
              text-align: center;
              border-top: 1px solid var(--border);
            }

            .footer-logo {
              width: 60px;
              height: auto;
              margin-bottom: 10px;
              opacity: 0.7;
            }

            .footer-text {
              color: var(--text-muted);
              font-size: 14px;
              margin-bottom: 3px;
            }

            .footer-accent {
              color: var(--secondary-main);
              font-weight: 600;
            }

            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
              .email-wrapper {
                padding: 5px;
              }

              .email-container {
                border-radius: 8px;
                max-width: 100%;
                margin: 0;
              }

              .email-header {
                padding: 30px 15px;
              }

              .email-logo {
                width: 120px;
                margin-bottom: 10px;
              }

              .email-title {
                font-size: 24px;
                margin: 10px 0;
              }

              .email-subtitle {
                font-size: 14px;
              }

              .email-content {
                padding: 20px 15px;
              }

              .content-section {
                margin-bottom: 20px;
              }

              .welcome-text {
                font-size: 18px;
                margin-bottom: 10px;
              }

              .message-text {
                font-size: 14px;
                margin-bottom: 20px;
                max-width: 100%;
              }

              .otp-container {
                margin: 25px 0;
              }

              .otp-box {
                min-width: 200px;
                padding: 20px;
                border-radius: 12px;
              }

              .otp-label {
                font-size: 12px;
                margin-bottom: 10px;
                letter-spacing: 1px;
              }

              .otp-code {
                font-size: 36px;
                letter-spacing: 6px;
              }

              .instructions-section,
              .change-details {
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
              }

              .instructions-text {
                font-size: 14px;
                margin-bottom: 10px;
              }

              .highlight-text {
                font-size: 16px;
              }

              .expiry-notice {
                font-size: 13px;
                margin-top: 15px;
              }

              .action-button-container {
                margin: 25px 0;
              }

              .action-button {
                padding: 14px 24px;
                font-size: 16px;
                min-width: 160px;
                border-radius: 8px;
                display: block;
                width: 100%;
                max-width: 280px;
                margin: 0 auto;
                box-sizing: border-box;
              }

              .email-footer {
                padding: 20px 15px;
              }

              .footer-logo {
                width: 40px;
                margin-bottom: 10px;
              }

              .footer-text {
                font-size: 12px;
                margin-bottom: 3px;
              }

              /* Success message mobile styles */
              .success-message {
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
              }

              .success-message h3 {
                font-size: 16px;
                margin-bottom: 3px;
              }

              .success-message p {
                font-size: 14px;
              }

              .security-notice {
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
              }

              .security-notice h3 {
                font-size: 14px;
                margin-bottom: 3px;
              }

              .security-notice p {
                font-size: 13px;
              }

              .success-icon {
                font-size: 48px;
                margin-bottom: 10px;
              }

              /* Table styles for small screens */
              .change-details p {
                font-size: 14px;
                margin-bottom: 6px;
              }

              .change-details h3 {
                font-size: 16px;
                margin-bottom: 10px;
              }
            }

            /* Extra small mobile devices */
            @media only screen and (max-width: 480px) {
              .email-wrapper {
                padding: 2px;
              }

              .email-header {
                padding: 25px 12px;
              }

              .email-content {
                padding: 15px 12px;
              }

              .otp-box {
                min-width: 180px;
                padding: 18px;
              }

              .otp-code {
                font-size: 32px;
                letter-spacing: 4px;
              }

              .action-button {
                padding: 12px 20px;
                font-size: 15px;
                min-width: 140px;
              }

              .welcome-text {
                font-size: 16px;
              }

              .message-text {
                font-size: 13px;
              }

              .instructions-text {
                font-size: 13px;
              }

              .email-title {
                font-size: 22px;
              }
            }

            /* Large mobile and small tablets */
            @media only screen and (min-width: 601px) and (max-width: 768px) {
              .email-container {
                max-width: 520px;
              }

              .email-header {
                padding: 35px 25px;
              }

              .email-content {
                padding: 30px 25px;
              }

              .otp-box {
                min-width: 260px;
                padding: 28px;
              }

              .otp-code {
                font-size: 40px;
                letter-spacing: 9px;
              }

              .action-button {
                padding: 15px 28px;
                font-size: 16px;
                min-width: 170px;
              }

              .welcome-text {
                font-size: 20px;
              }

              .message-text {
                font-size: 14px;
              }
            }

            /* Desktop and large screen optimizations */
            @media only screen and (min-width: 1024px) {
              .email-container {
                max-width: 500px;
              }

              .email-header {
                padding: 40px 30px;
              }

              .email-logo {
                width: 160px;
              }

              .email-title {
                font-size: 34px;
              }

              .email-subtitle {
                font-size: 18px;
              }

              .email-content {
                padding: 35px 30px;
              }

              .otp-box {
                min-width: 320px;
                padding: 35px;
              }

              .otp-code {
                font-size: 50px;
                letter-spacing: 12px;
              }

              .action-button {
                padding: 18px 36px;
                font-size: 18px;
                min-width: 200px;
              }

              .welcome-text {
                font-size: 22px;
              }

              .message-text {
                font-size: 16px;
              }
            }

            /* Desktop and large screen optimizations */
            @media only screen and (min-width: 1024px) {
              .email-container {
                max-width: 500px;
              }

              .email-header {
                padding: 40px 30px;
              }

              .email-logo {
                width: 160px;
              }

              .email-title {
                font-size: 34px;
              }

              .email-subtitle {
                font-size: 18px;
              }

              .email-content {
                padding: 35px 30px;
              }

              .otp-box {
                min-width: 320px;
                padding: 35px;
              }

              .otp-code {
                font-size: 50px;
                letter-spacing: 12px;
              }

              .action-button {
                padding: 18px 36px;
                font-size: 18px;
                min-width: 200px;
              }

              .welcome-text {
                font-size: 22px;
              }

              .message-text {
                font-size: 16px;
              }
            }

            /* Touch device optimizations */
            @media (hover: none) and (pointer: coarse) {
              .action-button {
                min-height: 48px; /* Ensure touch targets are at least 48px */
                padding: 16px 24px;
              }

              .email-logo {
                pointer-events: none; /* Prevent accidental taps on logos */
              }
            }

            /* High DPI display optimizations */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
              .email-logo {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
              }

              .otp-code {
                font-synthesis: none;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            }

            /* Outlook-specific fixes */
            .ReadMsgBody { width: 100%; }
            .ExternalClass { width: 100%; }
            .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
            table { border-collapse: collapse; }
            body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <img src="https://email-logo.netlify.app/logo-4-email.png" alt="Mockingbird Logo" class="email-logo">
                <h1 class="email-title">Verify Your Email</h1>
               
              </div>

              <div class="email-content">
                <div class="content-section">
                  <h2 class="welcome-text">Welcome to Mockingbird!</h2>
                  <p class="message-text">Please verify your email address to complete your registration.</p>

                  <div class="otp-container">
                    <div class="otp-box">
                      <span class="otp-label">YOUR VERIFICATION CODE</span>
                      <span class="otp-code">${otp}</span>
                    </div>
                  </div>

                  <div class="instructions-section">
                    <p class="instructions-text">Enter <span class="highlight-text">this code</span> in the verification page to activate your account.</p>
                  </div>

                  <p class="expiry-notice">This code will expire in 10 minutes.</p>
                </div>
              </div>

              <div class="email-footer">
                <img src="https://email-logo.idrees.in/logo.png" alt="Mockingbird Logo" class="footer-logo">
                <p class="footer-text">© 2025 <span class="footer-accent">Malik Idrees Hasan Khan</span></p>
                <p class="footer-text"> </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Mockingbird!

Hi!
Welcome to Mockingbird!
Please verify your email address to complete your registration.

Your verification code is: ${otp}

Please enter this code in the verification page to activate your account.
This code will expire in 10 minutes.

Security Note: Do not share this verification code with anyone. Our team will never ask for your verification code.

© 2025 Malik Idrees Hasan Khan
This is an automated message, please do not reply.
`,
    };

    console.log("📧 Mail options prepared");
    console.log("📧 Sending email with transporter...");

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent successfully:", info.messageId);
    console.log("📧 Email sent to:", email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending verification email:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw new Error("Failed to send verification email");
  }
};

// Legacy sendMail function for backward compatibility
export const sendMail = (to, subject, message) => {
  const options = {
    from: `"Mockingbird Team" <${process.env.EMAIL_USER || "verify_email@idrees.in"}>`,
    to,
    subject,
    text: message,
  };

  transporter.sendMail(options, (error, info) => {
    if (error) console.log(error);
    else console.log(info)
  });
};

// Send email change verification
export const sendEmailChangeVerification = async (email, otp, oldEmail, newEmail) => {
  try {
    console.log("🚀 Starting email change verification send...");
    console.log("📧 New email:", email);
    console.log("📧 Old email:", oldEmail);
    console.log("🔢 OTP:", otp);

    const mailOptions = {
      from: `"Mockingbird Security" <${process.env.EMAIL_USER || "verify_email@idrees.in"}>`,
      to: email,
      subject: "Verify Your Email Address Change - Mockingbird",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Email Address Change - Mockingbird</title>
          <style>
            :root {
              --bg-primary: #F8F8F8;
              --bg-secondary: #FFFFFF;
              --bg-tertiary: #FAFAFA;
              --text-primary: #424242;
              --text-secondary: #666666;
              --text-muted: #757575;
              --text-accent: #DAA520;
              --border: #E0E0E0;
              --border-light: #F0F0F0;
              --shadow-light: rgba(0,0,0,0.1);
              --shadow-medium: rgba(0,0,0,0.15);
              --primary-main: #1976D2;
              --primary-dark: #1565C0;
              --primary-light: #42A5F5;
              --secondary-main: #9C27B0;
              --secondary-dark: #7B1FA2;
              --secondary-light: #BA68C8;
              --accent-main: #FF9800;
              --accent-dark: #F57C00;
              --neutral-main: #757575;
              --neutral-dark: #616161;
              --success-bg: #E8F5E8;
              --success-border: #4CAF50;
              --success-text: #2E7D32;
              --warning-bg: #FFF8E1;
              --warning-border: #FFE082;
              --warning-text: #8B6914;
              --error-bg: #FFEBEE;
              --error-border: #EF5350;
              --error-text: #C62828;
              --gradient-orange: linear-gradient(135deg, #FFA726 0%, #FFD54F 100%);
            }

            @media (prefers-color-scheme: dark) {
              :root {
                --bg-primary: #121212;
                --bg-secondary: #1E1E1E;
                --bg-tertiary: #2A2A2A;
                --text-primary: #FFFFFF;
                --text-secondary: #B3B3B3;
                --text-muted: #888888;
                --text-accent: #FFD700;
                --border: #333333;
                --border-light: #404040;
                --shadow-light: rgba(0,0,0,0.3);
                --shadow-medium: rgba(0,0,0,0.4);
                --primary-main: #2196F3;
                --primary-dark: #1976D2;
                --primary-light: #64B5F6;
                --secondary-main: #BA68C8;
                --secondary-dark: #9C27B0;
                --secondary-light: #CE93D8;
                --accent-main: #FFB74D;
                --accent-dark: #FFA726;
                --neutral-main: #BDBDBD;
                --neutral-dark: #9E9E9E;
                --success-bg: #1B5E20;
                --success-border: #4CAF50;
                --success-text: #81C784;
                --warning-bg: #E65100;
                --warning-border: #FF9800;
                --warning-text: #FFD54F;
                --error-bg: #B71C1C;
                --error-border: #F44336;
                --error-text: #EF5350;
                --gradient-orange: linear-gradient(135deg, #FB8C00 0%, #FFEB3B 100%);
              }
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: var(--bg-primary);
              color: var(--text-primary);
              line-height: 1.6;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }

            .email-wrapper {
              width: 100%;
              background-color: var(--bg-primary);
              padding: 20px;
              text-align: center;
            }

            .email-container {
              max-width: 500px;
              margin: 0 auto;
              background-color: var(--bg-secondary);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 8px 32px var(--shadow-medium);
              border: 1px solid var(--border);
            }

            .email-header {
              background: var(--gradient-orange);
              padding: 35px 30px;
              text-align: center;
              position: relative;
              border-bottom: 3px solid var(--accent-dark);
            }

            .email-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
              pointer-events: none;
            }

            .email-logo {
              width: 200px;
              height: auto;
              margin-bottom: 20px;
              filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
            }

            .email-title {
              font-family: 'Playfair Display', serif;
              font-size: 32px;
              font-weight: 700;
              color: var(--text-primary);
              margin: 15px 0;
              position: relative;
              z-index: 2;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              letter-spacing: -0.5px;
            }

            .email-subtitle {
              font-family: 'Lora', serif;
              font-size: 18px;
              font-style: italic;
              color: var(--text-secondary);
              margin-bottom: 0;
              position: relative;
              z-index: 2;
              opacity: 0.9;
            }

            .email-content {
              padding: 30px 30px;
            }

            .content-section {
              text-align: center;
              margin-bottom: 10px;
            }

            .welcome-text {
              font-size: 24px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 10px;
              line-height: 1.3;
            }

            .message-text {
              font-size: 16px;
              color: var(--text-secondary);
              line-height: 1.6;
              margin-bottom: 30px;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            }

            .change-details {
              background-color: var(--bg-tertiary);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 20px;
              margin: 25px 0;
              font-family: 'Courier New', monospace;
              text-align: center;
            }

            .change-details h3 {
              color: var(--primary-main);
              font-size: 18px;
              margin-bottom: 10px;
              font-weight: 600;
              font-family: 'Segoe UI', sans-serif;
            }

            .change-details p {
              color: var(--text-secondary);
              font-size: 16px;
              margin-bottom: 3px;
              font-weight: 500;
            }

            .otp-container {
              margin: 40px 0;
            }

            .otp-box {
              background: var(--gradient-orange);
              border-radius: 16px;
              padding: 35px;
              display: inline-block;
              border: 3px solid #FFFFFF;
              box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
              position: relative;
              overflow: hidden;
              min-width: 300px;
            }

            .otp-box::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.08) 100%);
              animation: shimmer 3s infinite;
              pointer-events: none;
            }

            @keyframes shimmer {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }

            .otp-label {
              color: #1a1a1a;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 20px;
              display: block;
              position: relative;
              z-index: 2;
              text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }

            .otp-code {
              color: #1a1a1a;
              font-size: 52px;
              font-weight: 900;
              letter-spacing: 12px;
              font-family: 'Courier New', monospace;
              display: block;
              margin: 0;
              position: relative;
              z-index: 2;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }

            .instructions-section {
              background-color: var(--bg-tertiary);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }

            .instructions-text {
              font-size: 16px;
              color: var(--text-secondary);
              line-height: 1.6;
              margin-bottom: 10px;
            }

            .highlight-text {
              color: var(--accent-main);
              font-weight: 700;
              background: linear-gradient(135deg, var(--accent-main), var(--accent-dark));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-size: 18px;
            }

            .expiry-notice {
              font-size: 14px;
              color: var(--text-muted);
              text-align: center;
              margin-top: 20px;
              font-style: italic;
            }

            .email-footer {
              background-color: var(--bg-tertiary);
              padding: 30px;
              text-align: center;
              border-top: 1px solid var(--border);
            }

            .footer-logo {
              width: 60px;
              height: auto;
              margin-bottom: 10px;
              opacity: 0.7;
            }

            .footer-text {
              color: var(--text-muted);
              font-size: 14px;
              margin-bottom: 3px;
            }

            .footer-accent {
              color: var(--secondary-main);
              font-weight: 600;
            }

            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
              .email-wrapper {
                padding: 5px;
              }

              .email-container {
                border-radius: 8px;
                max-width: 100%;
                margin: 0;
              }

              .email-header {
                padding: 30px 15px;
              }

              .email-logo {
                width: 120px;
                margin-bottom: 10px;
              }

              .email-title {
                font-size: 24px;
                margin: 10px 0;
              }

              .email-subtitle {
                font-size: 14px;
              }

              .email-content {
                padding: 20px 15px;
              }

              .content-section {
                margin-bottom: 20px;
              }

              .welcome-text {
                font-size: 18px;
                margin-bottom: 10px;
              }

              .message-text {
                font-size: 14px;
                margin-bottom: 20px;
                max-width: 100%;
              }

              .otp-container {
                margin: 25px 0;
              }

              .otp-box {
                min-width: 200px;
                padding: 20px;
                border-radius: 12px;
              }

              .otp-label {
                font-size: 12px;
                margin-bottom: 10px;
                letter-spacing: 1px;
              }

              .otp-code {
                font-size: 36px;
                letter-spacing: 6px;
              }

              .instructions-section,
              .change-details {
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
              }

              .instructions-text {
                font-size: 14px;
                margin-bottom: 10px;
              }

              .highlight-text {
                font-size: 16px;
              }

              .expiry-notice {
                font-size: 13px;
                margin-top: 15px;
              }

              .action-button-container {
                margin: 25px 0;
              }

              .action-button {
                padding: 14px 24px;
                font-size: 16px;
                min-width: 160px;
                border-radius: 8px;
                display: block;
                width: 100%;
                max-width: 280px;
                margin: 0 auto;
                box-sizing: border-box;
              }

              .email-footer {
                padding: 20px 15px;
              }

              .footer-logo {
                width: 40px;
                margin-bottom: 10px;
              }

              .footer-text {
                font-size: 12px;
                margin-bottom: 3px;
              }

              /* Success message mobile styles */
              .success-message {
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
              }

              .success-message h3 {
                font-size: 16px;
                margin-bottom: 3px;
              }

              .success-message p {
                font-size: 14px;
              }

              .security-notice {
                padding: 15px;
                margin: 15px 0;
                border-radius: 8px;
              }

              .security-notice h3 {
                font-size: 14px;
                margin-bottom: 3px;
              }

              .security-notice p {
                font-size: 13px;
              }

              .success-icon {
                font-size: 48px;
                margin-bottom: 10px;
              }

              /* Table styles for small screens */
              .change-details p {
                font-size: 14px;
                margin-bottom: 6px;
              }

              .change-details h3 {
                font-size: 16px;
                margin-bottom: 10px;
              }
            }

            /* Extra small mobile devices */
            @media only screen and (max-width: 480px) {
              .email-wrapper {
                padding: 2px;
              }

              .email-header {
                padding: 25px 12px;
              }

              .email-content {
                padding: 15px 12px;
              }

              .otp-box {
                min-width: 180px;
                padding: 18px;
              }

              .otp-code {
                font-size: 32px;
                letter-spacing: 4px;
              }

              .action-button {
                padding: 12px 20px;
                font-size: 15px;
                min-width: 140px;
              }

              .welcome-text {
                font-size: 16px;
              }

              .message-text {
                font-size: 13px;
              }

              .instructions-text {
                font-size: 13px;
              }

              .email-title {
                font-size: 22px;
              }
            }

            /* Large mobile and small tablets */
            @media only screen and (min-width: 601px) and (max-width: 768px) {
              .email-container {
                max-width: 520px;
              }

              .email-header {
                padding: 35px 25px;
              }

              .email-content {
                padding: 30px 25px;
              }

              .otp-box {
                min-width: 260px;
                padding: 28px;
              }

              .otp-code {
                font-size: 40px;
                letter-spacing: 9px;
              }

              .action-button {
                padding: 15px 28px;
                font-size: 16px;
                min-width: 170px;
              }

              .welcome-text {
                font-size: 20px;
              }

              .message-text {
                font-size: 14px;
              }
            }

            /* Desktop and large screen optimizations */
            @media only screen and (min-width: 1024px) {
              .email-container {
                max-width: 500px;
              }

              .email-header {
                padding: 40px 30px;
              }

              .email-logo {
                width: 160px;
              }

              .email-title {
                font-size: 34px;
              }

              .email-subtitle {
                font-size: 18px;
              }

              .email-content {
                padding: 35px 30px;
              }

              .otp-box {
                min-width: 320px;
                padding: 35px;
              }

              .otp-code {
                font-size: 50px;
                letter-spacing: 12px;
              }

              .action-button {
                padding: 18px 36px;
                font-size: 18px;
                min-width: 200px;
              }

              .welcome-text {
                font-size: 22px;
              }

              .message-text {
                font-size: 16px;
              }
            }

            /* Desktop and large screen optimizations */
            @media only screen and (min-width: 1024px) {
              .email-container {
                max-width: 500px;
              }

              .email-header {
                padding: 40px 30px;
              }

              .email-logo {
                width: 160px;
              }

              .email-title {
                font-size: 34px;
              }

              .email-subtitle {
                font-size: 18px;
              }

              .email-content {
                padding: 35px 30px;
              }

              .otp-box {
                min-width: 320px;
                padding: 35px;
              }

              .otp-code {
                font-size: 50px;
                letter-spacing: 12px;
              }

              .action-button {
                padding: 18px 36px;
                font-size: 18px;
                min-width: 200px;
              }

              .welcome-text {
                font-size: 22px;
              }

              .message-text {
                font-size: 16px;
              }
            }

            /* Touch device optimizations */
            @media (hover: none) and (pointer: coarse) {
              .action-button {
                min-height: 48px; /* Ensure touch targets are at least 48px */
                padding: 16px 24px;
              }

              .email-logo {
                pointer-events: none; /* Prevent accidental taps on logos */
              }
            }

            /* High DPI display optimizations */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
              .email-logo {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
              }

              .otp-code {
                font-synthesis: none;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            }

            /* Outlook-specific fixes */
            .ReadMsgBody { width: 100%; }
            .ExternalClass { width: 100%; }
            .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
            table { border-collapse: collapse; }
            body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <img src="https://email-logo.netlify.app/logo-4-email.png" alt="Mockingbird Logo" class="email-logo">
                <h1 class="email-title">Verify Email Change</h1>
               </div>

              <div class="email-content">
                <div class="content-section">
                  <h2 class="welcome-text">Email Address Update</h2>
                  <p class="message-text">You have requested to change your email address for your Mockingbird account. Please verify the new email address below.</p>

                  <div class="change-details">
                    <h3>📧 Change Details</h3>
                    <p><strong>From:</strong> ${oldEmail}</p>
                    <p><strong>To:</strong> ${newEmail}</p>
                  </div>

                  <div class="otp-container">
                    <div class="otp-box">
                      <span class="otp-label">VERIFICATION CODE</span>
                      <span class="otp-code">${otp}</span>
                    </div>
                  </div>

                  <div class="instructions-section">
                    <p class="instructions-text">Enter <span class="highlight-text">this code</span> in the verification page to complete your email change.</p>
                  </div>

                  <p class="expiry-notice">This code will expire in 10 minutes.</p>
                </div>
              </div>

              <div class="email-footer">
                <img src="https://email-logo.idrees.in/logo.png" alt="Mockingbird Logo" class="footer-logo">
                <p class="footer-text">© 2025 <span class="footer-accent">Malik Idrees Hasan Khan</span></p>
                <p class="footer-text"> </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Email Address Change Verification - Mockingbird

You have requested to change your email address for your Mockingbird account.

CHANGE DETAILS:
From: ${oldEmail}
To: ${newEmail}

Your verification code is: ${otp}

Please enter this code in the Mockingbird app to complete your email address change.

This code expires in 10 minutes for security reasons.

If you did not request this email address change, please ignore this email.
Your current email address will remain unchanged.

© 2025 Malik Idrees Hasan Khan
This is an automated message, please do not reply.
`,
    };

    console.log("📧 Email change verification prepared");
    console.log("📧 Sending email change verification...");

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email change verification sent successfully:", info.messageId);
    console.log("📧 Email change verification sent to:", email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email change verification:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw new Error("Failed to send email change verification");
  }
};

// Send email change confirmation
export const sendEmailChangeConfirmation = async (email, oldEmail) => {
  try {
    console.log("🚀 Starting email change confirmation send...");
    console.log("📧 New email:", email);
    console.log("📧 Old email:", oldEmail);

    const mailOptions = {
      from: `"Mockingbird Security" <${process.env.EMAIL_USER || "verify_email@idrees.in"}>`,
      to: email,
      subject: "Your Email Address Has Been Changed - Mockingbird",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #DAA520, #A0522D); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Email Address Updated</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333; text-align: center; margin-bottom: 20px;">
              Your email address has been successfully changed for your Mockingbird account.
            </p>

            <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
              <p style="color: #2e7d32; margin: 0; font-weight: bold;">
                ✅ Change Confirmed: Your account email has been updated to this address.
              </p>
              </div>

              <div class="email-content">
                <div style="text-align: center;">
                  <div class="success-icon">✅</div>
                </div>

                <div class="success-message">
                  <h3>✅ Change Confirmed</h3>
                  <p>Your account email has been updated to this address.</p>
                </div>

                <div class="change-details">
                  <h3>📧 Email Change Details</h3>
                  <p><strong>New Email:</strong> ${email}</p>
                  <p><strong>Previous Email:</strong> ${oldEmail}</p>
                </div>

                <div class="security-notice">
                  <h3>🔐 Security Notice</h3>
                  <p><strong>Important:</strong> For your account security, I recommend reviewing your account settings. If you did not request this change, please reach out to me (Malik Idrees Hasan Khan) immediately.</p>
                </div>
              </div>

              <div class="email-footer">
                <img src="https://email-logo.idrees.in/logo.png" alt="Mockingbird Logo" class="footer-logo">
                <p class="footer-text">© 2025 <span class="footer-accent">Malik Idrees Hasan Khan</span></p>
                <p class="footer-text"> </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Email Address Updated - Mockingbird

Your email address has been successfully changed for your Mockingbird account.

Change Confirmed: Your account email has been updated to this address.

New Email: ${email}
Previous Email: ${oldEmail}

 If you did not request this change, please reach out to me (Malik Idrees Hasan Khan) immediately.

Security Notice: For your account security, I recommend reviewing your account settings.

© 2025 Malik Idrees Hasan Khan
This is an automated message, please do not reply.
`,
    };

    console.log("📧 Email change confirmation prepared");
    console.log("📧 Sending confirmation email...");

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email change confirmation sent successfully:", info.messageId);
    console.log("📧 Confirmation email sent to:", email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email change confirmation:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    throw new Error("Failed to send email change confirmation");
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://mockingbird.idrees.in'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Mockingbird Security" <${process.env.EMAIL_USER || "verify_email@idrees.in"}>`,
      to: email,
      subject: "Reset Your Mockingbird Password",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Mockingbird</title>
          <style>
            :root {
              --bg-primary: #F8F8F8;
              --bg-secondary: #FFFFFF;
              --bg-tertiary: #FAFAFA;
              --text-primary: #424242;
              --text-secondary: #666666;
              --text-muted: #757575;
              --text-accent: #DAA520;
              --border: #E0E0E0;
              --border-light: #F0F0F0;
              --shadow-light: rgba(0,0,0,0.1);
              --shadow-medium: rgba(0,0,0,0.15);
              --primary-main: #1976D2;
              --primary-dark: #1565C0;
              --primary-light: #42A5F5;
              --secondary-main: #9C27B0;
              --secondary-dark: #7B1FA2;
              --secondary-light: #BA68C8;
              --accent-main: #FF9800;
              --accent-dark: #F57C00;
              --neutral-main: #757575;
              --neutral-dark: #616161;
              --success-bg: #E8F5E8;
              --success-border: #4CAF50;
              --success-text: #2E7D32;
              --warning-bg: #FFF8E1;
              --warning-border: #FFE082;
              --warning-text: #8B6914;
              --error-bg: #FFEBEE;
              --error-border: #EF5350;
              --error-text: #C62828;
              --gradient-orange: linear-gradient(135deg, #FFA726 0%, #FFD54F 100%);
            }

            @media (prefers-color-scheme: dark) {
              :root {
                --bg-primary: #121212;
                --bg-secondary: #1E1E1E;
                --bg-tertiary: #2A2A2A;
                --text-primary: #FFFFFF;
                --text-secondary: #B3B3B3;
                --text-muted: #888888;
                --text-accent: #FFD700;
                --border: #333333;
                --border-light: #404040;
                --shadow-light: rgba(0,0,0,0.3);
                --shadow-medium: rgba(0,0,0,0.4);
                --primary-main: #2196F3;
                --primary-dark: #1976D2;
                --primary-light: #64B5F6;
                --secondary-main: #BA68C8;
                --secondary-dark: #9C27B0;
                --secondary-light: #CE93D8;
                --accent-main: #FFB74D;
                --accent-dark: #FFA726;
                --neutral-main: #BDBDBD;
                --neutral-dark: #9E9E9E;
                --success-bg: #1B5E20;
                --success-border: #4CAF50;
                --success-text: #81C784;
                --warning-bg: #E65100;
                --warning-border: #FF9800;
                --warning-text: #FFD54F;
                --error-bg: #B71C1C;
                --error-border: #F44336;
                --error-text: #EF5350;
                --gradient-orange: linear-gradient(135deg, #FB8C00 0%, #FFEB3B 100%);
              }

              .action-button {
                color: #FFFFFF !important;
              }
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: var(--bg-primary);
              color: var(--text-primary);
              line-height: 1.6;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }

            .email-wrapper {
              width: 100%;
              background-color: var(--bg-primary);
              padding: 20px;
              text-align: center;
            }

            .email-container {
              max-width: 500px;
              margin: 0 auto;
              background-color: var(--bg-secondary);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 8px 32px var(--shadow-medium);
              border: 1px solid var(--border);
            }

            .email-header {
              background: var(--gradient-orange);
              padding: 35px 30px;
              text-align: center;
              position: relative;
              border-bottom: 3px solid var(--accent-dark);
            }

            .email-header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%);
              pointer-events: none;
            }

            .email-logo {
              width: 200px;
              height: auto;
              margin-bottom: 20px;
              filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
            }

            .email-title {
              font-family: 'Playfair Display', serif;
              font-size: 32px;
              font-weight: 700;
              color: var(--text-primary);
              margin: 15px 0;
              position: relative;
              z-index: 2;
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              letter-spacing: -0.5px;
            }

            .email-subtitle {
              font-family: 'Lora', serif;
              font-size: 18px;
              font-style: italic;
              color: var(--text-secondary);
              margin-bottom: 0;
              position: relative;
              z-index: 2;
              opacity: 0.9;
            }

            .email-content {
              padding: 30px 30px;
            }

            .content-section {
              text-align: center;
              margin-bottom: 10px;
            }

            .welcome-text {
              font-size: 24px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 10px;
              line-height: 1.3;
            }

            .message-text {
              font-size: 16px;
              color: var(--text-secondary);
              line-height: 1.6;
              margin-bottom: 30px;
              max-width: 400px;
              margin-left: auto;
              margin-right: auto;
            }

            .action-button-container {
              text-align: center;
              margin: 40px 0;
            }

            .action-button {
              display: inline-block;
              background: var(--gradient-orange);
              color: #FFD700 !important;
              padding: 18px 36px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 700;
              font-size: 18px;
              text-align: center;
              box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
              border: 3px solid #FF6F00;
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
              min-width: 200px;
            }

            .action-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 30px rgba(255, 152, 0, 0.5);
            }

            .action-button::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.08) 100%);
              animation: shimmer 3s infinite;
              pointer-events: none;
            }

            @keyframes shimmer {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }

            .instructions-section {
              background-color: var(--bg-tertiary);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
            }

            .instructions-text {
              font-size: 16px;
              color: var(--text-secondary);
              line-height: 1.6;
              margin-bottom: 10px;
            }

            .highlight-text {
              color: var(--accent-main);
              font-weight: 700;
              background: linear-gradient(135deg, var(--accent-main), var(--accent-dark));
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-size: 18px;
            }

            .expiry-notice {
              font-size: 14px;
              color: var(--text-muted);
              text-align: center;
              margin-top: 20px;
              font-style: italic;
            }

            .email-footer {
              background-color: var(--bg-tertiary);
              padding: 30px;
              text-align: center;
              border-top: 1px solid var(--border);
            }

            .footer-logo {
              width: 60px;
              height: auto;
              margin-bottom: 10px;
              opacity: 0.7;
            }

            .footer-text {
              color: var(--text-muted);
              font-size: 14px;
              margin-bottom: 3px;
            }

            .footer-accent {
              color: var(--secondary-main);
              font-weight: 600;
            }

            /* Mobile responsive */
            @media only screen and (max-width: 600px) {
              .email-wrapper {
                padding: 10px;
              }

              .email-container {
                border-radius: 12px;
              }

              .email-header {
                padding: 40px 20px;
              }

              .email-title {
                font-size: 28px;
              }

              .email-content {
                padding: 30px 20px;
              }

              .action-button {
                padding: 16px 28px;
                font-size: 16px;
                min-width: 180px;
              }

              .welcome-text {
                font-size: 20px;
              }
            }

            /* Desktop and large screen optimizations */
            @media only screen and (min-width: 1024px) {
              .email-container {
                max-width: 500px;
              }

              .email-header {
                padding: 40px 30px;
              }

              .email-logo {
                width: 160px;
              }

              .email-title {
                font-size: 34px;
              }

              .email-subtitle {
                font-size: 18px;
              }
              .email-content {
                padding: 35px 30px;
              }

              .action-button {
                padding: 18px 36px;
                font-size: 18px;
                min-width: 200px;
              }

              .welcome-text {
                font-size: 22px;
              }

              .message-text {
                font-size: 16px;
              }
            }

            /* Touch device optimizations */
            @media (hover: none) and (pointer: coarse) {
              .action-button {
                min-height: 48px; /* Ensure touch targets are at least 48px */
                padding: 16px 24px;
              }

              .email-logo {
                pointer-events: none; /* Prevent accidental taps on logos */
              }
            }

            /* High DPI display optimizations */
            @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
              .email-logo {
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
              }

              .action-button {
                font-synthesis: none;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
            }

            /* Outlook-specific fixes */
            .ReadMsgBody { width: 100%; }
            .ExternalClass { width: 100%; }
            .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
            table { border-collapse: collapse; }
            body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="email-header">
                <img src="https://email-logo.netlify.app/logo-4-email.png" alt="Mockingbird Logo" class="email-logo">
                <h1 class="email-title">Password Reset Request</h1>
               
              </div>

              <div class="email-content">
                <div class="content-section">
                  <h2 class="welcome-text">🔐 Reset Your Password</h2>
                  <p class="message-text">We received a request to reset your password for your Mockingbird account. Click the button below to create a new password.</p>

                  <div class="action-button-container">
                    <a href="${resetUrl}" class="action-button" style="color: #FFD700 !important; display: inline-block; background: linear-gradient(135deg, #FFA726 0%, #FFD54F 100%); padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 18px; text-align: center; box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4); border: 3px solid #FF6F00; transition: all 0.3s ease; position: relative; overflow: hidden; min-width: 200px;">
                      Reset My Password
                    </a>
                  </div>

                  <div class="instructions-section">
                    <p class="instructions-text">Clicking the button above will take you to a secure page where you can set your new password.</p>
                    <p class="instructions-text">After resetting, you'll be able to log in with your new credentials immediately.</p>
                  </div>

                  <p class="expiry-notice">This link will expire in 1 hour for security reasons. If you didn't request this password reset, please ignore this email.</p>
                </div>
              </div>

              <div class="email-footer">
                <img src="https://email-logo.idrees.in/logo.png" alt="Mockingbird Logo" class="footer-logo">
                <p class="footer-text">© 2025 <span class="footer-accent">Malik Idrees Hasan Khan</span></p>
                <p class="footer-text"> </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request for Mockingbird

We received a request to reset your password for your Mockingbird account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

Security Notice:
If you didn't request this password reset, please ignore this email.
Your password will remain unchanged.

© 2025 Malik Idrees Hasan Khan
This is an automated message, please do not reply.
`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

export default transporter;
export { verifyTransporter };
