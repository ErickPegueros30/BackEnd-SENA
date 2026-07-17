import { sendMail } from '../config/mailer.js'

export const sendComparacion = async (req, res) => {
  try {
    const { nombre, laboratorio, email, telefono, programaIds, notas } = req.body

    if (!nombre || !email || !laboratorio) {
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios: nombre, email o laboratorio' })
    }

    // Usar transporter compartido para mejorar rendimiento

    // Si el frontend envía detalles de los programas, úsalos; si no, muestra los ids
    let programasText = ''
    let programasDetailHtml = ''
    if (Array.isArray(req.body.programas) && req.body.programas.length > 0) {
      programasText = req.body.programas.map(p => p.referencia || p.id || String(p)).join(', ')
      programasDetailHtml = '<div style="margin-top:10px;">' + req.body.programas.map(p => `\n<p><strong>Programa:</strong> ${p.referencia || p.id || '-'}<br/><strong>Descripción:</strong> ${p.descripcion || 'No especificada'}</p>`).join('') + '</div>'
    } else {
      programasText = Array.isArray(programaIds) ? programaIds.map(p => String(p)).join(', ') : (programaIds ? String(programaIds) : 'No especificados')
    }

    const text = `Solicitud de Comparación Bilateral\n\nNombre: ${nombre}\nLaboratorio: ${laboratorio}\nCorreo: ${email}\nTeléfono: ${telefono || ''}\nProgramas: ${programasText}`

    const html = `
  <table align="center" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);overflow:hidden;font-family:'DM Sans','Segoe UI',Arial,sans-serif;color:#1c2b14;">
    <tr>
      <td style="background:linear-gradient(135deg,#5d8a2f 0%,#7aab3d 100%);padding:30px 40px 20px;text-align:center;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#ffffff;margin:0;letter-spacing:1px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">SENA</h1>
        <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:4px;font-weight:400;letter-spacing:2px;">Excelencia en Comparaciones Bilaterales</div>
      </td>
    </tr>
    <tr>
      <td style="padding:35px 40px 30px;background:#ffffff;">
        <div style="font-size:18px;font-weight:600;color:#1c2b14;margin-bottom:20px;border-bottom:2px solid #edf4e3;padding-bottom:12px;">
          🔬 Comparación Bilateral
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Nombre:</span>
          <span style="color:#1c2b14;word-break:break-word;">${nombre}</span>
        </div>

        <div style="margin-bottom:14px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
          <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Laboratorio:</span>
          <span style="color:#1c2b14;word-break:break-word;">${laboratorio}</span>
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
          <span style="font-weight:600;color:#5a6a52;min-width:120px;">Programas:</span>
          <span style="color:#1c2b14;word-break:break-word;">${programasText}</span>
        </div>

        ${programasDetailHtml ? `
        <div style="background:#f8faf6;border-left:4px solid #5d8a2f;border-radius:8px;padding:18px 20px;margin-top:20px;font-size:15px;line-height:1.6;color:#1c2b14;">
          <strong style="color:#5d8a2f;">Detalle de programas:</strong>
          <div style="margin-top:6px;">${programasDetailHtml}</div>
        </div>
        ` : ''}

        <div style="margin-top:25px;padding:12px 16px;background:#edf4e3;border-radius:8px;font-size:13px;color:#5a6a52;">
          Esta solicitud fue enviada a través del formulario de <strong style="color:#5d8a2f;">Comparación Bilateral</strong>.
          Por favor, atender a la brevedad posible.
        </div>
      </td>
    </tr>
  </table>
`;

    const to = process.env.MAIL_TO_INTER_BILATERAL || process.env.MAIL_TO_INTERLAB || process.env.MAIL_TO || process.env.MAIL_FROM || process.env.SMTP_USER

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      replyTo: email,
      subject: 'Comparación Bilateral',
      text,
      html,
      envelope: {
        from: process.env.SMTP_USER,
        to: [to],
      },
    }

    sendMail(mailOptions)
    console.log('Comparación bilateral encolada para envío')
    return res.status(201).json({ ok: true, message: 'Solicitud recibida y en proceso de envío' })
  } catch (err) {
    console.error('sendComparacion error', err)
    return res.status(500).json({ ok: false, message: 'Error interno' })
  }
}

export default { sendComparacion }
