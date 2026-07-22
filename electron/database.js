const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

let db = null

function getDbPath(app) {
  const dir = app.getPath('userData')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, 'gestocom.db')
}

function initDatabase(app) {
  const dbPath = getDbPath(app)
  db = new Database(dbPath, { intMode: 'number' })
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  try { createTables() } catch (e) { console.error('createTables failed:', e.message) }
  try { migrateSchema() } catch (e) { console.error('migrateSchema failed:', e.message) }
  try { createIndexes() } catch (e) { console.error('createIndexes failed:', e.message) }
  try { seedDefaults() } catch (e) { console.error('seedDefaults failed:', e.message) }
  return db
}

// ═══════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL UNIQUE,
      motDePasse TEXT NOT NULL,
      salt TEXT,
      role TEXT NOT NULL DEFAULT 'vendeur',
      email TEXT,
      telephone TEXT,
      isDefault INTEGER DEFAULT 0,
      dateCreation TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'bouteille',
      barcode TEXT UNIQUE,
      nombreCasiers INTEGER DEFAULT 0,
      prixCasier REAL DEFAULT 0,
      nbUnitesParCasier INTEGER DEFAULT 1,
      prixUnite REAL DEFAULT 0,
      stockInitial INTEGER DEFAULT 0,
      stockActuel INTEGER DEFAULT 0,
      seuilAlerte INTEGER DEFAULT 50,
      image TEXT DEFAULT '',
      dateCreation TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ventes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produitId INTEGER,
      nomProduit TEXT NOT NULL,
      typeProduit TEXT,
      quantite INTEGER NOT NULL,
      prixUnitaire REAL NOT NULL,
      coutAchat REAL DEFAULT 0,
      sousTotal REAL NOT NULL,
      remise REAL DEFAULT 0,
      total REAL NOT NULL,
      modePaiement TEXT DEFAULT 'especes',
      caissier TEXT,
      dateVente TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (produitId) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS depenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      libelle TEXT NOT NULL,
      montant REAL NOT NULL,
      categorie TEXT DEFAULT 'Autre',
      date TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fournisseurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      contact TEXT DEFAULT '',
      telephone TEXT DEFAULT '',
      adresse TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      telephone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      adresse TEXT DEFAULT '',
      fidelite INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      totalDepense REAL DEFAULT 0,
      nbAchats INTEGER DEFAULT 0,
      dateCreation TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL UNIQUE,
      date TEXT DEFAULT (datetime('now')),
      clientId INTEGER,
      client TEXT,
      telephone TEXT,
      fidelity TEXT,
      ventes TEXT DEFAULT '[]',
      sousTotal REAL DEFAULT 0,
      remise REAL DEFAULT 0,
      remiseType TEXT DEFAULT 'montant',
      taxes REAL DEFAULT 0,
      total REAL DEFAULT 0,
      modePaiement TEXT DEFAULT 'Espèces',
      referencePaiement TEXT,
      caissier TEXT,
      pied TEXT DEFAULT '{}',
      hash TEXT,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now')),
      action TEXT NOT NULL,
      detail TEXT DEFAULT '',
      userId INTEGER,
      userNom TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      code TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'sms',
      expiresAt TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      used INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

// ═══════════════════════════════════════════════════════
// SCHEMA MIGRATION — add missing columns to existing tables
// ═══════════════════════════════════════════════════════

function migrateSchema() {
  const migrations = [
    { table: 'receipts', column: 'clientId', definition: 'INTEGER' },
    { table: 'receipts', column: 'fidelity', definition: 'TEXT' },
    { table: 'users', column: 'email', definition: 'TEXT' },
    { table: 'users', column: 'telephone', definition: 'TEXT' },
    { table: 'users', column: 'isDefault', definition: 'INTEGER DEFAULT 0' },
    { table: 'users', column: 'admin_id', definition: 'INTEGER' },
    { table: 'products', column: 'stockInitial', definition: 'INTEGER DEFAULT 0' },
    { table: 'products', column: 'image', definition: "TEXT DEFAULT ''" },
  ]

  for (const m of migrations) {
    try {
      db.prepare(`ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.definition}`).run()
    } catch {}
  }
  // Sync stockInitial = stockActuel for existing products
  try {
    db.prepare("UPDATE products SET stockInitial = stockActuel WHERE stockInitial = 0 AND stockActuel != 0").run()
  } catch {}
}

// ═══════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════

