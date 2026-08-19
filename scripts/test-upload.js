import fs from 'fs'
import path from 'path'
import { uploadBuffer } from '../src/utils/uploader.js'

async function run() {
  try {
    const filename = `test-upload-${Date.now()}.txt`
    const content = 'Prueba de upload desde script: ' + new Date().toISOString()
    const buffer = Buffer.from(content, 'utf8')
    console.log('-> Probando uploadBuffer para', filename)
    const publicPath = await uploadBuffer(buffer, filename, 'pagina/home/carrusel')
    console.log('RESULT: publicPath =', publicPath)
  } catch (err) {
    console.error('UPLOAD ERROR', err)
    process.exitCode = 2
  }
}

run()
