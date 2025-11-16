const nodemailer = require('nodemailer');

// Configuration Mailtrap SMTP
const MAILTRAP_HOST = "sandbox.smtp.mailtrap.io";
const MAILTRAP_PORT = 2525;
const MAILTRAP_USER = "dcdac07d1071a8";
const MAILTRAP_PASS = "8eb52f9a277db2";
const EMAIL_FROM = "SaaS YKON <hello@demomailtrap.co>";

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('Host:', MAILTRAP_HOST);
  console.log('Port:', MAILTRAP_PORT);
  console.log('User:', MAILTRAP_USER);
  console.log('From:', EMAIL_FROM);
  
  const transporter = nodemailer.createTransport({
    host: MAILTRAP_HOST,
    port: MAILTRAP_PORT,
    auth: {
      user: MAILTRAP_USER,
      pass: MAILTRAP_PASS,
    },
    // Increased timeout settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 15000, // 15 seconds
    socketTimeout: 30000, // 30 seconds
    // Additional options
    tls: {
      rejectUnauthorized: false
    },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5
  });
  
  try {
    // Test connection
    console.log('Testing connection...');
    await transporter.verify();
    console.log('✅ Connection to Mailtrap successful');
    
    // Send test email
    console.log('Sending test email...');
    const result = await transporter.sendMail({
      from: EMAIL_FROM,
      to: "melilamcontact@gmail.com",
      subject: "Test email from SaaS YKON",
      html: "<h1>Test Email</h1><p>This is a test email to verify the configuration.</p>",
      text: "Test Email\n\nThis is a test email to verify the configuration.",
    });
    
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testEmail();
