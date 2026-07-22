// src/lib/crypto.js — Chiffrement AES-256-GCM pour données sensibles
// Utilise Web Crypto API (pas de dépendances externes)

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12

// ── Générer une clé AES-256 à partir d'un mot de passe ──
async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// ── Chiffrer une chaîne de caractères ──
export async function encrypt(plaintext, password) {
  const salt = generateSalt()
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(password, salt)

  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(plaintext)
  )

  // Format: salt:iv:ciphertext (base64)
  const saltB64 = bufferToBase64(salt)
  const ivB64 = bufferToBase64(iv)
  const ctB64 = bufferToBase64(new Uint8Array(ciphertext))

  return `${saltB64}:${ivB64}:${ctB64}`
}

// ── Déchiffrer une chaîne ──
export async function decrypt(encryptedData, password) {
  try {
    const [saltB64, ivB64, ctB64] = encryptedData.split(':')
    const salt = base64ToBuffer(saltB64)
    const iv = base64ToBuffer(ivB64)
    const ciphertext = base64ToBuffer(ctB64)

    const key = await deriveKey(password, salt)

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    )

    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}

// ── Chiffrer un objet JSON ──
export async function encryptJSON(obj, password) {
  const jsonStr = JSON.stringify(obj)
  return encrypt(jsonStr, password)
}

// ── Déchiffrer en objet JSON ──
export async function decryptJSON(encryptedData, password) {
  const jsonStr = await decrypt(encryptedData, password)
  if (!jsonStr) return null
  try {
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

// ── Générer un hash HMAC pour vérification d'intégrité ──
export async function hmacSign(data, secret) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return bufferToBase64(new Uint8Array(signature))
}

// ── Vérifier un hash HMAC ──
export async function hmacVerify(data, secret, expectedSignature) {
  const actual = await hmacSign(data, secret)
  return actual === expectedSignature
}

// ── Helpers ──
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16))
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ═══════════════════════════════════════════
// API de chiffrement des données sensibles
// ═══════════════════════════════════════════

// Clé de chiffrement globale (dérivée du mot de passe maître)
let _masterKey = null

export function setMasterKey(password) {
  _masterKey = password
}

export function getMasterKey() {
  return _masterKey
}

export function hasMasterKey() {
  return !!_masterKey
}

// Chiffrer les données de vente avant stockage
export async function encryptSaleData(saleData) {
  if (!_masterKey) return saleData // Pas de clé = pas de chiffrement
  try {
    const encrypted = await encryptJSON(saleData, _masterKey)
    return { __encrypted: true, data: encrypted }
  } catch {
    return saleData
  }
}

// Déchiffrer les données de vente
export async function decryptSaleData(encryptedSaleData) {
  if (!_masterKey) return encryptedSaleData
  if (!encryptedSaleData?.__encrypted) return encryptedSaleData
  try {
    return await decryptJSON(encryptedSaleData.data, _masterKey)
  } catch {
    return null
  }
}

// Chiffrer un reçu
export async function encryptReceipt(receipt) {
  if (!_masterKey) return receipt
  try {
    const sensitiveFields = {
      client: receipt.client,
      telephone: receipt.telephone,
      referencePaiement: receipt.referencePaiement,
    }
    const encrypted = await encryptJSON(sensitiveFields, _masterKey)
    return { ...receipt, __encryptedFields: encrypted, client: '***', telephone: '***', referencePaiement: '***' }
  } catch {
    return receipt
  }
}

// Déchiffrer un reçu
export async function decryptReceipt(receipt) {
  if (!_masterKey || !receipt.__encryptedFields) return receipt
  try {
    const fields = await decryptJSON(receipt.__encryptedFields, _masterKey)
    return { ...receipt, ...fields, __encryptedFields: undefined }
  } catch {
    return receipt
  }
}
