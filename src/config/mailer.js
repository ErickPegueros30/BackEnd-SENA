import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Helpers para leer variables de entorno con valores por defecto
// ---------------------------------------------------------------------------
const num = (value, fallback) => (value ? Number(value) : fallback)
const bool = (value, fallback = false) =>
  value === undefined ? fallback : value === 'true'

// ---------------------------------------------------------------------------
// Transporter SMTP
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: num(process.env.SMTP_PORT, 465),
  secure: bool(process.env.SMTP_SECURE, true),
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  pool: true,
  // Pool tuning: modo rápido controlado por SMTP_FAST_MODE=true
  // para mejorar throughput en picos de tráfico y reutilizar conexiones.
  keepAlive: true,
  const_fast_mode: undefined,
  maxConnections: num(
    process.env.SMTP_MAX_CONNECTIONS,
    bool(process.env.SMTP_FAST_MODE, false) ? 50 : 20
  ),
  maxMessages: num(
    process.env.SMTP_MAX_MESSAGES,
    bool(process.env.SMTP_FAST_MODE, false) ? 5000 : 1000
  ),
  // Reducir timeouts para fallar rápido en conexiones lentas y liberar recursos
  greetingTimeout: num(
    process.env.SMTP_GREETING_TIMEOUT,
    bool(process.env.SMTP_FAST_MODE, false) ? 5000 : 10000
  ),
  connectionTimeout: num(
    process.env.SMTP_CONNECTION_TIMEOUT,
    bool(process.env.SMTP_FAST_MODE, false) ? 5000 : 10000
  ),
  socketTimeout: num(
    process.env.SMTP_SOCKET_TIMEOUT,
    bool(process.env.SMTP_FAST_MODE, false) ? 5000 : 10000
  ),
})

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const hostDisplay = process.env.SMTP_HOST || 'localhost'

// Reemplaza cualquier IPv4 (con o sin puerto) por el host configurado en .env
const IPV4_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g
const redactMsg = (m) =>
  typeof m === 'string' ? m.replace(IPV4_REGEX, hostDisplay) : m

// Construye un objeto de error seguro (sin IPs ni puertos)
const sanitizeError = (err) => ({
  message: redactMsg(err?.message),
  code: err?.code,
  syscall: err?.syscall,
  host: hostDisplay,
})

// ---------------------------------------------------------------------------
// Verificación de conexión (opcional, se activa con MAILER_VERIFY=true)
// ---------------------------------------------------------------------------
if (bool(process.env.MAILER_VERIFY)) {
  transporter
    .verify()
    .then(() => console.log('Mailer: conexión SMTP lista'))
    .catch((err) =>
      console.error('Mailer: verificación SMTP fallida', sanitizeError(err))
    )
} else {
  console.log(
    'Mailer: verificación desactivada por defecto. Para activarla, añade MAILER_VERIFY=true en .env'
  )
}

// ---------------------------------------------------------------------------
// Fallback: guardar el correo en disco si falla el envío
// ---------------------------------------------------------------------------
async function saveToFallbackFile(mail, sanitizedErr) {
  const outDir =
    process.env.MAIL_FALLBACK_DIR || path.join(process.cwd(), 'failed-emails')

  await fs.promises.mkdir(outDir, { recursive: true })

  const now = new Date().toISOString().replace(/[:.]/g, '-')
  const fname = `failed-email-${now}-${Math.floor(Math.random() * 10000)}.json`
  const fullPath = path.join(outDir, fname)

  const payload = {
    mail,
    error: sanitizedErr,
    env: { SMTP_HOST: hostDisplay, SMTP_PORT: process.env.SMTP_PORT },
  }

  await fs.promises.writeFile(fullPath, JSON.stringify(payload, null, 2), 'utf8')
  console.log('Correo guardado en fallback:', fullPath)
}

// ---------------------------------------------------------------------------
// Envío de correo
// ---------------------------------------------------------------------------
export async function sendMail(mailOptions, { waitForResult = false } = {}) {
  const final = {
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    ...mailOptions,
  }

  // Envío síncrono: se espera el resultado
  if (waitForResult) {
    return transporter.sendMail(final)
  }

  // Envío en background: no se espera para responder rápido
  transporter
    .sendMail(final)
    .then((info) => console.log('Correo encolado/enviado:', info?.messageId))
    .catch(async (err) => {
      const sanitizedErr = sanitizeError(err)
      console.error('Error enviando correo (background):', sanitizedErr)

      const fallbackEnabled = process.env.MAIL_FALLBACK_TO_FILE !== 'false'
      if (!fallbackEnabled) return

      try {
        await saveToFallbackFile(final, sanitizedErr)
      } catch (writeErr) {
        console.error('Error guardando correo en fallback:', {
          message: writeErr?.message,
          code: writeErr?.code,
        })
      }
    })

  return Promise.resolve()
}

export default transporter