function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)',
    'CREATE INDEX IF NOT EXISTS idx_products_type ON products(type)',
    'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stockActuel, seuilAlerte)',
    'CREATE INDEX IF NOT EXISTS idx_ventes_date ON ventes(dateVente)',
    'CREATE INDEX IF NOT EXISTS idx_ventes_produit ON ventes(produitId)',
    'CREATE INDEX IF NOT EXISTS idx_ventes_caissier ON ventes(caissier)',
    'CREATE INDEX IF NOT EXISTS idx_ventes_mode ON ventes(modePaiement)',
    'CREATE INDEX IF NOT EXISTS idx_ventes_date_produit ON ventes(dateVente, produitId)',
    'CREATE INDEX IF NOT EXISTS idx_depenses_date ON depenses(date)',
    'CREATE INDEX IF NOT EXISTS idx_depenses_categorie ON depenses(categorie)',
    'CREATE INDEX IF NOT EXISTS idx_receipts_numero ON receipts(numero)',
    'CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date)',
    'CREATE INDEX IF NOT EXISTS idx_receipts_client ON receipts(telephone)',
    'CREATE INDEX IF NOT EXISTS idx_receipts_clientId ON receipts(clientId)',
    'CREATE INDEX IF NOT EXISTS idx_clients_telephone ON clients(telephone)',
    'CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom)',
    'CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)',
    'CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action)',
    'CREATE INDEX IF NOT EXISTS idx_logs_userId ON logs(userId)',
  ]
  for (const sql of indexes) {
    try { db.prepare(sql).run() } catch {}
  }
}

// ═══════════════════════════════════════════════════════
// SEED DEFAULTS
// ═══════════════════════════════════════════════════════

function seedDefaults() {
  const userRow = db.prepare('SELECT COUNT(*) as c FROM users').get()
  const count = userRow ? userRow.c : 0
  if (count === 0) {
    const salt = generateSaltSync()
    const hash = pbkdf2HashSync('Admin123!', salt)
    try {
      db.prepare('INSERT INTO users (nom, motDePasse, salt, role, isDefault, admin_id) VALUES (?, ?, ?, ?, ?, ?)').run('Admin', hash, salt, 'admin', 1, 1)
    } catch {
      db.prepare('INSERT INTO users (nom, motDePasse, salt, role, admin_id) VALUES (?, ?, ?, ?, ?)').run('Admin', hash, salt, 'admin', 1)
    }
  }

  const settingsRow = db.prepare('SELECT COUNT(*) as c FROM settings').get()
  const settingsCount = settingsRow ? settingsRow.c : 0
  if (settingsCount === 0) {
    const defaults = {
      company: JSON.stringify({ nom: 'LES RETROUVAILLES CEZ LUICI', nomCommercial: 'GESTOCOM CI', adresse: '', telephone: '', email: '', logo: '', devise: 'FCFA', langue: 'fr' }),
      stock_settings: JSON.stringify({ seuilAlerteDefaut: 50, categories: ['Bouteille', 'Canette'], prefixeCodeBarres: 'GCI' }),
      ventes_settings: JSON.stringify({ modesPaiement: ['Espèces', 'Mobile Money', 'Carte Bancaire', 'Crédit'], remisesActivees: true, ticketsActivees: true, prefixeTicket: 'REC', messageRecu: 'Merci de votre confiance !', politiqueRetour: 'Échanges sous 7 jours avec reçu', tvaActivee: true, tvaTaux: 18, remiseMaxTaux: 50 }),
      clients_settings: JSON.stringify({ fideliteActivee: false, pointsParFCFA: 0.01, seuilVIP: 100000, segmentationActivee: false }),
      rapports_settings: JSON.stringify({ formatExport: 'pdf', autoBackup: false, periodiciteBackup: 'quotidienne' }),
    }
    const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
    for (const [k, v] of Object.entries(defaults)) insert.run(k, v)
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function generateSaltSync() {
  return crypto.randomBytes(16).toString('hex')
}

function pbkdf2HashSync(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')
}

function sanitize(str) {
  if (typeof str !== 'string') return str
  return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c])
}

function sanitizeObj(obj) {
  const clean = {}
  for (const [k, v] of Object.entries(obj)) clean[k] = typeof v === 'string' ? sanitize(v) : v
  return clean
}

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex')
}

function now() { return new Date().toISOString() }
function today() { return new Date().toISOString().slice(0, 10) }
function thisMonth() { return new Date().toISOString().slice(0, 7) }

// ═══════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════

function getSetting(key) {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
    return row ? JSON.parse(row.value) : null
  } catch { return null }
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value))
}

// ═══════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════

