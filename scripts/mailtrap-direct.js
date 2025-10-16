require('dotenv').config({ path: '.env.local' });
const Nodemailer = require('nodemailer');
const { MailtrapTransport } = require('mailtrap');

const TOKEN = process.env.MAILTRAP_TOKEN || '';
const USE_SMTP = process.env.MAILTRAP_USE_SMTP === 'true';

const usingApi = !!TOKEN && !USE_SMTP;

const smtpHost = process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io';
const smtpPort = Number(process.env.MAILTRAP_PORT || 587);
const smtpUser = process.env.MAILTRAP_USER || '';
const smtpPass = process.env.MAILTRAP_PASS || '';

const transport = usingApi
  ? Nodemailer.createTransport(MailtrapTransport({ token: TOKEN }))
  : Nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });

console.log('[mailtrap-direct] Using', usingApi ? 'Mailtrap API transport' : 'SMTP transport');
if (!usingApi) {
  console.log('[mailtrap-direct] SMTP host:', smtpHost, 'port:', smtpPort);
  console.log('[mailtrap-direct] SMTP user set:', Boolean(smtpUser));
}

const sender = {
  address: process.env.EMAIL_FROM_ADDRESS || 'hello@demomailtrap.co',
  name: process.env.EMAIL_FROM_NAME || 'Mailtrap Test',
};

const recipients = [process.env.MAILTRAP_TEST_TO || 'ahlem.aissou@yatek.fr'];

transport
  .sendMail({
    from: sender,
    to: recipients,
    subject: 'You are awesome!',
    text: 'Congrats for sending test email with Mailtrap!',
    category: 'Integration Test',
  })
  .then((info) => {
    console.log('Mail sent:', info?.messageId || info);
  })
  .catch((err) => {
    console.error('Failed to send:', err);
    process.exit(1);
  });
