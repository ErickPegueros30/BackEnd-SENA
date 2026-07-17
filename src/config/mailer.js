import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  pool: true,
  maxConnections: process.env.SMTP_MAX_CONNECTIONS ? Number(process.env.SMTP_MAX_CONNECTIONS) : 5,
  maxMessages: process.env.SMTP_MAX_MESSAGES ? Number(process.env.SMTP_MAX_MESSAGES) : 100,
  greetingTimeout: 20000,
  connectionTimeout: 20000,
})

transporter.verify()
  .then(() => console.log('Mailer: conexión SMTP lista'))
  .catch(err => console.error('Mailer: verificación SMTP fallida', err))

export async function sendMail(mailOptions, { waitForResult = false } = {}) {
  const final = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    ...mailOptions,
  }

  if (waitForResult) {
    return transporter.sendMail(final)
  }

  // Envío en background: no await para responder rápido
  transporter.sendMail(final)
    .then(info => console.log('Correo encolado/enviado:', info && info.messageId))
    .catch(err => console.error('Error enviando correo (background):', err))

  return Promise.resolve()
}

export default transporter