function getUsers() {
  return db.prepare('SELECT * FROM users').all()
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

function getUserByName(nom) {
  return db.prepare('SELECT * FROM users WHERE nom = ?').get(nom)
}

function isDefaultAdmin(userId) {
  const u = getUserById(userId)
  return !!(u && (u.isDefault || u.nom === 'Admin'))
}

function createUser(nom, motDePasse, role, email, telephone, adminId) {
  const salt = generateSaltSync()
  const hash = pbkdf2HashSync(motDePasse, salt)
  const info = db.prepare('INSERT INTO users (nom, motDePasse, salt, role, email, telephone, admin_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(nom, hash, salt, role || 'vendeur', email || null, telephone || null, adminId || null)
  const id = Number(info.lastInsertRowid)
  addLog('Utilisateur créé', `${nom} (${role})`, id, nom)
  return { id, nom, role: role || 'vendeur' }
}

function updateUserPassword(userId, newPw) {
  const salt = generateSaltSync()
  const hash = pbkdf2HashSync(newPw, salt)
  db.prepare('UPDATE users SET motDePasse = ?, salt = ? WHERE id = ?').run(hash, salt, userId)
  addLog('Mot de passe modifié', '', userId)
}

function updateUserRole(userId, role) {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId)
  addLog('Rôle modifié', `Nouveau rôle: ${role}`, userId)
}

function deleteUser(userId) {
  const u = getUserById(userId)
  if (u && (u.isDefault || u.nom === 'Admin')) return false
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  addLog('Utilisateur supprimé', `${u?.nom || userId}`, userId)
  return true
}

function verifyPassword(nom, motDePasse) {
  const u = getUserByName(nom)
  if (!u || !u.id) return null
  if (u.salt && u.motDePasse.length === 64) {
    const hash = pbkdf2HashSync(motDePasse, u.salt)
    if (hash !== u.motDePasse) return { failed: true, user: { id: u.id, nom: u.nom } }
    return { id: u.id, nom: u.nom, role: u.role, adminId: u.admin_id || (u.role === 'admin' ? u.id : null) }
  }
  return { failed: true, user: { id: u.id, nom: u.nom } }
}

// ═══════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════

function getProducts() {
  return db.prepare('SELECT * FROM products').all()
}

function getProductById(id) {
  return db.prepare('SELECT * FROM products WHERE id = ?').get(id)
}

function getProductByBarcode(barcode) {
  return db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode)
}

function createProduct(p) {
  const stockInit = p.stockInitial || p.stockActuel || 0
  const info = db.prepare('INSERT INTO products (nom, type, barcode, nombreCasiers, prixCasier, nbUnitesParCasier, prixUnite, stockInitial, stockActuel, seuilAlerte, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    p.nom, p.type || 'bouteille', p.barcode || null,
    p.nombreCasiers || 0, p.prixCasier || 0, p.nbUnitesParCasier || 1,
    p.prixUnite || 0, stockInit, stockInit, p.seuilAlerte || 50, p.image || ''
  )
  const id = Number(info.lastInsertRowid)
  if (!p.barcode) {
    const barcode = 'GCI' + String(id).padStart(6, '0')
    db.prepare('UPDATE products SET barcode = ? WHERE id = ?').run(barcode, id)
  }
  addLog('Produit ajouté', p.nom, id)
  return { id, ...p }
}

function updateProduct(p) {
  const old = getProductById(p.id)
  const stockInitial = p.stockInitial || 0
  const delta = old ? stockInitial - (old.stockInitial || 0) : 0
  const stockActuel = (old ? old.stockActuel : 0) + delta
  db.prepare('UPDATE products SET nom=?, type=?, barcode=?, nombreCasiers=?, prixCasier=?, nbUnitesParCasier=?, prixUnite=?, stockInitial=?, stockActuel=?, seuilAlerte=?, image=? WHERE id=?').run(
    p.nom, p.type, p.barcode, p.nombreCasiers, p.prixCasier, p.nbUnitesParCasier, p.prixUnite, stockInitial, stockActuel, p.seuilAlerte, p.image || '', p.id
  )
  addLog('Produit modifié', p.nom, p.id)
}

function deleteProduct(id) {
  const p = getProductById(id)
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
  addLog('Produit supprimé', p?.nom || String(id), id)
}

function approvisionner(id, nbCasiers) {
  const p = getProductById(id)
  if (!p) return
  const added = nbCasiers * p.nbUnitesParCasier
  db.prepare('UPDATE products SET stockActuel = stockActuel + ?, nombreCasiers = nombreCasiers + ? WHERE id = ?').run(added, nbCasiers, id)
  addLog('Approvisionnement', `${p.nom}: +${nbCasiers} casiers (+${added} u.)`, id)
}

function getProductsEnAlerte() {
  return db.prepare('SELECT * FROM products WHERE stockActuel <= seuilAlerte').all()
}

function getProductsCount() {
  return db.prepare('SELECT COUNT(*) as c FROM products').get().c
}

function getProductsByType(type) {
  return db.prepare('SELECT * FROM products WHERE type = ?').all(type)
}

function searchProducts(query) {
  return db.prepare('SELECT * FROM products WHERE nom LIKE ? OR barcode LIKE ?').all(`%${query}%`, `%${query}%`)
}

// ═══════════════════════════════════════════════════════
// VENTES
// ═══════════════════════════════════════════════════════

function getVentes() {
  return db.prepare('SELECT * FROM ventes').all()
}

function getVenteById(id) {
  return db.prepare('SELECT * FROM ventes WHERE id = ?').get(id)
}

function getVentesByDate(date) {
  return db.prepare("SELECT * FROM ventes WHERE substr(dateVente,1,10) = ?").all(date)
}

function getVentesByProduct(produitId) {
  return db.prepare('SELECT * FROM ventes WHERE produitId = ?').all(produitId)
}

function getVentesByCaissier(caissier, depuis) {
  if (depuis) return db.prepare('SELECT * FROM ventes WHERE caissier = ? AND dateVente >= ?').all(caissier, String(depuis))
  return db.prepare('SELECT * FROM ventes WHERE caissier = ?').all(caissier)
}

