import { sendMail } from '../config/mailer.js'

const sendEnsayoBilateral = async (req, res) => {
  try {
    const { nombre, email, telefono, area, ensayos, laboratorio, nacionalidad, pais, country, selectedCountry } = req.body
    const nationality = nacionalidad || pais || country || selectedCountry || ''
    const isRama = !!req.body.isRama

    if (!nombre || !email || !area || !ensayos || !Array.isArray(ensayos) || ensayos.length === 0) {
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios para cotización de ensayo bilateral' })
    }

    // Usar transporter compartido con pooling (src/config/mailer.js)

    const ensayosText = ensayos.join('\n')
    let text
    if (isRama) {
      text = `Nombre: ${nombre}\nCorreo: ${email}\nTeléfono: ${telefono || ''}\nLaboratorio: ${laboratorio || ''}\nÁrea: ${area}\n\nNúmero de ensayos solicitados: ${ensayos.length}`
    } else {
      text = `Nombre: ${nombre}\nCorreo: ${email}\nTeléfono: ${telefono || ''}\nLaboratorio: ${laboratorio || ''}\nNacionalidad: ${nationality || ''}\nÁrea: ${area}\n\nEnsayos:\n${ensayosText}`
    }

    const ensayosHtmlRows = ensayos.map(e => `<li style="margin-bottom:6px;">${String(e)}</li>`).join('')

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
          📋 Cotización Ensayo Bilateral
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

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Área:</span>
          <span style="color:#1c2b14;word-break:break-word;">${area}</span>
        </div>
        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Laboratorio:</span>
          <span style="color:#1c2b14;word-break:break-word;">${laboratorio || 'No especificado'}</span>
        </div>
        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Nacionalidad:</span>
          <span style="color:#1c2b14;word-break:break-word;">${nationality || 'No especificada'}</span>
        </div>

        ${isRama ? (`<div style="background:#f8faf6;border-left:4px solid #5d8a2f;border-radius:8px;padding:18px 20px;margin-top:20px;font-size:15px;line-height:1.6;color:#1c2b14;"><strong style="color:#5d8a2f;">Número de ensayos solicitados:</strong> ${ensayos.length}</div>`) : (`<div style="background:#f8faf6;border-left:4px solid #5d8a2f;border-radius:8px;padding:18px 20px;margin-top:20px;font-size:15px;line-height:1.6;color:#1c2b14;"><strong style="color:#5d8a2f;">Ensayos solicitados:</strong><ul style="margin-top:8px;padding-left:20px;list-style-type:disc;color:#1c2b14;">${ensayosHtmlRows}</ul></div>`) }

        <div style="margin-top:25px;padding:12px 16px;background:#edf4e3;border-radius:8px;font-size:13px;color:#5a6a52;">
          Esta solicitud fue enviada a través del formulario de cotización de <strong style="color:#5d8a2f;">Ensayos Bilaterales</strong>.
          Por favor, atender a la brevedad posible.
        </div>
      </td>
    </tr>
  </table>
`;

    const defaultTo = process.env.MAIL_TO_E_BILATERAL || process.env.MAIL_TO_CONTACTO || process.env.MAIL_FROM || process.env.SMTP_USER
    const invited = process.env.MAIL_TO_CONTACTO_INVITADO
    const toList = invited ? [defaultTo, invited] : [defaultTo]

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: toList.join(','),
      replyTo: email,
      subject: 'Cotización Ensayo Bilateral',
      text,
      html,
      envelope: {
        from: process.env.SMTP_USER,
        to: toList,
      },
    }

    sendMail(mailOptions)
    console.log('Ensayo bilateral encolado para envío')
    return res.status(201).json({ ok: true, message: 'Solicitud recibida y en proceso de envío' })
  } catch (err) {
    console.error('Error en sendEnsayoBilateral:', err)
    return res.status(500).json({ ok: false, message: 'Error interno enviando cotización' })
  }
}

export default { sendEnsayoBilateral }
