export function normalizeStoredPath(imgPath) {
  if (!imgPath) return imgPath
  let p = String(imgPath)
  // If the stored path contains public_html (or an absolute home path), strip
  // everything up to and including the public_html segment so the public URL
  // becomes /uploads/...
  const m = p.match(/(.*public_html)(\/uploads\/.*)/)
  if (m && m[2]) p = m[2]
  // If it contains /home/username/public_html/uploads/... also catch that
  p = p.replace(/^\/home\/[a-zA-Z0-9_\-]+\/public_html/, '')
  // Ensure it starts with a single slash
  if (!p.startsWith('/')) p = '/' + p
  return p.replace(/\/+/g, '/')
}

export function buildImageUrl(req, imgPath) {
  if (!imgPath) return null
  if (imgPath.startsWith('http')) return imgPath
  const siteUrl = process.env.SITE_URL
  const normalized = normalizeStoredPath(imgPath)
  if (siteUrl) return siteUrl.replace(/\/$/, '') + normalized
  const proto = (req && (req.headers['x-forwarded-proto'] || req.protocol)) || 'https'
  return `${proto}://${req.get('host')}${normalized.startsWith('/') ? '' : '/'}${normalized}`
}

export default { normalizeStoredPath, buildImageUrl }