function createVente(v) {
  const info = db.prepare('INSERT INTO ventes (produitId, nomProduit, typeProduit, quantite, prixUnitaire, coutAchat, sousTotal, remise, total, modePaiement, caissier, dateVente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    v.produitId, v.nomProduit, v.typeProduit || null,
    v.quantite, v.prixUnitaire, v.coutAchat || 0,
    v.sousTotal, v.remise || 0, v.total,
    v.modePaiement || 'especes', v.caissier || 'Inconnu',
    v.dateVente || now()
  )
  addLog('Vente', `${v.nomProduit} x${v.quantite} = ${(v.total || 0).toLocaleString('fr-FR')} FCFA`, v.produitId, v.caissier)
  return { id: Number(info.lastInsertRowid), ...v }
}

function updateProductStock(produitId, quantite) {
  db.prepare('UPDATE products SET stockActuel = stockActuel - ? WHERE id = ?').run(quantite, produitId)
}

function deleteVente(id) {
  const v = getVenteById(id)
  db.prepare('DELETE FROM ventes WHERE id = ?').run(id)
  if (v) addLog('Vente supprimée', `${v.nomProduit} #${v.id}`, id)
}

function getVentesCount(depuis) {
  if (depuis) return db.prepare('SELECT COUNT(*) as c FROM ventes WHERE dateVente >= ?').get(String(depuis)).c
  return db.prepare('SELECT COUNT(*) as c FROM ventes').get().c
}

// ═══════════════════════════════════════════════════════
// DÉPENSES
// ═══════════════════════════════════════════════════════

function getDepenses() {
  return db.prepare('SELECT * FROM depenses').all()
}

function getDepenseById(id) {
  return db.prepare('SELECT * FROM depenses WHERE id = ?').get(id)
}

function getDepensesByDate(date) {
  return db.prepare("SELECT * FROM depenses WHERE substr(date,1,10) = ?").all(date)
}

function getDepensesByCategorie(categorie) {
  return db.prepare('SELECT * FROM depenses WHERE categorie = ?').all(categorie)
}

function createDepense(d) {
  const info = db.prepare('INSERT INTO depenses (libelle, montant, categorie, date) VALUES (?, ?, ?, ?)').run(
    d.libelle, d.montant, d.categorie || 'Autre', d.date || now()
  )
  const id = Number(info.lastInsertRowid)
  addLog('Dépense ajoutée', `${d.libelle} — ${d.montant?.toLocaleString('fr-FR')} FCFA`, id)
  return { id, ...d }
}

function updateDepense(d) {
  db.prepare('UPDATE depenses SET libelle=?, montant=?, categorie=?, date=? WHERE id=?').run(d.libelle, d.montant, d.categorie, d.date, d.id)
  addLog('Dépense modifiée', d.libelle, d.id)
}

function deleteDepense(id) {
  const d = getDepenseById(id)
  db.prepare('DELETE FROM depenses WHERE id = ?').run(id)
  if (d) addLog('Dépense supprimée', d.libelle, id)
}

function getDepensesTotal(depuis) {
  if (depuis) return db.prepare('SELECT COALESCE(SUM(montant),0) as total FROM depenses WHERE date >= ?').get(String(depuis)).total
  return db.prepare('SELECT COALESCE(SUM(montant),0) as total FROM depenses').get().total
}

function getDepensesByCategorieStats(depuis) {
  if (depuis) return db.prepare('SELECT categorie, COUNT(*) as count, SUM(montant) as total FROM depenses WHERE date >= ? GROUP BY categorie ORDER BY total DESC').all(String(depuis))
  return db.prepare('SELECT categorie, COUNT(*) as count, SUM(montant) as total FROM depenses GROUP BY categorie ORDER BY total DESC').all()
}

// ═══════════════════════════════════════════════════════
// FOURNISSEURS
// ═══════════════════════════════════════════════════════

function getFournisseurs() {
  return db.prepare('SELECT * FROM fournisseurs').all()
}

function getFournisseurById(id) {
  return db.prepare('SELECT * FROM fournisseurs WHERE id = ?').get(id)
}

function createFournisseur(f) {
  const info = db.prepare('INSERT INTO fournisseurs (nom, contact, telephone, adresse) VALUES (?, ?, ?, ?)').run(
    f.nom, f.contact || '', f.telephone || '', f.adresse || ''
  )
  const id = Number(info.lastInsertRowid)
  addLog('Fournisseur ajouté', f.nom, id)
  return { id, ...f }
}

function updateFournisseur(f) {
  db.prepare('UPDATE fournisseurs SET nom=?, contact=?, telephone=?, adresse=? WHERE id=?').run(f.nom, f.contact, f.telephone, f.adresse, f.id)
  addLog('Fournisseur modifié', f.nom, f.id)
}

function deleteFournisseur(id) {
  const f = getFournisseurById(id)
  db.prepare('DELETE FROM fournisseurs WHERE id = ?').run(id)
  if (f) addLog('Fournisseur supprimé', f.nom, id)
}

// ═══════════════════════════════════════════════════════
// CLIENTS
// ═══════════════════════════════════════════════════════

function getClients() {
  return db.prepare('SELECT * FROM clients').all()
}

function getClientById(id) {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id)
}

