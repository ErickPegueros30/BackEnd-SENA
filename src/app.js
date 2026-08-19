import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs'
import routes from './config/routes/index.js';
import * as usersCtrl from './controllers/users.js';

const app = express();
// Trust reverse proxy (nginx) so req.protocol reflects original scheme when using X-Forwarded-* headers
// Use environment variable `TRUST_PROXY` to control this. Default to 'loopback' (trust only localhost proxies).
// Set to 'true' only if you intentionally trust all proxies (not recommended).
const trustProxyEnv = process.env.TRUST_PROXY || 'loopback'
if (trustProxyEnv === 'false') {
  app.set('trust proxy', false)
} else if (trustProxyEnv === 'true') {
  app.set('trust proxy', true)
} else {
  app.set('trust proxy', trustProxyEnv)
}
// 🔧 Middlewares base
app.use(cors());
// Allow larger JSON/urlencoded bodies (avatar data URLs can be large)
// Allow larger JSON/urlencoded bodies for image data URLs. In production
// ensure the reverse proxy (nginx) also allows this size (client_max_body_size).
// Accept either a value like '50mb' or a plain number in MB (e.g. '50').
const rawLimit = process.env.MAX_UPLOAD_MB || '50mb'
const DEFAULT_UPLOAD_LIMIT = /^[0-9]+$/.test(String(rawLimit)) ? `${rawLimit}mb` : rawLimit
app.use(express.json({ limit: DEFAULT_UPLOAD_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: DEFAULT_UPLOAD_LIMIT }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200,
  message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 📁 Servir archivos subidos
const ROOT_DIR = process.cwd();            
// If a file is not present locally (because uploads are stored on remote cPanel),
// redirect to the public SITE_URL so the browser fetches the file from the hosting.
app.use('/uploads', (req, res, next) => {
  console.log('[uploads middleware] request', req.method, req.originalUrl, 'path=', req.path)
  const siteUrl = process.env.SITE_URL && process.env.SITE_URL.replace(/\/$/, '')
  const relPath = String(req.path || '').replace(/^\//, '')
  const localFile = path.join(ROOT_DIR, 'uploads', relPath)
  try {
    if (fs.existsSync(localFile)) {
      console.log('[uploads middleware] local file exists:', localFile)
      return next()
    }
    console.log('[uploads middleware] local file not found:', localFile)
  } catch (e) { console.error('[uploads middleware] error checking file', e) }

  // If SITE_URL is configured, attempt to proxy the file from the public host
  // Accept both GET and HEAD so health checks and browsers that use HEAD work.
  const wantProxy = siteUrl && (req.method === 'GET' || req.method === 'HEAD')
  if (wantProxy) {
    const tried = []
    const target = siteUrl + req.originalUrl
    tried.push(target)
    console.log('[uploads proxy] proxying from', target)
    ;(async () => {
      try {
        // Use HEAD for upstream when the incoming request is HEAD to avoid downloading body
        let r = await fetch(target, req.method === 'HEAD' ? { method: 'HEAD' } : undefined)
        // If the remote returned 404, attempt alternative paths using FTP_REMOTE_BASE
        if (!r.ok && r.status === 404) {
          const ftpBase = (process.env.FTP_REMOTE_BASE || process.env.REMOTE_BASE || '').replace(/\/+$/,'').replace(/^\/+/, '')
          const rest = req.originalUrl.replace(/^\/uploads/, '')
          if (ftpBase) {
            // Attempt: /uploads/{ftpBase}{rest}
            const alt1 = siteUrl + '/uploads/' + ftpBase + rest
            tried.push(alt1)
            console.log('[uploads proxy] trying alt path', alt1)
            r = await fetch(alt1, req.method === 'HEAD' ? { method: 'HEAD' } : undefined)
          }
          // If still not ok, try ftpBase + rest without extra /uploads prefix
          if ((!r || !r.ok) && ftpBase) {
            const alt2 = siteUrl + '/' + ftpBase + rest
            tried.push(alt2)
            console.log('[uploads proxy] trying alt path 2', alt2)
            r = await fetch(alt2, req.method === 'HEAD' ? { method: 'HEAD' } : undefined)
          }
        }

        if (!r.ok) {
          console.log('[uploads proxy] remote returned', r.status, 'tried:', tried)
          res.status(r.status)
          const txt = await r.text().catch(()=>null)
          return res.send(txt || `Remote returned ${r.status}`)
        }
        // Forward selected headers
        const ct = r.headers.get('content-type')
        if (ct) res.setHeader('Content-Type', ct)
        const cl = r.headers.get('content-length')
        if (cl) res.setHeader('Content-Length', cl)
        // If incoming request was HEAD, end after headers
        if (req.method === 'HEAD') return res.end()
        // Stream body for GET
        const body = r.body
        if (body && typeof body.pipe === 'function') {
          return body.pipe(res)
        }
        // Fallback: read as buffer
        const buf = await r.arrayBuffer()
        return res.send(Buffer.from(buf))
      } catch (err) {
        console.error('[uploads proxy] error fetching remote', err)
        return next()
      }
    })()
    return
  }
  return next()
})
app.use('/uploads', express.static(path.join(ROOT_DIR, 'uploads')));

// 🛣️ Rutas principales (SIN helmet por ahora)
app.use('/api', routes);

// Compatibilidad: exponer la lista pública de instructores sin el prefijo /api
// Algunas partes del frontend usan `${API_BASE}/users/instructors` (sin /api).
app.get('/users/instructors', usersCtrl.listInstructors);

export default app;