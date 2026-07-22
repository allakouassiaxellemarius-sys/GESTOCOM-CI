// src/lib/verification.js — Système de vérification (email, téléphone, identité)

const VERIFICATION_KEY = 'gestocom_verification'
const OTP_KEY = 'gestocom_otp'

// ══════════════════════════════════════════════════════════════
// STATUT DE VÉRIFICATION
// ══════════════════════════════════════════════════════════════

function getAllVerifications() {
  try {
    return JSON.parse(localStorage.getItem(VERIFICATION_KEY) || '{}')
  } catch { return {} }
}

function saveAllVerifications(data) {
  try {
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(data))
  } catch {}
}

export function getVerificationStatus(userId) {
  const all = getAllVerifications()
  return all[userId] || { email: false, phone: false, identity: false }
}

export function setVerificationStatus(userId, type, verified) {
  const all = getAllVerifications()
  if (!all[userId]) all[userId] = { email: false, phone: false, identity: false }
  all[userId][type] = verified
  saveAllVerifications(all)
}

export function isEmailVerified(userId) {
  return getVerificationStatus(userId).email === true
}

export function isPhoneVerified(userId) {
  return getVerificationStatus(userId).phone === true
}

export function isIdentityVerified(userId) {
  return getVerificationStatus(userId).identity === true
}

// ══════════════════════════════════════════════════════════════
// GÉNÉRATION & VÉRIFICATION OTP
// ══════════════════════════════════════════════════════════════

function getAllOTP() {
  try {
    return JSON.parse(localStorage.getItem(OTP_KEY) || '{}')
  } catch { return {} }
}

function saveAllOTP(data) {
  try {
    localStorage.setItem(OTP_KEY, JSON.stringify(data))
  } catch {}
}

function generateOTPCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// Envoyer un OTP par email (simulé — affiché dans la console pour dev)
export async function envoyerEmailOTP(userId, email) {
  const code = generateOTPCode()
  const all = getAllOTP()
  
  all[`email_${userId}`] = {
    code,
    email,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    createdAt: new Date().toISOString(),
  }
  
  saveAllOTP(all)
  
  return {
    success: true,
    message: `Code de vérification envoyé à ${email}`,
  }
}

// Envoyer un OTP par SMS (simulé)
export async function envoyerSMSOTP(userId, phone) {
  const code = generateOTPCode()
  const all = getAllOTP()
  
  all[`sms_${userId}`] = {
    code,
    phone,
    expiresAt: Date.now() + 10 * 60 * 1000,
    attempts: 0,
    createdAt: new Date().toISOString(),
  }
  
  saveAllOTP(all)
  
  return {
    success: true,
    message: `Code de vérification envoyé au ${phone}`,
  }
}

// Vérifier un OTP
export function verifierOTP(userId, type, inputCode) {
  const all = getAllOTP()
  const key = `${type}_${userId}`
  const otp = all[key]
  
  if (!otp) return { valid: false, error: 'Aucun code en cours' }
  
  // Vérifier l'expiration
  if (Date.now() > otp.expiresAt) {
    delete all[key]
    saveAllOTP(all)
    return { valid: false, error: 'Code expiré. Demandez un nouveau code.' }
  }
  
  // Vérifier les tentatives (max 5)
  if (otp.attempts >= 5) {
    delete all[key]
    saveAllOTP(all)
    return { valid: false, error: 'Trop de tentatives. Demandez un nouveau code.' }
  }
  
  // Vérifier le code
  if (otp.code !== inputCode) {
    all[key].attempts++
    saveAllOTP(all)
    return { valid: false, error: 'Code incorrect' }
  }
  
  // Code valide — marquer comme vérifié
  delete all[key]
  saveAllOTP(all)
  setVerificationStatus(userId, type === 'email' ? 'email' : 'phone', true)
  
  return { valid: true }
}

// Renvoyer un OTP
export async function renvoyerOTP(userId, type, destination) {
  if (type === 'email') {
    return await envoyerEmailOTP(userId, destination)
  } else {
    return await envoyerSMSOTP(userId, destination)
  }
}