function getClientByTelephone(telephone) {
  return db.prepare('SELECT * FROM clients WHERE telephone = ?').get(telephone)
}

function createClient(c) {
  const existing = c.telephone ? getClientByTelephone(c.telephone) : null
  if (existing) return existing
  const info = db.prepare('INSERT INTO clients (nom, telephone, email, adresse) VALUES (?, ?, ?, ?)').run(
    c.nom, c.telephone || '', c.email || '', c.adresse || ''
  )
  const id = Number(info.lastInsertRowid)
  addLog('Client ajouté', c.nom, id)
  return { id, ...c, fidelite: 0, points: 0, totalDepense: 0, nbAchats: 0 }
}

function updateClient(c) {
  db.prepare('UPDATE clients SET nom=?, telephone=?, email=?, adresse=? WHERE id=?').run(c.nom, c.telephone, c.email, c.adresse, c.id)
  addLog('Client modifié', c.nom, c.id)
}

function updateClientStats(clientId, montantAchat) {
  db.prepare('UPDATE clients SET totalDepense = totalDepense + ?, nbAchats = nbAchats + 1, points = points + ? WHERE id = ?').run(montantAchat, Math.floor(montantAchat * 0.01), clientId)
}

function deleteClient(id) {
  const c = getClientById(id)
  db.prepare('DELETE FROM clients WHERE id = ?').run(id)
  if (c) addLog('Client supprimé', c.nom, id)
}

function getClientsCount() {
  return db.prepare('SELECT COUNT(*) as c FROM clients').get().c
}

function searchClients(query) {
  return db.prepare('SELECT * FROM clients WHERE nom LIKE ? OR telephone LIKE ?').all(`%${query}%`, `%${query}%`)
}

function getTopClients(limit) {
  return db.prepare('SELECT * FROM clients ORDER BY totalDepense DESC LIMIT ?').all(limit || 10)
}

// ═══════════════════════════════════════════════════════
// RECEIPTS
// ═══════════════════════════════════════════════════════

function getReceipts() {
  const rows = db.prepare('SELECT * FROM receipts ORDER BY date DESC').all()
  return rows.map(r => ({ ...r, ventes: JSON.parse(r.ventes || '[]'), pied: JSON.parse(r.pied || '{}') }))
}

function getReceiptById(id) {
  const r = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id)
  if (!r) return null
  return { ...r, ventes: JSON.parse(r.ventes || '[]'), pied: JSON.parse(r.pied || '{}') }
}

function getReceiptByNumero(numero) {
  const r = db.prepare('SELECT * FROM receipts WHERE numero = ?').get(numero)
  if (!r) return null
  return { ...r, ventes: JSON.parse(r.ventes || '[]'), pied: JSON.parse(r.pied || '{}') }
}

function getReceiptsByClient(telephone) {
  const rows = db.prepare('SELECT * FROM receipts WHERE telephone = ? ORDER BY date DESC').all(telephone)
  return rows.map(r => ({ ...r, ventes: JSON.parse(r.ventes || '[]'), pied: JSON.parse(r.pied || '{}') }))
}

function getReceiptsByClientId(clientId) {
  const rows = db.prepare('SELECT * FROM receipts WHERE clientId = ? ORDER BY date DESC').all(clientId)
  return rows.map(r => ({ ...r, ventes: JSON.parse(r.ventes || '[]'), pied: JSON.parse(r.pied || '{}') }))
}

function getReceiptsByDate(date) {
  const rows = db.prepare("SELECT * FROM receipts WHERE substr(date,1,10) = ? ORDER BY date DESC").all(date)
  return rows.map(r => ({ ...r, ventes: JSON.parse(r.ventes || '[]'), pied: JSON.parse(r.pied || '{}') }))
}

function getReceiptsByCaissier(caissier) {
  const rows = db.prepare('SELECT * FROM receipts WHERE caissier = ? ORDER BY date DESC').all(caissier)
  return rows.map(r => ({ ...r, ventes: JSON.parse(r.ventes || '[]'), pied: JSON.parse(r.pied || '{}') }))
}

function createReceipt(r) {
  const payload = JSON.stringify({ numero: r.numero, date: r.date, total: r.total, ventes: r.ventes, client: r.client })
  const hash = sha256Hex(payload)
  const info = db.prepare('INSERT INTO receipts (numero, date, clientId, client, telephone, fidelity, ventes, sousTotal, remise, remiseType, taxes, total, modePaiement, referencePaiement, caissier, pied, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    r.numero, r.date || now(), r.clientId || null, r.client || null, r.telephone || null,
    r.fidelity || null, JSON.stringify(r.ventes || []), r.sousTotal || 0,
    r.remise || 0, r.remiseType || 'montant', r.taxes || 0, r.total || 0,
    r.modePaiement || 'Espèces', r.referencePaiement || null, r.caissier || 'Inconnu',
    JSON.stringify(r.pied || {}), hash
  )
  const id = Number(info.lastInsertRowid)
  addLog('Reçu généré', `${r.numero} — ${r.total?.toLocaleString('fr-FR')} FCFA — ${r.client || 'Client anonyme'}`, id, r.caissier)
  return { id, ...r, hash }
}

