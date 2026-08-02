import { SCHEMA_SQL } from './sqlSchema'

let db = null
let isReady = false
let readyPromise = null

const DB_NAME = 'gestocom'
const SCHEMA_VERSION = 1

// Tables with a real column schema (defined in sqlSchema.js).
// Any other table (modules, documents, logiciels, etc.) is stored
// generically as (id INTEGER PK, data TEXT) with the whole object in JSON.
const KNOWN_TABLES = new Set([
  'users', 'products', 'products_v2', 'ventes', 'depenses', 'fournisseurs',
  'commandes', 'retours', 'receipts', 'logs', 'settings', 'login_attempts',
  'stock_mouvements', 'stock_entrepots', 'stock_lots', 'stock_inventaires',
])

const _tableColumns = new Map() // table -> string[] | null

export function isGenericTable(table) {
  return !KNOWN_TABLES.has(table)
}

export function isSQLiteAvailable() {
  return db !== null && isReady
}

export function getDb() {
  return db
}

export async function initSQLite() {
  if (readyPromise) return readyPromise
  readyPromise = (async () => {
    try {
      const { Capacitor } = await import('@capacitor/core')
      const platform = Capacitor.getPlatform()
      if (platform === 'electron' || platform === 'web') {
        const { SQLite } = await import('@capacitor-community/sqlite')
        const { JeepSqlite } = await import('jeep-sqlite')
        customElements.define('jeep-sqlite', JeepSqlite)

        const jeepEl = document.createElement('jeep-sqlite')
        document.body.appendChild(jeepEl)
        await customElements.whenDefined('jeep-sqlite')

        await SQLite.initWebStore()

        const conn = await SQLite.createConnection({
          database: DB_NAME,
          version: 1,
          encrypted: false,
          mode: 'no-encryption',
        })
        db = conn
      } else {
        // Native iOS / Android
        const { SQLite } = await import('@capacitor-community/sqlite')
        const conn = await SQLite.createConnection({
          database: DB_NAME,
          version: 1,
          encrypted: false,
          mode: 'no-encryption',
        })
        db = conn
      }

      await db.open()
      await applyPragmas()
      await runMigrations()
      isReady = true
      return true
    } catch (e) {
      console.error('[SQL] initSQLite failed:', e)
      db = null
      isReady = false
      return false
    }
  })()
  return readyPromise
}

async function applyPragmas() {
  try { await db.run('PRAGMA foreign_keys = ON') } catch {}
  try { await db.run('PRAGMA journal_mode = WAL') } catch {}
}

async function getSchemaVersion() {
  try {
    const res = await db.query('PRAGMA user_version')
    const row = res.values?.[0]
    if (!row) return 0
    return Number(row.user_version ?? row.userVersion ?? 0) || 0
  } catch { return 0 }
}

async function runMigrations() {
  const version = await getSchemaVersion()
  if (version >= SCHEMA_VERSION) return
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await db.execute(stmt)
    } catch {}
  }
  try { await db.run(`PRAGMA user_version = ${SCHEMA_VERSION}`) } catch {}
}

// ── Table helpers ──

async function tableColumns(table) {
  if (_tableColumns.has(table)) return _tableColumns.get(table)
  let cols = []
  try {
    const res = await db.query(`PRAGMA table_info(${table})`)
    cols = (res.values || []).map(r => r.name)
  } catch {}
  _tableColumns.set(table, cols)
  return cols
}

async function ensureTable(table) {
  const cols = await tableColumns(table)
  if (cols && cols.length > 0) return cols
  await db.execute(`CREATE TABLE IF NOT EXISTS ${table} (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)`)
  _tableColumns.set(table, ['id', 'data'])
  return ['id', 'data']
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

// ── Generic helpers ──

export async function sqlGetAll(table) {
  if (!isReady) return []
  try {
    const cols = await ensureTable(table)
    const res = await db.query(`SELECT * FROM ${table}`)
    const rows = res.values || []
    if (isGenericTable(table)) {
      return rows.map(r => {
        try { return { ...JSON.parse(r.data), id: r.id } } catch { return r }
      })
    }
    return rows
  } catch { return [] }
}

export async function sqlGetById(table, id) {
  if (!isReady) return null
  try {
    const res = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id])
    const row = res.values?.[0]
    if (!row) return null
    if (isGenericTable(table)) {
      try { return { ...JSON.parse(row.data), id: row.id } } catch { return row }
    }
    return row
  } catch { return null }
}

