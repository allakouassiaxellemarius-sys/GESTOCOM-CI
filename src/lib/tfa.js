// src/lib/tfa.js — Authentification à deux facteurs (TOTP)
// Utilise Web Crypto API pour la génération de secrets et la vérification HMAC-SHA1

// ── Génération de secret Base32 ──
function generateBase32Secret(length = 20) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => chars[b % 32]).join('')
}

// ── Base32 → ArrayBuffer ──
function base32Decode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  str = str.replace(/=+$/, '').toUpperCase()
  let bits = ''
  for (const c of str) {
    const val = chars.indexOf(c)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2)
  }
  return bytes.buffer
}

// ── HMAC-SHA1 pour TOTP ──
async function hmacSha1(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, message)
  return new Uint8Array(sig)
}

// ── Générer le TOTP pour un instant donné ──
async function generateTOTP(secret, timeStep = 30, digits = 6) {
  const epoch = Math.floor(Date.now() / 1000)
  const counter = Math.floor(epoch / timeStep)

  // Counter en big-endian 8 bytes
  const counterBytes = new ArrayBuffer(8)
  const view = new DataView(counterBytes)
  view.setUint32(4, counter, false)

  const keyBytes = base32Decode(secret)
  const hmac = await hmacSha1(keyBytes, counterBytes)

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, digits)

  return code.toString().padStart(digits, '0')
}

// ── Vérifier un code TOTP (accepte -1, 0, +1 fenêtres) ──
async function verifyTOTP(secret, inputCode, timeStep = 30) {
  for (const offset of [-1, 0, 1]) {
    const epoch = Math.floor(Date.now() / 1000)
    const counter = Math.floor(epoch / timeStep) + offset

    const counterBytes = new ArrayBuffer(8)
    const view = new DataView(counterBytes)
    view.setUint32(4, counter, false)

    const keyBytes = base32Decode(secret)
    const hmac = await hmacSha1(keyBytes, counterBytes)

    const hmacOffset = hmac[hmac.length - 1] & 0x0f
    const code = (
      ((hmac[hmacOffset] & 0x7f) << 24) |
      ((hmac[hmacOffset + 1] & 0xff) << 16) |
      ((hmac[hmacOffset + 2] & 0xff) << 8) |
      (hmac[hmacOffset + 3] & 0xff)
    ) % 1000000

    if (code.toString().padStart(6, '0') === inputCode) return true
  }
  return false
}

// ═══════════════════════════════════════════
// API publique
// ═══════════════════════════════════════════

const TFA_KEY = 'gestocom_2fa'

// Activer le 2FA pour un utilisateur
export async function enable2FA(userId) {
  const settings = getAll2FA()
  const secret = generateBase32Secret()
  settings[userId] = {
    secret,
    enabled: false,  // S'active après vérification du premier code
    backupCodes: generateBackupCodes(),
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(TFA_KEY, JSON.stringify(settings))
  return {
    secret,
    otpauthUrl: `otpauth://totp/GESTOCOM+CI:user${userId}?secret=${secret}&issuer=GESTOCOM+CI&digits=6&period=30`,
  }
}

// Vérifier le code d'activation et activer le 2FA
export async function confirm2FA(userId, code) {
  const settings = getAll2FA()
  const user2fa = settings[userId]
  if (!user2fa) return false

  const valid = await verifyTOTP(user2fa.secret, code)
  if (valid && !user2fa.enabled) {
    settings[userId].enabled = true
    localStorage.setItem(TFA_KEY, JSON.stringify(settings))
  }
  return valid
}

// Vérifier un code TOTP lors de la connexion
export async function verify2FACode(userId, code) {
  const settings = getAll2FA()
  const user2fa = settings[userId]
  if (!user2fa || !user2fa.enabled) return true // Pas de 2FA = auto-valide

  // Vérifier le code TOTP
  if (await verifyTOTP(user2fa.secret, code)) return true

  // Vérifier les codes de secours
  if (user2fa.backupCodes && user2fa.backupCodes.includes(code)) {
    settings[userId].backupCodes = user2fa.backupCodes.filter(c => c !== code)
    localStorage.setItem(TFA_KEY, JSON.stringify(settings))
    return true
  }

  return false
}

// Désactiver le 2FA
export function disable2FA(userId) {
  const settings = getAll2FA()
  delete settings[userId]
  localStorage.setItem(TFA_KEY, JSON.stringify(settings))
}

// Vérifier si le 2FA est activé pour un utilisateur
export function is2FAEnabled(userId) {
  const settings = getAll2FA()
  return settings[userId]?.enabled === true
}

// Récupérer les infos 2FA d'un utilisateur
export function get2FAInfo(userId) {
  const settings = getAll2FA()
  return settings[userId] || null
}

// ── Codes de secours ──
function generateBackupCodes(count = 8) {
  const codes = []
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4)
    crypto.getRandomValues(array)
    codes.push(Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase())
  }
  return codes
}

// ── Helpers ──
function getAll2FA() {
  try {
    return JSON.parse(localStorage.getItem(TFA_KEY) || '{}')
  } catch { return {} }
}

// Générer le QR code SVG (data URL) pour le 2FA
export function generate2FAQRCode(otpauthUrl) {
  // Utilise un QR code simplifié basé sur l'URL
  // Le composant React utilisera le qrcode existant ou un lien
  return otpauthUrl
}

// ── Récupérer le countdown TOTP (secondes restantes) ──
export function getTOTPCountdown(timeStep = 30) {
  const epoch = Math.floor(Date.now() / 1000)
  return timeStep - (epoch % timeStep)
}
