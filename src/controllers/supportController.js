import nodemailer from 'nodemailer'

const sendSupport = async (req, res) => {
  try {
    const { nombre, email, telefono, motivo } = req.body

    if (!nombre || !email || !motivo) {
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios para soporte' })
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
      console.error('SMTP verify failed (support):', verifyErr)
      return res.status(502).json({ ok: false, message: 'No se pudo conectar al servidor SMTP', error: verifyErr.message })
    }

    const text = `Nombre completo: ${nombre}\nCorreo electrónico: ${email}\nTeléfono: ${telefono || ''}\n\nMotivo:\n${motivo}`

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
          🎫 Solicitud de ayuda - Soporte
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Nombre completo:</span>
          <span style="color:#1c2b14;word-break:break-word;">${nombre}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Correo electrónico:</span>
          <span style="color:#1c2b14;word-break:break-word;">${email}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Teléfono:</span>
          <span style="color:#1c2b14;word-break:break-word;">${telefono || 'No especificado'}</span>
        </div>

        <div style="background:#f8faf6;border-left:4px solid #5d8a2f;border-radius:8px;padding:18px 20px;margin-top:20px;font-size:15px;line-height:1.6;color:#1c2b14;">
          <strong style="color:#5d8a2f;">Motivo de la solicitud:</strong>
          <div style="margin-top:6px;">${motivo.replace(/\n/g, '<br/>')}</div>
        </div>

        <div style="margin-top:25px;padding:12px 16px;background:#edf4e3;border-radius:8px;font-size:13px;color:#5a6a52;">
          Esta solicitud fue enviada a través del formulario de soporte de <strong style="color:#5d8a2f;">SENA</strong>.
          Por favor, atender a la brevedad posible.
        </div>
      </td>
    </tr>
  </table>
`;

    const to = process.env.MAIL_TO_SOPORTE || process.env.MAIL_TO_CONTACTO || process.env.MAIL_FROM || process.env.SMTP_USER

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      replyTo: email,
      subject: 'Ayuda Soporte',
      text,
      html,
      envelope: {
        from: process.env.SMTP_USER,
        to: [to],
      },
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Soporte enviado, sendMail info:', info)
      return res.json({ ok: true, message: 'Solicitud de soporte enviada', info })
    } catch (sendErr) {
      console.error('Error enviando soporte (sendMail):', sendErr)
      return res.status(502).json({ ok: false, message: 'Error enviando correo de soporte', error: sendErr.message })
    }
  } catch (err) {
    console.error('Error en sendSupport:', err)
    return res.status(500).json({ ok: false, message: 'Error interno enviando soporte' })
  }
}

export default { sendSupport }