// Atomically replace the whole table content with the given rows.
// Single transaction (BEGIN / DELETE / INSERT* / COMMIT) with ROLLBACK on error.
export async function sqlReplaceTable(table, rows) {
  if (!isReady) return false
  if (!Array.isArray(rows)) return false
  try {
    const cols = await ensureTable(table)
    const generic = isGenericTable(table)
    await db.run('BEGIN')
    try {
      await db.run(`DELETE FROM ${table}`)
      for (const item of rows) {
        if (item == null) continue
        if (generic) {
          const data = JSON.stringify(item)
          await db.run(`INSERT INTO ${table} (id, data) VALUES (?, ?)`, [item.id ?? null, data])
        } else {
          const row = jsToRow(item)
          const keys = Object.keys(row).filter(k => cols.includes(k))
          if (keys.length === 0) continue
          const placeholders = keys.map(() => '?').join(',')
          const vals = keys.map(k => row[k])
          await db.run(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`, vals)
        }
      }
      await db.run('COMMIT')
      return true
    } catch (e) {
      try { await db.run('ROLLBACK') } catch {}
      console.error(`[SQL] replace ${table}:`, e.message)
      return false
    }
  } catch (e) {
    console.error(`[SQL] replace ${table} (prepare):`, e.message)
    return false
  }
}

export async function sqlInsert(table, obj) {
  if (!isReady) return null
  try {
    await ensureTable(table)
  } catch { return null }
  if (isGenericTable(table)) {
    try {
      const res = await db.run(`INSERT INTO ${table} (id, data) VALUES (?, ?)`, [obj.id ?? null, JSON.stringify(obj)])
      return { ...obj, id: res.changes ? res.lastId : obj.id }
    } catch (e) {
      console.error(`[SQL] insert ${table}:`, e.message)
      return null
    }
  }
  const keys = Object.keys(obj)
  const placeholders = keys.map(() => '?').join(',')
  const vals = keys.map(k => {
    const v = obj[k]
    if (typeof v === 'object' && v !== null) return JSON.stringify(v)
    return v
  })
  try {
    const res = await db.run(
      `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
      vals
    )
    return { ...obj, id: res.changes ? res.lastId : obj.id }
  } catch (e) {
    console.error(`[SQL] insert ${table}:`, e.message)
    return null
  }
}

export async function sqlUpdate(table, id, obj) {
  if (!isReady) return
  try {
    await ensureTable(table)
  } catch { return }
  if (isGenericTable(table)) {
    try {
      await db.run(`UPDATE ${table} SET data = ? WHERE id = ?`, [JSON.stringify(obj), id])
    } catch (e) {
      console.error(`[SQL] update ${table}:`, e.message)
    }
    return
  }
  const keys = Object.keys(obj).filter(k => k !== 'id')
  const sets = keys.map(k => `${k} = ?`).join(', ')
  const vals = keys.map(k => {
    const v = obj[k]
    if (typeof v === 'object' && v !== null) return JSON.stringify(v)
    return v
  })
  try {
    await db.run(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...vals, id])
  } catch (e) {
    console.error(`[SQL] update ${table}:`, e.message)
  }
}

export async function sqlDelete(table, id) {
  if (!isReady) return
  try {
    await db.run(`DELETE FROM ${table} WHERE id = ?`, [id])
  } catch (e) {
    console.error(`[SQL] delete ${table}:`, e.message)
  }
}

export async function sqlRun(sql, params = []) {
  if (!isReady) return null
  try {
    return await db.run(sql, params)
  } catch (e) {
    console.error('[SQL] run error:', e.message)
    return null
  }
}

export async function sqlQuery(sql, params = []) {
  if (!isReady) return []
  try {
    const res = await db.query(sql, params)
    return res.values || []
  } catch (e) {
    console.error('[SQL] query error:', e.message)
    return []
  }
}

// ── Settings (key-value) ──

export async function sqlGetSetting(key) {
  const rows = await sqlQuery('SELECT value FROM settings WHERE key = ?', [key])
  if (rows.length === 0) return null
  try { return JSON.parse(rows[0].value) } catch { return rows[0].value }
}

export async function sqlSetSetting(key, value) {
  const v = typeof value === 'object' ? JSON.stringify(value) : String(value)
  await sqlRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, v])
}

