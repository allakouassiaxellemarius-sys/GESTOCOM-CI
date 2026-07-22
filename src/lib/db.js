const DB_PREFIX = 'gestocom_'
let _currentAdminId = null

export function setCurrentAdminId(adminId) {
  if (_currentAdminId === adminId) return
  _currentAdminId = adminId
  clearSqlCache()
}
export function getCurrentAdminId() { return _currentAdminId }

function clearSqlCache() {
  for (const k of Object.keys(sqlCache)) delete sqlCache[k]
  for (const k of Object.keys(sqlSettingsCache)) delete sqlSettingsCache[k]
}

function getKey(name) {
  // Users table is ALWAYS global (needed for authentication)
  if (name === 'users') return DB_PREFIX + name
  // Login attempts are global too
  if (name === 'login_attempts') return DB_PREFIX + name
  // Everything else is scoped by admin
  if (_currentAdminId) return DB_PREFIX + 'admin_' + _currentAdminId + '_' + name
  return DB_PREFIX + name
}

function nextId(items) { return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1 }

// ── Electron SQLite detection ──
const isElectron = typeof window !== 'undefined' && window.electronAPI?.db
const dbApi = isElectron ? window.electronAPI.db : null

// ── Safe DB call wrapper ──
function safeDb(fn, fallback) {
  if (!dbApi) return undefined
  try {
    const result = fn()
    if (result && result.__error) { console.error('DB error:', result.message); return fallback }
    return result
  } catch (e) { console.error('DB error:', e); return fallback }
}

// ══════════════════════════════════════════════════════════════
// SQLite CACHE LAYER
// ══════════════════════════════════════════════════════════════
let sqlReady = false
const sqlCache = {}
const sqlSettingsCache = {}

export function isSqliteReady() { return sqlReady }
export function getSqlCache(name) {
  if (!(name in sqlCache)) return undefined
  return sqlCache[name]
}

export async function loadSqliteCache(sqlite) {
  const tables = [
    'users', 'products', 'products_v2', 'ventes', 'depenses', 'fournisseurs',
    'commandes', 'retours', 'receipts', 'logs',
    'stock_mouvements', 'stock_entrepots', 'stock_lots', 'stock_inventaires',
    'kyc_kyb_documents',
  ]
  for (const t of tables) {
    try {
      const rows = await sqlite.sqlGetAll(t)
      sqlCache[t] = rows.map(row => rowToJs(row))
    } catch {
      sqlCache[t] = []
    }
  }
  // Load settings
  const settingsKeys = ['company', 'stock_settings', 'ventes_settings', 'clients_settings', 'rapports_settings', 'login_attempts']
  for (const k of settingsKeys) {
    try {
      sqlSettingsCache[k] = await sqlite.sqlGetSetting(k)
    } catch {
      sqlSettingsCache[k] = null
    }
  }
  sqlReady = true
}

function rowToJs(row) {
  const obj = {}
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
      try { obj[camel] = JSON.parse(v); continue } catch {}
    }
    if (k === 'actif' || k === 'is_default') {
      obj[camel] = v === 1 || v === true
    } else {
      obj[camel] = v
    }
  }
  return obj
}

function jsToRow(obj) {
  const row = {}
  for (const [k, v] of Object.entries(obj)) {
    const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase()
    if (typeof v === 'object' && v !== null) {
      row[snake] = JSON.stringify(v)
    } else if (typeof v === 'boolean') {
      row[snake] = v ? 1 : 0
    } else {
      row[snake] = v
    }
  }
  return row
}

let sqliteModule = null
export function setSqliteModule(m) { sqliteModule = m }

function getAll(name) {
  if (sqlReady && sqlCache[name] && sqlCache[name].length > 0) return sqlCache[name]
  try { return JSON.parse(localStorage.getItem(getKey(name)) || '[]') } catch { return [] }
}

function setAll(name, data) {
  sqlCache[name] = data
  try { localStorage.setItem(getKey(name), JSON.stringify(data)) } catch {}
  // Write-through to SQLite
  if (sqlReady && sqliteModule) {
    syncTableToSqlite(name, data).catch(() => {})
  }
}

async function syncTableToSqlite(name, data) {
  if (!sqliteModule?.isSQLiteAvailable()) return
  const { sqlRun, sqlQuery } = sqliteModule
  // Delete all then re-insert (simple strategy for small datasets)
  await sqlRun(`DELETE FROM ${name}`)
  for (const item of data) {
    const row = jsToRow(item)
    const keys = Object.keys(row)
    const placeholders = keys.map(() => '?').join(',')
    const vals = keys.map(k => row[k])
    await sqlRun(`INSERT INTO ${name} (${keys.join(',')}) VALUES (${placeholders})`, vals)
  }
}

function getSettings(key) {
  if (sqlReady && sqlSettingsCache[key] !== undefined) return sqlSettingsCache[key]
  if (dbApi) return safeDb(() => dbApi.getSetting(key), null)
  try { return JSON.parse(localStorage.getItem(getKey(key)) || 'null') } catch { return null }
}

function saveSettings(key, value) {
  sqlSettingsCache[key] = value
  try { localStorage.setItem(getKey(key), JSON.stringify(value)) } catch {}
  if (sqlReady && sqliteModule) {
    sqliteModule.sqlSetSetting(key, value).catch(() => {})
  }
}

// ── Sécurité : Sanitize (XSS) ──
export function sanitize(str) {
  if (typeof str !== 'string') return str
  return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c])
}