function getReceiptStats(depuis) {
  if (depuis) return db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total),0) as totalCA, COALESCE(SUM(remise),0) as totalRemises FROM receipts WHERE date >= ?').get(String(depuis))
  return db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total),0) as totalCA, COALESCE(SUM(remise),0) as totalRemises FROM receipts').get()
}

function getReceiptsCount() {
  return db.prepare('SELECT COUNT(*) as c FROM receipts').get().c
}

function exportReceipts() {
  return getReceipts()
}

function verifyReceiptIntegrity(numero) {
  const r = getReceiptByNumero(numero)
  if (!r) return { valid: false, error: 'Reçu introuvable' }
  const payload = JSON.stringify({ numero: r.numero, date: r.date, total: r.total, ventes: r.ventes, client: r.client })
  const expectedHash = sha256Hex(payload)
  const valid = expectedHash === r.hash
  addLog('Vérification reçu', `${numero} — ${valid ? 'Valide' : 'CORROMPU'}`, r.id, r.caissier)
  return { valid, receipt: r, expectedHash, storedHash: r.hash }
}

// ═══════════════════════════════════════════════════════
// LOGS
// ═══════════════════════════════════════════════════════

function addLog(action, detail, userId, userNom) {
  try {
    db.prepare('INSERT INTO logs (action, detail, userId, userNom) VALUES (?, ?, ?, ?)').run(action, sanitize(detail || ''), userId || null, sanitize(userNom || ''))
    const count = db.prepare('SELECT COUNT(*) as c FROM logs').get().c
    if (count > 500) {
      db.prepare('DELETE FROM logs WHERE id IN (SELECT id FROM logs ORDER BY id ASC LIMIT ?)').run(count - 500)
    }
  } catch {}
}

function getLogs() {
  return db.prepare('SELECT * FROM logs ORDER BY id DESC').all()
}

function getLogsByAction(action) {
  return db.prepare('SELECT * FROM logs WHERE action = ? ORDER BY id DESC').all(action)
}

function getLogsByUser(userId) {
  return db.prepare('SELECT * FROM logs WHERE userId = ? ORDER BY id DESC').all(userId)
}

function getLogsByDate(date) {
  return db.prepare("SELECT * FROM logs WHERE substr(timestamp,1,10) = ? ORDER BY id DESC").all(date)
}

function getLogsCount() {
  return db.prepare('SELECT COUNT(*) as c FROM logs').get().c
}

function clearLogs() {
  db.prepare('DELETE FROM logs').run()
}

function exportLogs() {
  return getLogs()
}

// ═══════════════════════════════════════════════════════
// OTP CODES
// ═══════════════════════════════════════════════════════

function generateOTPCode(userId, channel) {
  var code = ''
  for (var i = 0; i < 6; i++) code += String(crypto.randomInt(0, 10))
  var expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  db.prepare('DELETE FROM otp_codes WHERE userId = ? AND used = 0').run(userId)
  db.prepare('INSERT INTO otp_codes (userId, code, channel, expiresAt) VALUES (?, ?, ?, ?)').run(userId, code, channel || 'sms', expiresAt)
  return code
}

function verifyOTPCode(userId, code) {
  var row = db.prepare('SELECT * FROM otp_codes WHERE userId = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1').get(userId, code)
  if (!row) return { valid: false, error: 'Code incorrect' }
  if (row.attempts >= 3) {
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(row.id)
    return { valid: false, error: 'Trop de tentatives' }
  }
  if (new Date(row.expiresAt) < new Date()) {
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(row.id)
    return { valid: false, error: 'Code expiré' }
  }
  db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id)
  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(row.id)
  return { valid: true }
}

function cleanupExpiredOTPs() {
  db.prepare('DELETE FROM otp_codes WHERE expiresAt < datetime("now")').run()
}

function getUserPhone(userId) {
  var u = getUserById(userId)
  return u ? u.telephone : null
}

function getUserEmail(userId) {
  var u = getUserById(userId)
  return u ? u.email : null
}

// ═══════════════════════════════════════════════════════
// LOGIN ATTEMPTS
// ═══════════════════════════════════════════════════════

function getLoginAttempts() {
  const row = db.prepare('SELECT value FROM login_attempts WHERE key = ?').get('attempts')
  if (!row) return { count: 0, lockedUntil: null }
  try {
    const data = JSON.parse(row.value)
    if (data.lockedUntil && Date.now() > data.lockedUntil) {
      db.prepare('DELETE FROM login_attempts WHERE key = ?').run('attempts')
      return { count: 0, lockedUntil: null }
    }
    return data
  } catch {
    db.prepare('DELETE FROM login_attempts WHERE key = ?').run('attempts')
    return { count: 0, lockedUntil: null }
  }
}

function setLoginAttempts(data) {
  db.prepare('INSERT OR REPLACE INTO login_attempts (key, value) VALUES (?, ?)').run('attempts', JSON.stringify(data))
}

function clearLoginAttempts() {
  db.prepare('DELETE FROM login_attempts WHERE key = ?').run('attempts')
}

