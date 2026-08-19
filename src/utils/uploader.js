import fs from 'fs'
import os from 'os'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()

const METHOD = (process.env.UPLOAD_METHOD || 'ftp').toLowerCase()

const FTP_CONFIG = {
  host: process.env.FTP_HOST || process.env.CPANEL_HOST,
  user: process.env.FTP_USER || process.env.CPANEL_USER,
  password: process.env.FTP_PASS || process.env.CPANEL_PASS,
  secure: process.env.FTP_SECURE === 'true',
}

const SFTP_CONFIG = {
  host: process.env.SFTP_HOST || process.env.CPANEL_HOST,
  port: Number(process.env.SFTP_PORT) || 22,
  username: process.env.SFTP_USER || process.env.CPANEL_USER,
  password: process.env.SFTP_PASS || process.env.CPANEL_PASS,
}

const REMOTE_BASE = process.env.REMOTE_UPLOAD_BASE || process.env.CPANEL_REMOTE_BASE || '/home/mrcmcomm/public_html/uploads'

async function tmpWrite(buffer) {
  const fname = `upload-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  const tmpPath = path.join(os.tmpdir(), fname)
  await fs.promises.writeFile(tmpPath, buffer)
  return tmpPath
}

async function uploadViaFTP(localPath, remoteDir, remoteName) {
  const { Client } = await import('basic-ftp')
  const client = new Client()
  try {
    await client.access(FTP_CONFIG)
    try { await client.ensureDir(remoteDir) } catch (e) { }
    // uploadFrom with remoteName (filename) uploads into the current dir
    await client.uploadFrom(localPath, remoteName)
  } finally {
    client.close()
  }
}

async function uploadViaSFTP(localPath, remotePath, buffer=null) {
  const SftpClient = (await import('ssh2-sftp-client')).default
  const sftp = new SftpClient()
  try {
    await sftp.connect(SFTP_CONFIG)
    const remoteDir = path.posix.dirname(remotePath)
    try { await sftp.mkdir(remoteDir, true) } catch(_) {}
    if (buffer) {
      await sftp.put(buffer, remotePath)
    } else {
      await sftp.put(localPath, remotePath)
    }
  } finally {
    sftp.end()
  }
}

// remoteName: filename only, subfolder: e.g. 'blogs'
export async function uploadBuffer(buffer, remoteName, subfolder='') {
  const tmpPath = await tmpWrite(buffer)
  try {
    const remoteDir = subfolder ? `${REMOTE_BASE}/${subfolder}` : REMOTE_BASE
    const remotePath = path.posix.join(remoteDir, remoteName)
    // Log useful information for debugging uploads and remote paths
    console.log('[uploader] METHOD=', METHOD, 'REMOTE_BASE=', REMOTE_BASE, 'FTP_REMOTE_BASE=', process.env.FTP_REMOTE_BASE)
    console.log('[uploader] remoteDir=', remoteDir, 'remotePath=', remotePath)
    if (METHOD === 'sftp') {
      await uploadViaSFTP(tmpPath, remotePath, buffer)
    } else {
      // ftp
      // For FTP, remotePath should be relative to FTP account root; assume FTP user is jailed to public_html/uploads
      // Allow configuring FTP_REMOTE_BASE to adjust
      const ftpBase = process.env.FTP_REMOTE_BASE || '/'
      // Many FTP accounts are jailed to the user's home (e.g. /home/usuario).
      // If FTP_REMOTE_BASE is an absolute path like '/home/usuario/public_html/uploads'
      // sending that full absolute path to the FTP server can create duplicated
      // folder segments. Convert it to a path relative to the FTP root by
      // stripping a leading '/home/usuario' segment when present.
      const ftpBaseRelative = ftpBase.replace(/^\/home\/[^^\/]+/, '').replace(/^\//, '')
      const relative = path.posix.join(ftpBaseRelative || '.', subfolder || '', remoteName)
      console.log('[uploader] ftp relative path=', relative, ' (ftpBase=', ftpBase, 'ftpBaseRelative=', ftpBaseRelative, ')')
      const remoteDirRel = path.posix.dirname(relative)
      const remoteBaseName = path.posix.basename(relative)
      await uploadViaFTP(tmpPath, remoteDirRel, remoteBaseName)
    }
    // Return public URL path to store in DB
    const publicPath = `/uploads/${subfolder ? subfolder + '/' : ''}${remoteName}`
    console.log('[uploader] publicPath=', publicPath)
    return publicPath
  } finally {
    try { await fs.promises.unlink(tmpPath) } catch (_) {}
  }
}

export async function uploadLocalFile(localPath, remoteName, subfolder='') {
  const buffer = await fs.promises.readFile(localPath)
  return uploadBuffer(buffer, remoteName, subfolder)
}

export default { uploadBuffer, uploadLocalFile }
