import nodemailer from 'nodemailer'

const sendEnsayoEmail = async (req, res) => {
  try {
    const { nombre, email, telefono, codigo, fechaInicio } = req.body

    if (!nombre || !email || !codigo) {
      return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios: nombre, email o codigo' })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    })

    try {
      await transporter.verify()
    } catch (verifyErr) {
      console.error('SMTP verify failed (ensayo):', verifyErr)
      return res.status(502).json({ ok: false, message: 'No se pudo conectar al servidor SMTP', error: verifyErr.message })
    }

    const text = `Nombre: ${nombre}\nCorreo: ${email}\nTeléfono: ${telefono || ''}\n\nCódigo del ensayo: ${codigo}\nFecha de inicio: ${fechaInicio || ''}`

    const html = `
  <table align="center" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);overflow:hidden;font-family:'DM Sans','Segoe UI',Arial,sans-serif;color:#1c2b14;">
    <tr>
      <td style="background:linear-gradient(135deg,#5d8a2f 0%,#7aab3d 100%);padding:30px 40px 20px;text-align:center;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#ffffff;margin:0;letter-spacing:1px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">SENA</h1>
        <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:4px;font-weight:400;letter-spacing:2px;">Excelencia en Ensayos de Aptitud</div>
      </td>
    </tr>
    <tr>
      <td style="padding:35px 40px 30px;background:#ffffff;">
        <div style="font-size:18px;font-weight:600;color:#1c2b14;margin-bottom:20px;border-bottom:2px solid #edf4e3;padding-bottom:12px;">
          📋 Cotización Ensayo
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Nombre:</span>
          <span style="color:#1c2b14;word-break:break-word;">${nombre}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Correo:</span>
          <span style="color:#1c2b14;word-break:break-word;">${email}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Teléfono:</span>
          <span style="color:#1c2b14;word-break:break-word;">${telefono || 'No especificado'}</span>
        </div>

        <div style="margin:16px 0;border-top:1px solid #edf4e3;border-bottom:1px solid #edf4e3;padding:14px 0;background:#fafcf9;border-radius:6px;">
          <div style="margin-bottom:10px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;padding:0 10px;">
            <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
            <span style="font-weight:600;color:#5a6a52;min-width:120px;">Código del ensayo:</span>
            <span style="color:#1c2b14;word-break:break-word;font-weight:500;">${codigo}</span>
          </div>
          <div style="font-size:15px;line-height:1.5;display:flex;align-items:flex-start;padding:0 10px;">
            <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
            <span style="font-weight:600;color:#5a6a52;min-width:120px;">Fecha de inicio:</span>
            <span style="color:#1c2b14;word-break:break-word;">${fechaInicio || 'No especificada'}</span>
          </div>
        </div>

        <div style="margin-top:25px;padding:12px 16px;background:#edf4e3;border-radius:8px;font-size:13px;color:#5a6a52;">
          Solicitud enviada desde el formulario de cotización de <strong style="color:#5d8a2f;">Ensayos</strong>.
          Por favor, atender a la brevedad posible.
        </div>
      </td>
    </tr>
  </table>
`;

    const to = process.env.MAIL_TO_ENSAYOS || process.env.MAIL_FROM || process.env.SMTP_USER

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      replyTo: email,
      subject: 'Cotizacion Ensayo',
      text,
      html,
      envelope: { from: process.env.SMTP_USER, to: [to] }
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Ensayo email sent:', info)
      return res.json({ ok: true, message: 'Correo de cotización enviado', info })
    } catch (sendErr) {
      console.error('Error sending ensayo email:', sendErr)
      return res.status(502).json({ ok: false, message: 'Error enviando correo', error: sendErr.message })
    }
  } catch (err) {
    console.error('sendEnsayoEmail error:', err)
    return res.status(500).json({ ok: false, message: 'Error interno enviando correo' })
  }
}

export default { sendEnsayoEmail }
