import { sendMail } from '../config/mailer.js'

export const sendCotizacionComparacion = async (req, res) => {
  try {
    const { nombre, laboratorio, email, telefono, programa } = req.body

    if (!nombre || !email || !laboratorio || !programa) {
      return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios: nombre, email, laboratorio o programa' })
    }

    const { referencia, descripcion } = programa
    if (!referencia || !descripcion) {
      return res.status(400).json({ ok: false, message: 'El programa debe incluir referencia y descripcion' })
    }

    // Usar transporter reutilizable con pooling (configurado en src/config/mailer.js)

    const text = `Cotización Comparacion\n\nNombre: ${nombre}\nLaboratorio: ${laboratorio}\nCorreo: ${email}\nTeléfono: ${telefono || ''}\nPrograma referencia: ${referencia}\nPrograma descripción: ${descripcion}`

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
          📊 Cotización Comparación
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

        <div style="margin:18px 0;border-top:1px solid #edf4e3;padding-top:18px;">
          <div style="margin-bottom:12px;font-size:15px;line-height:1.5;display:flex;align-items:flex-start;">
            <span style="width:24px;font-size:18px;color:#5d8a2f;margin-right:10px;text-align:center;flex-shrink:0;"></span>
            <span style="font-weight:600;color:#5a6a52;min-width:120px;">Programa - Referencia:</span>
            <span style="color:#1c2b14;word-break:break-word;font-weight:500;">${referencia}</span>
          </div>
        </div>

        <div style="background:#f8faf6;border-left:4px solid #5d8a2f;border-radius:8px;padding:18px 20px;margin-top:12px;font-size:15px;line-height:1.6;color:#1c2b14;">
          <strong style="color:#5d8a2f;">Programa - Descripción:</strong>
          <div style="margin-top:6px;">${(descripcion || '').replace(/\n/g, '<br/>')}</div>
        </div>

        <div style="margin-top:25px;padding:12px 16px;background:#edf4e3;border-radius:8px;font-size:13px;color:#5a6a52;">
          Solicitud enviada desde el formulario de cotización de <strong style="color:#5d8a2f;">Comparación</strong>.
          Por favor, atender a la brevedad posible.
        </div>
      </td>
    </tr>
  </table>
`;

    const to = process.env.MAIL_TO_INTERLAB || process.env.MAIL_TO || process.env.MAIL_FROM || process.env.SMTP_USER

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      replyTo: email,
      subject: 'Cotización Comparacion',
      text,
      html,
      envelope: {
        from: process.env.SMTP_USER,
        to: [to],
      },
    }

    // Enviar en background para responder rápido
    sendMail(mailOptions)
    console.log('Cotización comparacion encolada para envío')
    return res.status(201).json({ ok: true, message: 'Solicitud recibida y en proceso de envío' })
  } catch (err) {
    console.error('sendCotizacionComparacion error', err)
    return res.status(500).json({ ok: false, message: 'Error interno' })
  }
}

export default { sendCotizacionComparacion }
