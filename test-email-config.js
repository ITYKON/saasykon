// Test de configuration Mailtrap
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Importer nodemailer directement pour tester
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('=== TEST DE CONFIGURATION MAILTRAP ===\n');

  // Récupérer la configuration depuis les variables d'environnement
  const MAILTRAP_HOST = process.env.MAILTRAP_HOST || "sandbox.smtp.mailtrap.io";
  const MAILTRAP_PORT = Number(process.env.MAILTRAP_PORT || 2525);
  const MAILTRAP_USER = process.env.MAILTRAP_USER || "";
  const MAILTRAP_PASS = process.env.MAILTRAP_PASS || "";
  const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN || "";
  const MAILTRAP_USE_SMTP = process.env.MAILTRAP_USE_SMTP === "true";
  
  console.log('Configuration détectée:');
  console.log(`  Host: ${MAILTRAP_HOST}`);
  console.log(`  Port: ${MAILTRAP_PORT}`);
  console.log(`  User: ${MAILTRAP_USER ? 'Configuré' : 'Non configuré'}`);
  console.log(`  Token: ${MAILTRAP_TOKEN ? 'Configuré' : 'Non configuré'}`);
  console.log(`  Use SMTP: ${MAILTRAP_USE_SMTP}\n`);

  try {
    console.log('1. Création du transporteur...');
    
    let transporter;
    if (MAILTRAP_TOKEN && !MAILTRAP_USE_SMTP) {
      // Utiliser l'API Mailtrap
      console.log('  → Utilisation de l\'API Mailtrap');
      const { MailtrapTransport } = require('mailtrap');
      transporter = nodemailer.createTransport(
        MailtrapTransport({ token: MAILTRAP_TOKEN })
      );
    } else {
      // Utiliser SMTP
      console.log('  → Utilisation de SMTP Mailtrap');
      transporter = nodemailer.createTransport({
        host: MAILTRAP_HOST,
        port: MAILTRAP_PORT,
        auth: {
          user: MAILTRAP_USER,
          pass: MAILTRAP_PASS,
        },
      });
    }
    
    console.log('2. Test de connexion...');
    await transporter.verify();
    console.log('✅ Connexion réussie au service email');
    
    // Envoyer un email de test
    console.log('\n3. Envoi d\'un email de test...');
    
    const testEmail = {
      from: process.env.EMAIL_FROM || 'test@example.com',
      to: 'test@example.com', // Email de test
      subject: 'Test de configuration Mailtrap - SAAS YKON',
      text: 'Ceci est un email de test pour vérifier que Mailtrap fonctionne correctement.',
      html: '<p>Ceci est un email de test pour vérifier que <strong>Mailtrap</strong> fonctionne correctement.</p>'
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email de test envoyé avec succès');
    console.log(`   Message ID: ${result.messageId}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test email:', error.message);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('\n🔍 Suggestions pour résoudre le timeout:');
      console.log('1. Vérifiez votre connexion internet');
      console.log('2. Vérifiez que les identifiants Mailtrap sont corrects');
      console.log('3. Essayez d\'utiliser le token API au lieu de SMTP');
      console.log('4. Vérifiez que votre compte Mailtrap est actif');
      console.log('5. Vérifiez que le port 2525 n\'est pas bloqué par votre firewall');
    }
    
    if (error.code === 'EAUTH') {
      console.log('\n🔍 Suggestions pour résoudre l\'erreur d\'authentification:');
      console.log('1. Vérifiez que MAILTRAP_USER et MAILTRAP_PASS sont corrects');
      console.log('2. Assurez-vous que le inbox Mailtrap est actif');
      console.log('3. Essayez de régénérer les identifiants dans Mailtrap');
    }
    
    console.log('\n📋 Configuration requise dans .env.local:');
    console.log('MAILTRAP_HOST=sandbox.smtp.mailtrap.io');
    console.log('MAILTRAP_PORT=2525');
    console.log('MAILTRAP_USER=votre-username');
    console.log('MAILTRAP_PASS=votre-password');
    console.log('MAILTRAP_TOKEN=votre-token-api (optionnel)');
    console.log('MAILTRAP_USE_SMTP=true');
  }
}

// Exécuter le test
testEmailConfig();
