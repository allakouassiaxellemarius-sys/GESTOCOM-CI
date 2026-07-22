// src/lib/sounds.js — Système d'alertes sonores (Web Audio API)
// Aucune dépendance externe, génère les sons synthétiquement

let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

// ── Paramètres sonores ──
const SOUND_KEY = 'gestocom_sounds'

const DEFAULT_SOUNDS = {
  enabled: true,
  volume: 0.6,
  stockAlert: true,
  paymentError: true,
  suspiciousAttempt: true,
  saleComplete: true,
  newReceipt: false,
  discountAlert: true,
  quantityExceeded: true,
}

export function getSoundSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SOUND_KEY) || 'null')
    return { ...DEFAULT_SOUNDS, ...saved }
  } catch { return { ...DEFAULT_SOUNDS } }
}

export function saveSoundSettings(settings) {
  localStorage.setItem(SOUND_KEY, JSON.stringify(settings))
}

// ── Génération de sons ──

// Bip simple (erreur / alerte)
function playBeep(freq, duration, type = 'sine', volumeMult = 1) {
  const settings = getSoundSettings()
  if (!settings.enabled) return

  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, ctx.currentTime)

    const vol = settings.volume * 0.3 * volumeMult
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

// ── Types d'alertes ──

// Alerte stock bas (double bip aigu)
export function playStockAlert() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.stockAlert) return
  playBeep(880, 0.15, 'sine')
  setTimeout(() => playBeep(880, 0.15, 'sine'), 200)
}

// Erreur de paiement (triple bip grave)
export function playPaymentError() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.paymentError) return
  playBeep(300, 0.2, 'square', 0.7)
  setTimeout(() => playBeep(250, 0.2, 'square', 0.7), 250)
  setTimeout(() => playBeep(200, 0.3, 'square', 0.7), 500)
}

// Tentative suspecte (alarme)
export function playSuspiciousAlert() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.suspiciousAttempt) return
  for (let i = 0; i < 4; i++) {
    setTimeout(() => playBeep(600 + (i % 2) * 400, 0.12, 'sawtooth', 0.5), i * 150)
  }
}

// Vente complète (mélodie succès)
export function playSaleComplete() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.saleComplete) return
  playBeep(523, 0.12, 'sine') // C5
  setTimeout(() => playBeep(659, 0.12, 'sine'), 120) // E5
  setTimeout(() => playBeep(784, 0.2, 'sine'), 240) // G5
}

// Nouveau reçu (bip court)
export function playNewReceipt() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.newReceipt) return
  playBeep(1000, 0.08, 'sine')
  setTimeout(() => playBeep(1200, 0.1, 'sine'), 100)
}

// Alerte remise importante (bip doux ascendant)
export function playDiscountAlert() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.discountAlert) return
  playBeep(440, 0.1, 'triangle')
  setTimeout(() => playBeep(550, 0.1, 'triangle'), 120)
  setTimeout(() => playBeep(660, 0.15, 'triangle'), 240)
}

// Quantité dépassée (double bip grave staccato)
export function playQuantityExceeded() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.quantityExceeded) return
  playBeep(350, 0.08, 'square', 0.8)
  setTimeout(() => playBeep(350, 0.08, 'square', 0.8), 120)
  setTimeout(() => playBeep(280, 0.15, 'square', 0.8), 280)
}

// Bip de test (pour les paramètres)
export function playTestSound() {
  playBeep(523, 0.15, 'sine')
  setTimeout(() => playBeep(659, 0.15, 'sine'), 180)
  setTimeout(() => playBeep(784, 0.15, 'sine'), 360)
  setTimeout(() => playBeep(1047, 0.25, 'sine'), 540)
}

// Rupture de stock critique (alarme longue)
export function playCriticalStockout() {
  const settings = getSoundSettings()
  if (!settings.enabled || !settings.stockAlert) return
  for (let i = 0; i < 6; i++) {
    setTimeout(() => playBeep(i % 2 === 0 ? 1000 : 700, 0.15, 'square', 0.6), i * 180)
  }
}

// Récupérer l'état du son pour l'UI (pour afficher "son activé" etc.)
export function getSoundStatus() {
  const settings = getSoundSettings()
  return {
    enabled: settings.enabled,
    activeCount: [
      settings.stockAlert,
      settings.paymentError,
      settings.suspiciousAttempt,
      settings.saleComplete,
      settings.newReceipt,
      settings.discountAlert,
      settings.quantityExceeded,
    ].filter(Boolean).length,
  }
}
