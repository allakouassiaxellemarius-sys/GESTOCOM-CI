const log = { info: (...a) => console.log('[SMS]', ...a), error: (...a) => console.error('[SMS]', ...a) }

let twilioClient = null

function configureTwilio(accountSid, authToken, fromNumber) {
  if (!accountSid || !authToken) return false
  try {
    const twilio = require('twilio')
    twilioClient = twilio(accountSid, authToken)
    twilioClient._fromNumber = fromNumber
    log.info('[SMS] Twilio configured: ' + fromNumber)
    return true
  } catch (err) {
    log.error('[SMS] Twilio config error: ' + err.message)
    return false
  }
}

function isConfigured() {
  return !!(twilioClient && twilioClient._fromNumber)
}

async function sendSMS(phone, code) {
  if (!isConfigured()) return { success: false, error: 'Twilio non configuré' }
  if (!phone) return { success: false, error: 'Numéro de téléphone manquant' }

  let to = phone.replace(/[\s\-\(\)\.]/g, '')
  if (!to.startsWith('+')) to = '+225' + to
  if (to.startsWith('225') && !to.startsWith('+')) to = '+' + to

  const message = 'GESTOCOM CI - Votre code de vérification: ' + code + '. Valable 5 minutes.'

  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioClient._fromNumber,
      to: to,
    })
    log.info('[SMS] Sent to ' + to)
    return { success: true }
  } catch (err) {
    log.error('[SMS] Send error: ' + err.message)
    return { success: false, error: err.message }
  }
}

module.exports = { configureTwilio, isConfigured, sendSMS }
