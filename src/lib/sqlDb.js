import { SCHEMA_SQL } from './sqlSchema'

let db = null
let isReady = false
let readyPromise = null

const DB_NAME = 'gestocom'

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

async function runMigrations() {
  const statements = SCHEMA_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await db.execute(stmt)
    } catch (e) {
      console.warn('[SQL] Migration statement error:', e.message, stmt.slice(0, 80))
    }
  }
}

// ── Generic helpers ──

export async function sqlGetAll(table) {
  if (!isReady) return []
  try {
    const res = await db.query(`SELECT * FROM ${table}`)
    return res.values || []
  } catch { return [] }
}

export async function sqlGetById(table, id) {
  if (!isReady) return null
  try {
    const res = await db.query(`SELECT * FROM ${table} WHERE id = ?`, [id])
    return res.values?.[0] || null
  } catch { return null }
}

export async function sqlInsert(table, obj) {
  if (!isReady) return null
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

      for (const item of items) {
        const row = {}
        for (const [k, v] of Object.entries(item)) {
          const sqlKey = k.replace(/([A-Z])/g, '_$1').toLowerCase()
          if (typeof v === 'object' && v !== null) {
            row[sqlKey] = JSON.stringify(v)
          } else if (typeof v === 'boolean') {
            row[sqlKey] = v ? 1 : 0
          } else {
            row[sqlKey] = v
          }
        }
        await sqlInsert(sqlTable, row)
        migrated++
      }
    } catch (e) {
      console.warn(`[SQL migrate] ${lsKey}:`, e.message)
    }
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
    } catch (e) {
      console.warn(`[SQL migrate] setting ${lsKey}:`, e.message)
    }
  }

  if (migrated > 0) {
    await sqlSetSetting('_migrated_v1', true)
    console.log(`[SQL] Migration complete: ${migrated} records`)
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

      for (const item of items) {
        const row = {}
        for (const [k, v] of Object.entries(item)) {
          const sqlKey = k.replace(/([A-Z])/g, '_$1').toLowerCase()
          if (typeof v === 'object' && v !== null) {
            row[sqlKey] = JSON.stringify(v)
          } else if (typeof v === 'boolean') {
            row[sqlKey] = v ? 1 : 0
          } else {
            row[sqlKey] = v
          }
        }
        await sqlInsert(sqlTable, row)
        migrated++
      }
    } catch (e) {
      console.warn(`[SQL force migrate] ${lsKey}:`, e.message)
    }
  }

  for (const [lsKey, settingKey] of Object.entries(SETTINGS_MAP)) {
    try {
      const raw = localStorage.getItem(`gestocom_${lsKey}`)
      if (!raw) continue
      const val = JSON.parse(raw)
      await sqlSetSetting(settingKey, val)
      migrated++
    } catch (e) {
      console.warn(`[SQL force migrate] setting ${lsKey}:`, e.message)
    }
  }

  console.log(`[SQL] Force migration complete: ${migrated} records`)
  return migrated
}
