import nodemailer from "nodemailer";

console.log("🚀 Test Mailtrap démarré...");

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "1fbccacb96fc7f", // ton nouveau user
    pass: "4f88209bab7699", // ton nouveau mot de passe
  },
});

const mailOptions = {
  from: "SaaS YKON <hello@demomailtrap.co>",
  to: "test@inbox.mailtrap.io", // peu importe, c’est intercepté par Mailtrap
  subject: "💌 Test Mailtrap avec Nodemailer",
  text: "Ceci est un test d’envoi d’email via Mailtrap (SMTP).",
};

async function sendTest() {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé avec succès :", info.messageId);
  } catch (error) {
    console.error("❌ Erreur d’envoi :", error);
  }
}

sendTest();
