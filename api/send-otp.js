import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { email, code, subject } = req.body
  if (!email || !code) return res.status(400).json({ error: 'email et code requis' })

  const smtpEmail = process.env.SMTP_EMAIL
  const smtpPass = process.env.SMTP_PASSWORD

  if (!smtpEmail || !smtpPass) {
    return res.status(500).json({ error: 'Configuration SMTP manquante' })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpEmail,
      pass: smtpPass.replace(/\s/g, ''),
    },
  })

  try {
    await transporter.sendMail({
      from: `"GESTOCOM CI" <${smtpEmail}>`,
      to: email,
      subject: subject || 'Code de vérification GESTOCOM CI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1a73e8; margin: 0;">GESTOCOM CI</h1>
          </div>
          <div style="background: #f8f9fa; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="font-size: 16px; color: #333; margin-bottom: 8px;">Votre code de vérification</p>
            <p style="font-size: 36px; font-weight: bold; color: #1a73e8; letter-spacing: 8px; margin: 16px 0;">${code}</p>
            <p style="font-size: 13px; color: #666;">Ce code expire dans 10 minutes.</p>
          </div>
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 24px;">
            Si vous n'avez pas demandé ce code, ignorez cet email.
          </p>
        </div>
      `,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('Erreur envoi email:', err.message)
    return res.status(500).json({ error: "Échec de l'envoi de l'email" })
  }
}
