const log = { info: (...a) => console.log('[EMAIL]', ...a), error: (...a) => console.error('[EMAIL]', ...a) }

let transporter = null
let smtpConfig = null

function configureSMTP(host, port, user, pass) {
  if (!host || !user || !pass) return false
  try {
    const nodemailer = require('nodemailer')
    smtpConfig = { host, port: port || 587, secure: (port === 465), auth: { user, pass } }
    transporter = nodemailer.createTransport(smtpConfig)
    log.info('[EMAIL] SMTP configured: ' + host)
    return true
  } catch (err) {
    log.error('[EMAIL] SMTP config error: ' + err.message)
    return false
  }
}

function isConfigured() {
  return !!(transporter && smtpConfig)
}

async function sendEmail(to, code) {
  if (!isConfigured()) return { success: false, error: 'SMTP non configuré' }
  if (!to) return { success: false, error: 'Adresse email manquante' }

  const mailOptions = {
    from: 'GESTOCOM CI <' + smtpConfig.auth.user + '>',
    to: to,
    subject: 'GESTOCOM CI - Code de verification',
    text: 'Votre code de vérification est: ' + code + '\nValable 5 minutes.',
    html: '<div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;">' +
      '<div style="background:#1a73e8;color:white;padding:15px;border-radius:8px 8px 0 0;text-align:center;">' +
      '<h2 style="margin:0;">GESTOCOM CI</h2></div>' +
      '<div style="border:1px solid #e0e0e0;border-top:none;padding:20px;border-radius:0 0 8px 8px;">' +
      '<p style="color:#555;">Votre code de verification:</p>' +
      '<div style="text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a73e8;padding:15px;background:#f5f9ff;border-radius:8px;">' + code + '</div>' +
      '<p style="color:#999;font-size:12px;margin-top:15px;">Ce code est valable pendant 5 minutes.</p>' +
      '</div></div>',
  }

  try {
    await transporter.sendMail(mailOptions)
    log.info('[EMAIL] Sent to ' + to)
    return { success: true }
  } catch (err) {
    log.error('[EMAIL] Send error: ' + err.message)
    return { success: false, error: err.message }
  }
}

module.exports = { configureSMTP, isConfigured, sendEmail }