// ── Migrate localStorage data to SQLite (one-time) ──

export async function migrateLocalStorage() {
  if (!isReady) return false
  const alreadyDone = await sqlGetSetting('_migrated_v1')
  if (alreadyDone) return false

  const TABLE_MAP = {
    users: 'users',
    products: 'products',
    products_v2: 'products_v2',
    ventes: 'ventes',
    depenses: 'depenses',
    fournisseurs: 'fournisseurs',
    commandes: 'commandes',
    retours: 'retours',
    receipts: 'receipts',
    logs: 'logs',
    stock_mouvements: 'stock_mouvements',
    stock_entrepots: 'stock_entrepots',
    stock_lots: 'stock_lots',
    stock_inventaires: 'stock_inventaires',
  }

  const SETTINGS_MAP = {
    company: 'company',
    stock_settings: 'stock_settings',
    ventes_settings: 'ventes_settings',
    clients_settings: 'clients_settings',
    rapports_settings: 'rapports_settings',
    login_attempts: 'login_attempts',
  }

  let migrated = 0

  // Migrate tables
  for (const [lsKey, sqlTable] of Object.entries(TABLE_MAP)) {
    try {
      const raw = localStorage.getItem(`gestocom_${lsKey}`)
      if (!raw) continue
      const items = JSON.parse(raw)
      if (!Array.isArray(items) || items.length === 0) continue

      const existing = await sqlGetAll(sqlTable)
      if (existing.length > 0) continue

      const done = await sqlReplaceTable(sqlTable, items)
      if (done) migrated += items.length
    } catch {}
  }

  // Migrate settings
  for (const [lsKey, settingKey] of Object.entries(SETTINGS_MAP)) {
    try {
      const raw = localStorage.getItem(`gestocom_${lsKey}`)
      if (!raw) continue
      const val = JSON.parse(raw)
      const existing = await sqlGetSetting(settingKey)
      if (existing !== null) continue
      await sqlSetSetting(settingKey, val)
      migrated++
    } catch {}
  }

  if (migrated > 0) {
    await sqlSetSetting('_migrated_v1', true)
  }

  return migrated
}

export async function forceMigrateFromLocalStorage() {
  if (!isReady) return 0

  const TABLE_MAP = {
    users: 'users',
    products: 'products',
    products_v2: 'products_v2',
    ventes: 'ventes',
    depenses: 'depenses',
    fournisseurs: 'fournisseurs',
    commandes: 'commandes',
    retours: 'retours',
    receipts: 'receipts',
    logs: 'logs',
    stock_mouvements: 'stock_mouvements',
    stock_entrepots: 'stock_entrepots',
    stock_lots: 'stock_lots',
    stock_inventaires: 'stock_inventaires',
  }

  const SETTINGS_MAP = {
    company: 'company',
    stock_settings: 'stock_settings',
    ventes_settings: 'ventes_settings',
    clients_settings: 'clients_settings',
    rapports_settings: 'rapports_settings',
    login_attempts: 'login_attempts',
  }

  let migrated = 0

  for (const [lsKey, sqlTable] of Object.entries(TABLE_MAP)) {
    try {
      const raw = localStorage.getItem(`gestocom_${lsKey}`)
      if (!raw) continue
      const items = JSON.parse(raw)
      if (!Array.isArray(items) || items.length === 0) continue

      const done = await sqlReplaceTable(sqlTable, items)
      if (done) migrated += items.length
    } catch {}
  }

  for (const [lsKey, settingKey] of Object.entries(SETTINGS_MAP)) {
    try {
      const raw = localStorage.getItem(`gestocom_${lsKey}`)
      if (!raw) continue
      const val = JSON.parse(raw)
      await sqlSetSetting(settingKey, val)
      migrated++
    } catch {}
  }

  return migrated
}