// Vérifier si un OTP est en cours
export function hasPendingOTP(userId, type) {
  const all = getAllOTP()
  const key = `${type}_${userId}`
  const otp = all[key]
  if (!otp) return false
  if (Date.now() > otp.expiresAt) {
    delete all[key]
    saveAllOTP(all)
    return false
  }
  return true
}

// Récupérer le temps restant d'un OTP
export function getOTPRemainingTime(userId, type) {
  const all = getAllOTP()
  const key = `${type}_${userId}`
  const otp = all[key]
  if (!otp) return 0
  return Math.max(0, Math.ceil((otp.expiresAt - Date.now()) / 1000))
}

// ══════════════════════════════════════════════════════════════
// CONFIGURATION OTP PAR UTILISATEUR
// ══════════════════════════════════════════════════════════════

const OTP_CONFIG_KEY = 'gestocom_otp_config'

function getAllOTPConfig() {
  try {
    return JSON.parse(localStorage.getItem(OTP_CONFIG_KEY) || '{}')
  } catch { return {} }
}

function saveAllOTPConfig(data) {
  try {
    localStorage.setItem(OTP_CONFIG_KEY, JSON.stringify(data))
  } catch {}
}

export function getOTPChannel(userId) {
  const config = getAllOTPConfig()
  return config[userId]?.channel || 'email' // Défaut: email
}

export function setOTPChannel(userId, channel) {
  const config = getAllOTPConfig()
  if (!config[userId]) config[userId] = {}
  config[userId].channel = channel
  saveAllOTPConfig(config)
}

export function isOTPEnabled(userId) {
  const config = getAllOTPConfig()
  return config[userId]?.enabled !== false // Défaut: activé
}

export function setOTPEnabled(userId, enabled) {
  const config = getAllOTPConfig()
  if (!config[userId]) config[userId] = {}
  config[userId].enabled = enabled
  saveAllOTPConfig(config)
}

// ══════════════════════════════════════════════════════════════
// VÉRIFICATION D'IDENTITÉ (pour les admins)
// ══════════════════════════════════════════════════════════════

const IDENTITY_KEY = 'gestocom_identity'

function getAllIdentities() {
  try {
    return JSON.parse(localStorage.getItem(IDENTITY_KEY) || '{}')
  } catch { return {} }
}

function saveAllIdentities(data) {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(data))
  } catch {}
}

export function submitIdentityVerification(userId, data) {
  const all = getAllIdentities()
  all[userId] = {
    ...data,
    status: 'pending', // pending, approved, rejected
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  }
  saveAllIdentities(all)
  return true
}

export function getIdentityVerification(userId) {
  const all = getAllIdentities()
  return all[userId] || null
}

export function approveIdentityVerification(userId, reviewerId) {
  const all = getAllIdentities()
  if (all[userId]) {
    all[userId].status = 'approved'
    all[userId].reviewedAt = new Date().toISOString()
    all[userId].reviewedBy = reviewerId
    saveAllIdentities(all)
    setVerificationStatus(userId, 'identity', true)
    return true
  }
  return false
}

export function rejectIdentityVerification(userId, reviewerId, reason) {
  const all = getAllIdentities()
  if (all[userId]) {
    all[userId].status = 'rejected'
    all[userId].reviewedAt = new Date().toISOString()
    all[userId].reviewedBy = reviewerId
    all[userId].rejectionReason = reason
    saveAllIdentities(all)
    return true
  }
  return false
}

// ══════════════════════════════════════════════════════════════
// NETTOYAGE
// ══════════════════════════════════════════════════════════════

export function cleanupExpiredOTPs() {
  const all = getAllOTP()
  let cleaned = 0
  for (const [key, otp] of Object.entries(all)) {
    if (Date.now() > otp.expiresAt) {
      delete all[key]
      cleaned++
    }
  }
  if (cleaned > 0) saveAllOTP(all)
  return cleaned
}
