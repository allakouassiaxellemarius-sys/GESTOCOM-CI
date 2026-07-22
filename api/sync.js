import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const DATA_DIR = path.join('/tmp', 'gestocom_sync')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16)
}

function getDataPath(email) {
  return path.join(DATA_DIR, `${hashEmail(email)}.json`)
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    ensureDir()
    const { email, adminId, data } = req.body
    if (!email || !adminId) return res.status(400).json({ error: 'email et adminId requis' })

    const filePath = getDataPath(email)
    const payload = {
      adminId,
      data,
      syncedAt: new Date().toISOString(),
      version: '1.4.0',
    }

    try {
      fs.writeFileSync(filePath, JSON.stringify(payload), 'utf-8')
      return res.status(200).json({ ok: true, syncedAt: payload.syncedAt })
    } catch (e) {
      return res.status(500).json({ error: 'Erreur sauvegarde' })
    }
  }

  if (req.method === 'GET') {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email requis' })

    const filePath = getDataPath(email)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Aucune donnée trouvée' })

    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const payload = JSON.parse(raw)
      return res.status(200).json(payload)
    } catch {
      return res.status(500).json({ error: 'Erreur lecture' })
    }
  }

  res.status(405).json({ error: 'Method not allowed' })
}
