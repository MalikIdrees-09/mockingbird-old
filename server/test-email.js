import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const testEmailConfiguration = async () => {
  console.log("🧪 TESTING EMAIL CONFIGURATION...\n");

  // Display current configuration (without showing password)
  console.log("📧 Current Configuration:");
  console.log(`   Email User: ${process.env.EMAIL_USER}`);
  console.log(`   SMTP Host: smtppro.zoho.com`);
  console.log(`   SMTP Port: 465`);
  console.log(`   Has Password: ${!!process.env.EMAIL_PASSWORD ? '✅' : '❌'}\n`);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    console.log("🔗 Testing SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!\n");

    console.log("📤 Sending test email...");

    const mailOptions = {
      from: `"Mockingbird Test" <${process.env.EMAIL_USER}>`,
      to: 'malikidreeshasankhan@outlook.com', // Send to your email
      subject: "🧪 Mockingbird Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #DAA520;">🎉 Email Test Successful!</h2>
          <p>Your Mockingbird email configuration is working correctly.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>SMTP Host: smtppro.zoho.com</li>
            <li>Port: 465 (SSL)</li>
            <li>Authentication: ✅ Working</li>
          </ul>
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `
        🎉 Email Test Successful!

        Your Mockingbird email configuration is working correctly.

        Test Details:
        - SMTP Host: smtppro.zoho.com
        - Port: 465 (SSL)
        - Authentication: Working

        Sent at: ${new Date().toLocaleString()}
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Test email sent successfully!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Sent to: malikidreeshasankhan@outlook.com\n`);

    console.log("🎉 ALL TESTS PASSED! Email configuration is working correctly.");
    console.log("📋 You can now use email verification in your Mockingbird app.");

  } catch (error) {
    console.log("❌ EMAIL CONFIGURATION ERROR:");
    console.log(`   Error Code: ${error.code || 'Unknown'}`);
    console.log(`   Error Message: ${error.message}`);

    if (error.code === 'EAUTH') {
      console.log("\n🔧 POSSIBLE SOLUTIONS:");
      console.log("   1. Generate new app password in Zoho Mail settings");
      console.log("   2. Ensure 2FA is enabled on your Zoho account");
      console.log("   3. Check if app password is correct in .env file");
      console.log("   4. Try using 'smtp.zoho.com' instead of 'smtppro.zoho.com'");
    }

    console.log("\n📖 For help with Zoho Mail setup:");
    console.log("   https://www.zoho.com/mail/help/api/using-application-specific-password.html");
  }
};

// Run the test
testEmailConfiguration();