function sanitizeObj(obj) {
  const clean = {}
  for (const [k, v] of Object.entries(obj)) clean[k] = typeof v === 'string' ? sanitize(v) : v
  return clean
}

// ── Sécurité : PBKDF2 Hash ──
async function pbkdf2Hash(password, salt) {
  if (dbApi) return await dbApi.hashPassword(password, salt)
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSalt() {
  if (dbApi) return null // handled server-side
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
}

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0
  return 'h_' + Math.abs(h).toString(36)
}

// ── Sécurité : Audit Logs ──
export function addLog(action, detail = '', userId = null, userNom = '') {
  if (dbApi) { safeDb(() => dbApi.addLog(action, detail, userId, userNom)); return }
  const logs = getAll('logs')
  logs.push({ id: nextId(logs), timestamp: new Date().toISOString(), action, detail: sanitize(detail), userId, userNom: sanitize(userNom) })
  if (logs.length > 500) logs.splice(0, logs.length - 500)
  setAll('logs', logs)
}

export function getLogs() {
  if (dbApi) return safeDb(() => dbApi.getLogs(), [])
  return getAll('logs')
}

export function clearLogs() {
  if (dbApi) { safeDb(() => dbApi.clearLogs()); return }
  setAll('logs', [])
}

export function exportLogs() {
  const logs = getLogs()
  const csv = [
    ['ID', 'Date', 'Action', 'Détail', 'Utilisateur'].join(';'),
    ...logs.map(l => [l.id, l.timestamp, l.action, `"${l.detail}"`, l.userNom].join(';'))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Sécurité : Verrouillage après échecs ──
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 5 * 60 * 1000

export function getLoginAttempts() {
  if (dbApi) {
    try {
      const r = dbApi.getLoginAttempts()
      if (r && r.__error) return { count: 0, lockedUntil: null }
      return r || { count: 0, lockedUntil: null }
    }
    catch { return { count: 0, lockedUntil: null } }
  }
  try {
    const data = JSON.parse(localStorage.getItem(getKey('login_attempts')) || '{}')
    if (data.lockedUntil && Date.now() > data.lockedUntil) { localStorage.removeItem(getKey('login_attempts')); return { count: 0, lockedUntil: null } }
    return data
  } catch { return { count: 0, lockedUntil: null } }
}

export function recordFailedAttempt() {
  try {
    const data = getLoginAttempts()
    const count = (data.count || 0) + 1
    if (count >= MAX_ATTEMPTS) {
      if (dbApi) { try { dbApi.setLoginAttempts({ count: 0, lockedUntil: Date.now() + LOCKOUT_MS }) } catch {} }
      else localStorage.setItem(getKey('login_attempts'), JSON.stringify({ count: 0, lockedUntil: Date.now() + LOCKOUT_MS }))
    } else {
      if (dbApi) { try { dbApi.setLoginAttempts({ count, lockedUntil: null }) } catch {} }
      else localStorage.setItem(getKey('login_attempts'), JSON.stringify({ count, lockedUntil: null }))
    }
    return count >= MAX_ATTEMPTS
  } catch { return false }
}

export function clearLoginAttempts() {
  try {
    if (dbApi) { try { dbApi.clearLoginAttempts() } catch {} return }
    localStorage.removeItem(getKey('login_attempts'))
  } catch {}
}

export function isLocked() {
  try {
    const data = getLoginAttempts()
    return data && data.lockedUntil && Date.now() < data.lockedUntil
  } catch { return false }
}

export function getLockRemaining() {
  try {
    const data = getLoginAttempts()
    if (!data || !data.lockedUntil) return 0
    return Math.max(0, data.lockedUntil - Date.now())
  } catch { return 0 }
}

export function validatePassword(pw) {
  const errors = []
  if (pw.length < 8) errors.push('au moins 8 caractères')
  if (!/[A-Z]/.test(pw)) errors.push('au moins 1 majuscule')
  if (!/[0-9]/.test(pw)) errors.push('au moins 1 chiffre')
  return errors
}

// ── Produits ──
export function getProducts() {
  if (dbApi) {
    try { const r = dbApi.getProducts(); if (r && r.__error) return []; return r || [] }
    catch { return [] }
  }
  return getAll('products')
}

export function getProduct(id) {
  if (dbApi) return safeDb(() => dbApi.getProductById(id), null)
  return getAll('products').find(p => p.id === id) || null
}

export function getProductByBarcode(barcode) {
  if (dbApi) return safeDb(() => dbApi.getProductByBarcode(barcode), null)
  const v1 = getAll('products').find(p => p.barcode === barcode)
  if (v1) return v1
  try {
    const v2 = JSON.parse(localStorage.getItem('gestocom_products_v2') || '[]').find(p => p.barcode === barcode)
    if (v2) return v2
  } catch {}
  return null
}

function generateBarcode(productId) { return `GCI${String(productId).padStart(6, '0')}` }

export function addProduct(p) {
  if (dbApi) { return safeDb(() => dbApi.createProduct(sanitizeObj(p)), null) }
  const items = getAll('products')
  p.id = nextId(items); p.barcode = p.barcode || generateBarcode(p.id)
  items.push(sanitizeObj(p)); setAll('products', items)
  addLog('Produit ajouté', `${p.nom}`, p.id)
  return p
}

export function updateProduct(p) {
  if (dbApi) { safeDb(() => dbApi.updateProduct(sanitizeObj(p))); return }
  const items = getAll('products')
  const idx = items.findIndex(i => i.id === p.id)
  if (idx !== -1) {
    const old = items[idx]
    const stockInitial = p.stockInitial || 0
    const delta = stockInitial - (old.stockInitial || 0)
    items[idx] = { ...sanitizeObj(p), stockActuel: (old.stockActuel || 0) + delta }
  }
  setAll('products', items)
  addLog('Produit modifié', `${p.nom}`, p.id)
}

export function deleteProduct(id) {
  if (dbApi) { safeDb(() => dbApi.deleteProduct(id)); return }
  const p = getProduct(id)
  setAll('products', getAll('products').filter(i => i.id !== id))
  addLog('Produit supprimé', `${p?.nom || id}`, id)
}

export function approvisionner(id, nbCasiers) {
  if (dbApi) { safeDb(() => dbApi.approvisionner(id, nbCasiers)); return }
  const items = getAll('products')
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return
  const p = items[idx]
  const added = nbCasiers * p.nbUnitesParCasier
  items[idx] = { ...p, stockActuel: p.stockActuel + added, nombreCasiers: p.nombreCasiers + nbCasiers }
  setAll('products', items)
  addLog('Approvisionnement', `${p.nom}: +${nbCasiers} casiers (+${added} u.)`, id)
}

export function getProductsEnAlerte() {
  if (dbApi) {
    try { const r = dbApi.getProductsEnAlerte(); if (r && r.__error) return []; return r || [] }
    catch { return [] }
  }
  return getProducts().filter(p => p.stockActuel <= p.seuilAlerte)
}

// ── Ventes ──
export function getVentes() {
  if (dbApi) return safeDb(() => dbApi.getVentes(), [])
  return getAll('ventes')
}

export function vendre(produitId, quantite, options = {}) {
  if (dbApi) {
    return safeDb(() => {
      const p = dbApi.getProductById(produitId)
      if (!p || p.__error || p.stockActuel < quantite) return null
      const coutAchat = p.prixCasier / p.nbUnitesParCasier
      const sousTotal = quantite * p.prixUnite
      const remise = options.remiseType === 'pourcentage' ? Math.round(sousTotal * (options.remise || 0) / 100) : (options.remise || 0)
      const total = Math.max(0, sousTotal - remise)
      dbApi.updateProductStock(produitId, quantite)
      const sale = { produitId, nomProduit: p.nom, typeProduit: p.type, quantite, prixUnitaire: p.prixUnite, coutAchat, sousTotal, remise, total, modePaiement: options.modePaiement || 'especes', caissier: sanitize(options.caissier || 'Inconnu'), dateVente: new Date().toISOString() }
      const created = dbApi.createVente(sale)
      addLog('Vente', `${p.nom} x${quantite} = ${(total || 0).toLocaleString('fr-FR')} FCFA`, options.userId, options.caissier)
      return created
    }, null)
  }
  const items = getAll('products')
  const idx = items.findIndex(i => i.id === produitId)
  if (idx === -1) return null
  const p = items[idx]
  if (p.stockActuel < quantite) return null
  const coutAchat = p.prixCasier / p.nbUnitesParCasier
  const sousTotal = quantite * p.prixUnite
  const remise = options.remiseType === 'pourcentage' ? Math.round(sousTotal * (options.remise || 0) / 100) : (options.remise || 0)
  const total = Math.max(0, sousTotal - remise)
  items[idx] = { ...p, stockActuel: p.stockActuel - quantite }
  setAll('products', items)
  const ventes = getAll('ventes')
  const sale = { id: nextId(ventes), produitId, nomProduit: p.nom, typeProduit: p.type, quantite, prixUnitaire: p.prixUnite, coutAchat, sousTotal, remise, total, modePaiement: options.modePaiement || 'especes', caissier: sanitize(options.caissier || 'Inconnu'), dateVente: new Date().toISOString() }
  ventes.push(sale); setAll('ventes', ventes)
  addLog('Vente', `${p.nom} x${quantite} = ${total.toLocaleString('fr-FR')} FCFA`, options.userId, options.caissier)
  return sale
}

// ── Dépenses ──
export function getDepenses() {
  if (dbApi) return safeDb(() => dbApi.getDepenses(), [])
  return getAll('depenses')
}

export function addDepense(d) {
  if (dbApi) { return safeDb(() => dbApi.createDepense({ ...d, date: d.date || new Date().toISOString() }), null) }
  const items = getAll('depenses')
  d.id = nextId(items); d.date = d.date || new Date().toISOString()
  items.push(sanitizeObj(d)); setAll('depenses', items)
  addLog('Dépense ajoutée', `${d.libelle} — ${d.montant?.toLocaleString('fr-FR')} FCFA`, d.id)
  return d
}

export function updateDepense(d) {
  if (dbApi) { safeDb(() => dbApi.updateDepense(sanitizeObj(d))); return }
  const items = getAll('depenses')
  const idx = items.findIndex(i => i.id === d.id)
  if (idx !== -1) items[idx] = sanitizeObj(d)
  setAll('depenses', items)
  addLog('Dépense modifiée', `${d.libelle}`, d.id)
}

export function deleteDepense(id) {
  if (dbApi) { safeDb(() => dbApi.deleteDepense(id)); return }
  const d = getDepenses().find(x => x.id === id)
  setAll('depenses', getDepenses().filter(i => i.id !== id))
  addLog('Dépense supprimée', `${d?.libelle || id}`, id)
}

// ── Fournisseurs ──
export function getFournisseurs() {
  if (dbApi) return safeDb(() => dbApi.getFournisseurs(), [])
  return getAll('fournisseurs')
}

export function addFournisseur(f) {
  if (dbApi) { return safeDb(() => dbApi.createFournisseur(sanitizeObj(f)), null) }
  const items = getAll('fournisseurs')
  f.id = nextId(items); items.push(sanitizeObj(f)); setAll('fournisseurs', items)
  addLog('Fournisseur ajouté', `${f.nom}`, f.id)
  return f
}

export function updateFournisseur(f) {
  if (dbApi) { safeDb(() => dbApi.updateFournisseur(sanitizeObj(f))); return }
  const items = getAll('fournisseurs')
  const idx = items.findIndex(i => i.id === f.id)
  if (idx !== -1) items[idx] = sanitizeObj(f)
  setAll('fournisseurs', items)
  addLog('Fournisseur modifié', `${f.nom}`, f.id)
}

export function deleteFournisseur(id) {
  if (dbApi) { safeDb(() => dbApi.deleteFournisseur(id)); return }
  const f = getFournisseurs().find(x => x.id === id)
  setAll('fournisseurs', getFournisseurs().filter(i => i.id !== id))
  addLog('Fournisseur supprimé', `${f?.nom || id}`, id)
}

// ── Settings ──
const DEFAULTS = {
  company: { nom: 'LES RETROUVAILLES CEZ LUICI', nomCommercial: 'GESTOCOM CI', adresse: '', telephone: '', email: '', logo: '', devise: 'FCFA', langue: 'fr' },
  stock_settings: { seuilAlerteDefaut: 50, categories: ['Bouteille', 'Canette'], prefixeCodeBarres: 'GCI' },
  ventes_settings: { modesPaiement: ['Espèces', 'Mobile Money', 'Carte Bancaire', 'Crédit'], remisesActivees: true, ticketsActivees: true, prefixeTicket: 'REC', messageRecu: 'Merci de votre confiance !', politiqueRetour: 'Échanges sous 7 jours avec reçu', tvaActivee: true, tvaTaux: 18, remiseMaxTaux: 50 },
  clients_settings: { fideliteActivee: false, pointsParFCFA: 0.01, seuilVIP: 100000, segmentationActivee: false },
  rapports_settings: { formatExport: 'pdf', autoBackup: false, periodiciteBackup: 'quotidienne' },
}

function withDefaults(key) {
  const saved = getSettings(key)
  return { ...DEFAULTS[key], ...(saved || {}) }
}

export function getCompanySettings() { return withDefaults('company') }
export function saveCompanySettings(s) { saveSettings('company', { ...getCompanySettings(), ...s }) }
export function getStockSettings() { return withDefaults('stock_settings') }
export function saveStockSettings(s) { saveSettings('stock_settings', { ...getStockSettings(), ...s }) }
export function getVentesSettings() { return withDefaults('ventes_settings') }
export function saveVentesSettings(s) { saveSettings('ventes_settings', { ...getVentesSettings(), ...s }) }
export function getClientsSettings() { return withDefaults('clients_settings') }
export function saveClientsSettings(s) { saveSettings('clients_settings', { ...getClientsSettings(), ...s }) }
export function getRapportsSettings() { return withDefaults('rapports_settings') }
export function saveRapportsSettings(s) { saveSettings('rapports_settings', { ...getRapportsSettings(), ...s }) }

// ── Utilisateurs ──
const DEFAULT_ADMIN_CREDENTIALS = { nom: 'Admin', motDePasse: 'Admin123!', role: 'admin' }

export function getUsers() {
  if (dbApi) {
    try { const r = dbApi.getUsers(); if (r && r.__error) return []; return r || [] }
    catch { return [] }
  }
  return getAll('users')
}

export function isDefaultAdmin(user) {
  return user?.isDefault === true || user?.nom === DEFAULT_ADMIN_CREDENTIALS.nom
}

export async function ensureDefaultAdmin() {
  if (dbApi) { try { await dbApi.getUsers() } catch {} return null }
  const items = getAll('users')
  if (items.length === 0) {
    const salt = generateSalt()
    const hashed = await pbkdf2Hash(DEFAULT_ADMIN_CREDENTIALS.motDePasse, salt)
    const admin = { id: 1, nom: DEFAULT_ADMIN_CREDENTIALS.nom, motDePasse: hashed, salt, role: DEFAULT_ADMIN_CREDENTIALS.role, isDefault: true, adminId: 1 }
    setAll('users', [admin])
    addLog('Admin par défaut créé', DEFAULT_ADMIN_CREDENTIALS.nom, 1, DEFAULT_ADMIN_CREDENTIALS.nom)
    return admin
  }
  return null
}

export function getUsersForAdmin(adminId) {
  return getAll('users').filter(u => u.adminId === adminId || u.role === 'admin')
}

export function getUserByEmail(email) {
  if (dbApi) {
    try { return dbApi.getUserByEmail(email) || null } catch { return null }
  }
  return getAll('users').find(u => u.email === email) || null
}

// ── Vérification ──
import { getVerificationStatus as _getVerificationStatus, isEmailVerified as _isEmailVerified, isPhoneVerified as _isPhoneVerified } from './verification'

export function getVerificationStatus(userId) { return _getVerificationStatus(userId) }
export function isEmailVerified(userId) { return _isEmailVerified(userId) }
export function isPhoneVerified(userId) { return _isPhoneVerified(userId) }

export async function addUser(nom, motDePasse, role) {
  if (dbApi) return safeDb(() => dbApi.createUser(nom, motDePasse, role, null, null, _currentAdminId), null)
  const items = getAll('users')
  if (items.find(u => u.nom === nom)) return null
  const salt = generateSalt()
  const hashed = await pbkdf2Hash(motDePasse, salt)
  const u = { id: nextId(items), nom, motDePasse: hashed, salt, role, adminId: _currentAdminId || null, dateCreation: new Date().toISOString() }
  items.push(u); setAll('users', items)
  addLog('Utilisateur créé', `${nom} (${role})`, u.id, nom)
  return u
}

export function deleteUser(id) {
  if (dbApi) return safeDb(() => dbApi.deleteUser(id), false)
  const items = getAll('users')
  const u = items.find(x => x.id === id)
  if (u && (u.isDefault || u.nom === DEFAULT_ADMIN_CREDENTIALS.nom)) return false
  setAll('users', items.filter(x => x.id !== id))
  addLog('Utilisateur supprimé', `${u?.nom || id}`, id)
  return true
}

export function updateUserRole(id, role) {
  if (dbApi) { safeDb(() => dbApi.updateUserRole(id, role)); return }
  const items = getAll('users')
  const idx = items.findIndex(u => u.id === id)
  if (idx === -1) return
  const u = items[idx]
  if (u.isDefault || u.nom === DEFAULT_ADMIN_CREDENTIALS.nom) return
  items[idx].role = role; setAll('users', items)
  addLog('Rôle modifié', `Nouveau rôle: ${role}`, id)
}

export async function authentifier(nom, motDePasse) {
  try {
    if (isLocked()) return { error: 'locked' }
  } catch { return { error: 'locked' } }

  // Accept email or username — resolve to user object
  const isEmail = nom.includes('@')

  if (dbApi) {
    try {
      const u = isEmail ? dbApi.getUserByEmail(nom) : null
      const lookupName = u ? u.nom : nom
      const result = await dbApi.verifyPassword(lookupName, motDePasse)
      if (!result) { recordFailedAttempt(); addLog('Tentative échouée', `Utilisateur inconnu: ${nom}`); return null }
      if (result.__error) { return { error: result.message || 'Erreur de connexion' } }
      if (result.failed) {
        const locked = recordFailedAttempt()
        addLog('Tentative échouée', `Mot de passe incorrect: ${nom}`, result.user?.id, nom)
        return locked ? { error: 'locked' } : null
      }
      if (!result.id) { return { error: 'Erreur de connexion' } }
      clearLoginAttempts()
      addLog('Connexion réussie', nom, result.id, result.nom)
      const adminId = result.role === 'admin' ? result.id : (result.adminId || null)
      return { id: result.id, nom: result.nom, role: result.role, adminId, email: result.email, telephone: result.telephone }
    } catch {
      return { error: 'Erreur de connexion à la base de données' }
    }
  }

  const u = isEmail
    ? getAll('users').find(u => u.email === nom)
    : getAll('users').find(u => u.nom === nom)
  if (!u) { recordFailedAttempt(); addLog('Tentative échouée', `Utilisateur inconnu: ${nom}`); return null }

  if (u.salt && u.motDePasse.length === 64) {
    const hashed = await pbkdf2Hash(motDePasse, u.salt)
    if (hashed !== u.motDePasse) {
      const locked = recordFailedAttempt()
      addLog('Tentative échouée', `Mot de passe incorrect: ${nom}`, u.id, nom)
      return locked ? { error: 'locked' } : null
    }
  } else {
    if (u.motDePasse !== simpleHash(motDePasse)) {
      const locked = recordFailedAttempt()
      addLog('Tentative échouée', `Mot de passe incorrect: ${nom}`, u.id, nom)
      return locked ? { error: 'locked' } : null
    }
    const salt = generateSalt()
    const newHash = await pbkdf2Hash(motDePasse, salt)
    const items = getAll('users')
    const idx = items.findIndex(x => x.id === u.id)
    if (idx !== -1) { items[idx].salt = salt; items[idx].motDePasse = newHash }
    setAll('users', items)
  }
  clearLoginAttempts()
  addLog('Connexion réussie', nom, u.id, nom)
  const adminId = u.role === 'admin' ? u.id : (u.adminId || null)
  return { id: u.id, nom: u.nom, role: u.role, adminId, email: u.email, telephone: u.telephone }
}

export async function changerMotDePasse(userId, ancien, nouveau) {
  if (dbApi) {
    try {
      const user = await dbApi.getUserById(userId)
      if (!user || user.__error) return false
      const result = await dbApi.verifyPassword(user.nom, ancien)
      if (!result || result.failed || result.__error) return false
      await dbApi.updateUserPassword(userId, nouveau)
      addLog('Mot de passe modifié', '', userId)
      return true
    } catch { return false }
  }
  const items = getAll('users')
  const idx = items.findIndex(u => u.id === userId)
  if (idx === -1) return false
  const u = items[idx]
  let ok = false
  if (u.salt && u.motDePasse.length === 64) {
    const hashed = await pbkdf2Hash(ancien, u.salt)
    ok = hashed === u.motDePasse
  } else { ok = u.motDePasse === simpleHash(ancien) }
  if (!ok) return false
  const salt = generateSalt()
  items[idx].motDePasse = await pbkdf2Hash(nouveau, salt)
  items[idx].salt = salt
  setAll('users', items)
  addLog('Mot de passe modifié', '', userId, u.nom)
  return true
}

export async function resetAdminPassword() {
  if (dbApi) return false
  const items = getAll('users')
  const idx = items.findIndex(u => u.isDefault || u.nom === DEFAULT_ADMIN_CREDENTIALS.nom)
  if (idx === -1) return false
  const salt = generateSalt()
  items[idx].motDePasse = await pbkdf2Hash(DEFAULT_ADMIN_CREDENTIALS.motDePasse, salt)
  items[idx].salt = salt
  setAll('users', items)
  addLog('Mot de passe admin réinitialisé', DEFAULT_ADMIN_CREDENTIALS.nom, items[idx].id, DEFAULT_ADMIN_CREDENTIALS.nom)
  return true
}

export async function setNewPassword(userId, newPassword) {
  if (dbApi) {
    try { await dbApi.updateUserPassword(userId, newPassword); return true } catch { return { error: 'Erreur lors de la mise à jour du mot de passe.' } }
  }
  const items = getAll('users')
  const idx = items.findIndex(u => u.id === userId)
  if (idx === -1) return { error: 'Utilisateur introuvable.' }
  const salt = generateSalt()
  items[idx].motDePasse = await pbkdf2Hash(newPassword, salt)
  items[idx].salt = salt
  setAll('users', items)
  addLog('Mot de passe réinitialisé', '', userId, items[idx].nom)
  return true
}

export async function inscrire(nom, motDePasse, email, telephone, role = 'vendeur') {
  if (dbApi) {
    try { const u = await dbApi.createUser(nom, motDePasse, role, sanitize(email), sanitize(telephone), _currentAdminId)
      if (!u || u.__error || !u.id) { return { error: u?.message?.includes('UNIQUE') ? 'Ce nom d\'utilisateur existe déjà' : (u?.message || 'Erreur lors de la création du compte') } }
      addLog('Inscription', `${nom} (${role})`, u.id, nom)
      return { user: { id: u.id, nom: u.nom, role: u.role } }
    }
    catch(e) { console.error('[inscrire] createUser exception:', e); return { error: e.message?.includes('UNIQUE') ? 'Ce nom d\'utilisateur existe déjà' : (e.message || 'Erreur lors de l\'inscription') } }
  }
  const items = getAll('users')
  if (items.find(u => u.nom === nom)) return { error: 'Ce nom d\'utilisateur existe déjà' }
  if (email && items.find(u => u.email === email)) return { error: 'Cet email est déjà utilisé' }
  const salt = generateSalt()
  const hashed = await pbkdf2Hash(motDePasse, salt)
  const u = { id: nextId(items), nom, motDePasse: hashed, salt, email: sanitize(email), telephone: sanitize(telephone), role, adminId: _currentAdminId || null, dateCreation: new Date().toISOString() }
  items.push(u); setAll('users', items)
  addLog('Inscription', `${nom} (${role})`, u.id, nom)
  return { user: { id: u.id, nom: u.nom, role: u.role } }
}

// ── Profit ──
export function getBeneficeParJour(jours) {
  if (dbApi) return safeDb(() => dbApi.getBeneficeParJour(jours), [])
  const depuis = new Date(); depuis.setDate(depuis.getDate() - jours)
  const ventes = getAll('ventes')
  const depenses = getAll('depenses')
  const ventesMap = {}; const depensesMap = {}
  ventes.filter(v => new Date(v.dateVente) >= depuis).forEach(v => { const j = v.dateVente.slice(0, 10); ventesMap[j] = (ventesMap[j] || 0) + v.total })
  depenses.filter(d => new Date(d.date) >= depuis).forEach(d => { const j = d.date.slice(0, 10); depensesMap[j] = (depensesMap[j] || 0) + d.montant })
  const allDays = [...new Set([...Object.keys(ventesMap), ...Object.keys(depensesMap)])].sort()
  return allDays.map(jour => ({ jour, ventes: ventesMap[jour] || 0, depenses: depensesMap[jour] || 0, benefice: (ventesMap[jour] || 0) - (depensesMap[jour] || 0) }))
}

// ── Stats ──
export function getTotalVentes(depuis) {
  if (dbApi) return safeDb(() => dbApi.getTotalVentes(depuis), 0)
  return getAll('ventes').filter(v => new Date(v.dateVente) >= new Date(depuis)).length
}

export function getChiffreAffaires(depuis) {
  if (dbApi) return safeDb(() => dbApi.getChiffreAffaires(depuis), 0)
  return getAll('ventes').filter(v => new Date(v.dateVente) >= new Date(depuis)).reduce((s, v) => s + v.total, 0)
}

export function getTopProduits(limit = 5, depuis = null) {
  if (dbApi) return safeDb(() => dbApi.getTopProduits(limit), [])
  let ventes = getAll('ventes')
  if (depuis) ventes = ventes.filter(v => new Date(v.dateVente) >= new Date(depuis))
  const map = {}
  ventes.forEach(v => { if (!map[v.nomProduit]) map[v.nomProduit] = { nom: v.nomProduit, quantite: 0, total: 0 }; map[v.nomProduit].quantite += v.quantite; map[v.nomProduit].total += v.total })
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, limit)
}

export function getVentesParCaissier(depuis) {
  if (dbApi) return safeDb(() => dbApi.getVentesParCaissier(depuis), [])
  const ventes = getAll('ventes').filter(v => new Date(v.dateVente) >= new Date(depuis))
  const map = {}
  ventes.forEach(v => { const nom = v.caissier || 'Inconnu'; if (!map[nom]) map[nom] = { nom, ventes: 0, unites: 0, total: 0 }; map[nom].ventes++; map[nom].unites += v.quantite; map[nom].total += v.total })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

export function getRecettesParMode(depuis) {
  if (dbApi) return safeDb(() => dbApi.getRecettesParMode(depuis), [])
  const ventes = getAll('ventes').filter(v => new Date(v.dateVente) >= new Date(depuis))
  const map = {}
  ventes.forEach(v => { const mode = v.modePaiement || 'especes'; if (!map[mode]) map[mode] = { mode, total: 0 }; map[mode].total += v.total })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

export function getMarges() {
  if (dbApi) return safeDb(() => dbApi.getMarges(), [])
  return getAll('ventes').map(v => ({ ...v, marge: v.total - (v.coutAchat || 0) * v.quantite, margePct: v.total > 0 ? (((v.total - (v.coutAchat || 0) * v.quantite) / v.total) * 100).toFixed(1) : 0 }))
}

// ── Reçus ──
function generateReceiptNumber() {
  const now = new Date(); const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const receipts = getReceipts(); const todayCount = receipts.filter(r => r.numero.includes(date)).length + 1
  return `RC${date}-${String(todayCount).padStart(4, '0')}`
}

async function sha256Hex(str) {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(str))
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getReceipts() {
  if (dbApi) return safeDb(() => dbApi.getReceipts(), [])
  return getAll('receipts')
}

export function getReceiptByNumber(numero) {
  if (dbApi) return safeDb(() => dbApi.getReceiptByNumero(numero), null)
  return getReceipts().find(r => r.numero === numero) || null
}

export async function saveReceipt(receiptData) {
  if (dbApi) {
    try {
      const numero = receiptData.numero || generateReceiptNumber()
      const r = { ...receiptData, numero, date: receiptData.date || new Date().toISOString() }
      const result = await dbApi.createReceipt(r)
      if (result && result.__error) return null
      return result
    } catch (e) { console.error('saveReceipt error:', e); return null }
  }
  const receipts = getReceipts()
  const numero = receiptData.numero || generateReceiptNumber()
  const receipt = { id: nextId(receipts), numero, date: new Date().toISOString(), client: receiptData.client || null, telephone: receiptData.telephone || null, fidelity: receiptData.fidelity || null, ventes: receiptData.ventes || [], sousTotal: receiptData.sousTotal || 0, remise: receiptData.remise || 0, remiseType: receiptData.remiseType || 'montant', taxes: receiptData.taxes || 0, total: receiptData.total || 0, modePaiement: receiptData.modePaiement || 'Espèces', referencePaiement: receiptData.referencePaiement || null, caissier: receiptData.caissier || 'Inconnu', pied: receiptData.pied || {} }
  const payload = JSON.stringify({ numero: receipt.numero, date: receipt.date, total: receipt.total, ventes: receipt.ventes, client: receipt.client })
  receipt.hash = await sha256Hex(payload)
  receipts.push(receipt); setAll('receipts', receipts)
  addLog('Reçu généré', `${numero} — ${receipt.total.toLocaleString('fr-FR')} FCFA — ${receipt.client || 'Client anonyme'}`, receipt.id, receipt.caissier)
  return receipt
}

export async function verifyReceiptIntegrity(numero) {
  const receipt = getReceiptByNumber(numero)
  if (!receipt) return { valid: false, error: 'Reçu introuvable' }
  const payload = JSON.stringify({ numero: receipt.numero, date: receipt.date, total: receipt.total, ventes: receipt.ventes, client: receipt.client })
  const expectedHash = await sha256Hex(payload)
  const valid = expectedHash === receipt.hash
  addLog('Vérification reçu', `${numero} — ${valid ? 'Valide' : 'CORROMPU'}`, receipt.id, receipt.caissier)
  return { valid, receipt, expectedHash, storedHash: receipt.hash }
}

export function getReceiptsByClient(telephone) {
  if (dbApi) return safeDb(() => dbApi.getReceiptsByClient(telephone), [])
  return getReceipts().filter(r => r.telephone === telephone).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getReceiptStats(depuis) {
  if (dbApi) return safeDb(() => dbApi.getReceiptStats(depuis), { count: 0, totalCA: 0, totalRemises: 0 })
  const receipts = getReceipts().filter(r => new Date(r.date) >= new Date(depuis))
  return { count: receipts.length, totalCA: receipts.reduce((s, r) => s + r.total, 0), totalRemises: receipts.reduce((s, r) => s + (r.remise || 0), 0) }
}

export function exportReceipts() {
  const receipts = getReceipts()
  const csv = [
    ['Numéro', 'Date', 'Client', 'Total', 'Remise', 'Paiement', 'Caissier', 'Hash'].join(';'),
    ...receipts.map(r => [r.numero, r.date, `"${r.client || ''}"`, r.total, r.remise || 0, r.modePaiement, r.caissier, r.hash?.slice(0, 16) || ''].join(';'))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `recus_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ═══════════════════════════════════════════════════════
// OTP FUNCTIONS
// ═══════════════════════════════════════════════════════

export async function envoyerOTP(userId, channel) {
  if (!isElectron) return { success: false, error: 'OTP disponible uniquement sur l\'application desktop' }
  try {
    const result = await window.electronAPI.sendOTP(userId, channel)
    return result
  } catch (e) {
    console.error('envoyerOTP error:', e)
    return { success: false, error: 'Erreur d\'envoi' }
  }
}

export async function verifierOTP(userId, code) {
  if (!isElectron) return { valid: false, error: 'OTP disponible uniquement sur l\'application desktop' }
  try {
    const result = await window.electronAPI.verifyOTP(userId, code)
    return result
  } catch (e) {
    console.error('verifierOTP error:', e)
    return { valid: false, error: 'Erreur de vérification' }
  }
}

export async function getOTPChannel(userId) {
  if (!isElectron) return null
  try {
    return await window.electronAPI.getOTPChannel(userId)
  } catch { return null }
}

export async function configurerTwilio(config) {
  if (!isElectron) return { success: false, error: 'Desktop uniquement' }
  return await window.electronAPI.configureTwilio(config)
}

export async function testerTwilio(phone) {
  if (!isElectron) return { success: false, error: 'Desktop uniquement' }
  return await window.electronAPI.testTwilio(phone)
}

export async function configurerSMTP(config) {
  if (!isElectron) return { success: false, error: 'Desktop uniquement' }
  return await window.electronAPI.configureSMTP(config)
}

export async function testerSMTP(to) {
  if (!isElectron) return { success: false, error: 'Desktop uniquement' }
  return await window.electronAPI.testSMTP(to)
}

// ── Retours ──
export function getRetours() {
  if (dbApi) return safeDb(() => dbApi.getRetours?.() || [], [])
  return getAll('retours')
}

export function addRetour(venteId, quantite, motif, montant, caissier) {
  const items = getAll('retours')
  const ventes = getAll('ventes')
  const vente = ventes.find(v => v.id === venteId)
  if (!vente) return null

  const retour = {
    id: nextId(items),
    venteId,
    nomProduit: vente.nomProduit,
    quantite: Math.min(quantite, vente.quantite),
    motif: sanitize(motif || ''),
    montant: montant || (vente.prixUnitaire * quantite),
    caissier: sanitize(caissier || 'Inconnu'),
    dateRetour: new Date().toISOString(),
    statut: 'remboursé',
  }

  items.push(retour)
  setAll('retours', items)

  const products = getAll('products')
  const pIdx = products.findIndex(p => p.id === vente.produitId)
  if (pIdx !== -1) {
    products[pIdx].stockActuel += retour.quantite
    setAll('products', products)
  }

  addLog('Retour', `${vente.nomProduit} x${retour.quantite} — ${retour.montant?.toLocaleString('fr-FR')} FCFA`, retour.id, caissier)
  return retour
}

export function deleteRetour(id) {
  if (dbApi) { safeDb(() => dbApi.deleteRetour?.(id)); return }
  const r = getRetours().find(x => x.id === id)
  if (r) {
    const products = getAll('products')
    const ventes = getAll('ventes')
    const vente = ventes.find(v => v.id === r.venteId)
    const pIdx = products.findIndex(p => p.id === vente?.produitId)
    if (pIdx !== -1) {
      products[pIdx].stockActuel = Math.max(0, products[pIdx].stockActuel - r.quantite)
      setAll('products', products)
    }
  }
  setAll('retours', getRetours().filter(i => i.id !== id))
  addLog('Retour supprimé', `${r?.nomProduit || id}`, id)
}

// ── Commandes fournisseurs ──
export function getCommandes() {
  if (dbApi) return safeDb(() => dbApi.getCommandes?.() || [], [])
  return getAll('commandes')
}

export function addCommande(c) {
  const items = getAll('commandes')
  const cmd = {
    id: nextId(items),
    produitId: c.produitId || null,
    produitNom: sanitize(c.produitNom || ''),
    fournisseurId: c.fournisseurId || null,
    fournisseurNom: sanitize(c.fournisseurNom || ''),
    quantite: c.quantite || 0,
    prixUnitaire: c.prixUnitaire || 0,
    montantTotal: (c.quantite || 0) * (c.prixUnitaire || 0),
    statut: c.statut || 'en_attente',
    dateCommande: c.dateCommande || new Date().toISOString(),
    dateLivraison: c.dateLivraison || null,
    notes: sanitize(c.notes || ''),
  }
  items.push(cmd)
  setAll('commandes', items)
  addLog('Commande créée', `${cmd.produitNom} x${cmd.quantite} — ${cmd.montantTotal?.toLocaleString('fr-FR')} FCFA`, cmd.id)
  return cmd
}

export function updateCommande(c) {
  if (dbApi) { safeDb(() => dbApi.updateCommande?.(sanitizeObj(c))); return }
  const items = getAll('commandes')
  const idx = items.findIndex(i => i.id === c.id)
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...sanitizeObj(c) }
    setAll('commandes', items)
  }
  addLog('Commande modifiée', `${c.produitNom || ''}`, c.id)
}

export function deleteCommande(id) {
  if (dbApi) { safeDb(() => dbApi.deleteCommande?.(id)); return }
  setAll('commandes', getCommandes().filter(i => i.id !== id))
  addLog('Commande supprimée', `${id}`, id)
}

export function recevoirCommande(id) {
  const items = getAll('commandes')
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  const cmd = items[idx]
  items[idx] = { ...cmd, statut: 'reçue', dateLivraison: new Date().toISOString() }
  setAll('commandes', items)

  if (cmd.produitId) {
    const products = getAll('products')
    const pIdx = products.findIndex(p => p.id === cmd.produitId)
    if (pIdx !== -1) {
      const casiersAjoutes = Math.ceil(cmd.quantite / (products[pIdx].nbUnitesParCasier || 24))
      products[pIdx].stockActuel += cmd.quantite
      products[pIdx].nombreCasiers += casiersAjoutes
      setAll('products', products)
    }
  }

  addLog('Commande reçue', `${cmd.produitNom} x${cmd.quantite}`, cmd.id)
  return items[idx]
}