function isLocked() {
  const data = getLoginAttempts()
  return !!(data.lockedUntil && Date.now() < data.lockedUntil)
}

function getLockRemaining() {
  const data = getLoginAttempts()
  if (!data.lockedUntil) return 0
  return Math.max(0, data.lockedUntil - Date.now())
}

// ═══════════════════════════════════════════════════════
// AGRÉGATIONS — VENTES
// ═══════════════════════════════════════════════════════

function getChiffreAffaires(depuis) {
  if (depuis) return db.prepare('SELECT COALESCE(SUM(total),0) as total FROM ventes WHERE dateVente >= ?').get(String(depuis)).total
  return db.prepare('SELECT COALESCE(SUM(total),0) as total FROM ventes').get().total
}

function getTotalVentes(depuis) {
  if (depuis) return db.prepare('SELECT COUNT(*) as c FROM ventes WHERE dateVente >= ?').get(String(depuis)).c
  return db.prepare('SELECT COUNT(*) as c FROM ventes').get().c
}

function getTopProduits(limit) {
  return db.prepare('SELECT nomProduit as nom, SUM(quantite) as quantite, SUM(total) as total FROM ventes GROUP BY nomProduit ORDER BY total DESC LIMIT ?').all(limit || 5)
}

function getVentesParCaissier(depuis) {
  if (depuis) return db.prepare('SELECT caissier as nom, COUNT(*) as ventes, SUM(quantite) as unites, SUM(total) as total FROM ventes WHERE dateVente >= ? GROUP BY caissier ORDER BY total DESC').all(String(depuis))
  return db.prepare('SELECT caissier as nom, COUNT(*) as ventes, SUM(quantite) as unites, SUM(total) as total FROM ventes GROUP BY caissier ORDER BY total DESC').all()
}

function getRecettesParMode(depuis) {
  if (depuis) return db.prepare('SELECT modePaiement as mode, SUM(total) as total FROM ventes WHERE dateVente >= ? GROUP BY modePaiement ORDER BY total DESC').all(String(depuis))
  return db.prepare('SELECT modePaiement as mode, SUM(total) as total FROM ventes GROUP BY modePaiement ORDER BY total DESC').all()
}

function getMarges() {
  return db.prepare('SELECT *, (total - coutAchat * quantite) as marge, CASE WHEN total > 0 THEN ROUND(((total - coutAchat * quantite) / total) * 100, 1) ELSE 0 END as margePct FROM ventes').all()
}

function getMargesByProduct(depuis) {
  const where = depuis ? 'WHERE v.dateVente >= ?' : ''
  const params = depuis ? [String(depuis)] : []
  return db.prepare(`SELECT v.nomProduit, SUM(v.quantite) as quantite, SUM(v.total) as ca, SUM(v.coutAchat * v.quantite) as couteTotal, SUM(v.total - v.coutAchat * v.quantite) as marge, CASE WHEN SUM(v.total) > 0 THEN ROUND(((SUM(v.total) - SUM(v.coutAchat * v.quantite)) / SUM(v.total)) * 100, 1) ELSE 0 END as margePct FROM ventes v ${where} GROUP BY v.nomProduit ORDER BY marge DESC`).all(...params)
}

// ═══════════════════════════════════════════════════════
// AGRÉGATIONS — BÉNÉFICES
// ═══════════════════════════════════════════════════════

function getBeneficeParJour(jours) {
  const depuis = new Date()
  depuis.setDate(depuis.getDate() - jours)
  const since = depuis.toISOString().slice(0, 10)

  const ventes = db.prepare("SELECT substr(dateVente,1,10) as jour, SUM(total) as total FROM ventes WHERE dateVente >= ? GROUP BY jour").all(since)
  const depenses = db.prepare("SELECT substr(date,1,10) as jour, SUM(montant) as total FROM depenses WHERE date >= ? GROUP BY jour").all(since)

  const map = {}
  ventes.forEach(v => { map[v.jour] = { jour: v.jour, ventes: v.total, depenses: 0, benefice: v.total } })
  depenses.forEach(d => {
    if (!map[d.jour]) map[d.jour] = { jour: d.jour, ventes: 0, depenses: 0, benefice: 0 }
    map[d.jour].depenses = d.total
    map[d.jour].benefice = map[d.jour].ventes - d.total
  })
  return Object.values(map).sort((a, b) => a.jour.localeCompare(b.jour))
}

function getBeneficeTotal(depuis) {
  const ventes = getChiffreAffaires(depuis)
  const depenses = getDepensesTotal(depuis)
  return { ventes, depenses, benefice: ventes - depenses, marge: ventes > 0 ? ((ventes - depenses) / ventes * 100).toFixed(1) : 0 }
}

// ═══════════════════════════════════════════════════════
// AGRÉGATIONS — STOCK
// ═══════════════════════════════════════════════════════

function getStockValue() {
  return db.prepare('SELECT SUM(stockActuel * prixUnite) as valeur FROM products').get().valeur || 0
}

function getStockByType() {
  return db.prepare('SELECT type, COUNT(*) as count, SUM(stockActuel) as stock, SUM(stockActuel * prixUnite) as valeur FROM products GROUP BY type').all()
}

function getStockMovements(produitId, jours) {
  const depuis = new Date()
  depuis.setDate(depuis.getDate() - jours)
  const since = depuis.toISOString()
  return db.prepare('SELECT dateVente, quantite, total FROM ventes WHERE produitId = ? AND dateVente >= ? ORDER BY dateVente').all(produitId, since)
}

// ═══════════════════════════════════════════════════════
// AGRÉGATIONS — DASHBOARD
// ═══════════════════════════════════════════════════════

function getDashboardStats() {
  const todayStr = today()
  const monthStr = thisMonth()
  const last30 = new Date(Date.now() - 30 * 86400000).toISOString()

  const todayCA = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM ventes WHERE substr(dateVente,1,10) = ?").get(todayStr).total
  const todayCount = db.prepare("SELECT COUNT(*) as c FROM ventes WHERE substr(dateVente,1,10) = ?").get(todayStr).c
  const monthCA = db.prepare("SELECT COALESCE(SUM(total),0) as total FROM ventes WHERE dateVente LIKE ?").get(monthStr + '%').total
  const monthCount = db.prepare("SELECT COUNT(*) as c FROM ventes WHERE dateVente LIKE ?").get(monthStr + '%').c
  const totalProducts = getProductsCount()
  const stockAlerts = getProductsEnAlerte().length
  const totalClients = getClientsCount()
  const totalReceipts = getReceiptsCount()
  const totalFournisseurs = db.prepare('SELECT COUNT(*) as c FROM fournisseurs').get().c

  return { todayCA, todayCount, monthCA, monthCount, totalProducts, stockAlerts, totalClients, totalReceipts, totalFournisseurs }
}

// ═══════════════════════════════════════════════════════
// BACKUP & UTILS
// ═══════════════════════════════════════════════════════

function backupDatabase(destPath) {
  if (!db) return false
  try {
    const backup = db.backup(destPath)
    backup.wait()
    addLog('Backup créé', destPath)
    return true
  } catch { return false }
}

function getDatabasePath(app) {
  return getDbPath(app)
}

function getDatabaseSize() {
  if (!db) return 0
  try {
    const page_count = db.pragma('page_count', { simple: true })
    const page_size = db.pragma('page_size', { simple: true })
    return page_count * page_size
  } catch { return 0 }
}

function runVacuum() {
  if (db) try { db.exec('VACUUM') } catch {}
}

function closeDatabase() {
  if (db) { try { db.close() } catch(e) {} ; db = null }
}

module.exports = {
  // Init
  initDatabase, closeDatabase, backupDatabase, getDatabasePath, getDatabaseSize, runVacuum,
  isAvailable: function() { return db !== null },

  // Settings
  getSetting, setSetting,

  // Users
  getUsers, getUserById, getUserByName, isDefaultAdmin,
  createUser, updateUserPassword, updateUserRole, deleteUser, verifyPassword,
  generateSaltSync, pbkdf2HashSync,

  // Products
  getProducts, getProductById, getProductByBarcode,
  createProduct, updateProduct, deleteProduct, approvisionner,
  getProductsEnAlerte, getProductsCount, getProductsByType, searchProducts,

  // Ventes
  getVentes, getVenteById, getVentesByDate, getVentesByProduct, getVentesByCaissier,
  createVente, updateProductStock, deleteVente, getVentesCount,

  // Dépenses
  getDepenses, getDepenseById, getDepensesByDate, getDepensesByCategorie,
  createDepense, updateDepense, deleteDepense,
  getDepensesTotal, getDepensesByCategorieStats,

  // Fournisseurs
  getFournisseurs, getFournisseurById,
  createFournisseur, updateFournisseur, deleteFournisseur,

  // Clients
  getClients, getClientById, getClientByTelephone,
  createClient, updateClient, updateClientStats, deleteClient,
  getClientsCount, searchClients, getTopClients,

  // Receipts
  getReceipts, getReceiptById, getReceiptByNumero,
  getReceiptsByClient, getReceiptsByClientId, getReceiptsByDate, getReceiptsByCaissier,
  createReceipt, getReceiptStats, getReceiptsCount, exportReceipts, verifyReceiptIntegrity,

  // Logs
  addLog, getLogs, getLogsByAction, getLogsByUser, getLogsByDate,
  getLogsCount, clearLogs, exportLogs,

  // Login attempts
  getLoginAttempts, setLoginAttempts, clearLoginAttempts, isLocked, getLockRemaining,

  // Aggregations — Ventes
  getChiffreAffaires, getTotalVentes, getTopProduits,
  getVentesParCaissier, getRecettesParMode, getMarges, getMargesByProduct,

  // Aggregations — Bénéfices
  getBeneficeParJour, getBeneficeTotal,

  // Aggregations — Stock
  getStockValue, getStockByType, getStockMovements,

  // Aggregations — Dashboard
  getDashboardStats,

  // OTP
  generateOTPCode, verifyOTPCode, cleanupExpiredOTPs, getUserPhone, getUserEmail,
}
