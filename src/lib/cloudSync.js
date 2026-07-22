import {
  getUsers, getProducts, getVentes, getDepenses,
  getFournisseurs, getCommandes, getRetours, getReceipts,
  getCompanySettings, getStockSettings, getVentesSettings,
  getClientsSettings, getRapportsSettings,
  getUsersForAdmin,
} from './db'
import { getProductsV2, getMouvements, getEntrepots, getLots } from './stockDb'

const EXPORT_VERSION = '1.4.0'
const EXPORT_MAGIC = 'GESTOCOM_SYNC'

export function exportAccountData(adminId) {
  const data = {
    magic: EXPORT_MAGIC,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    adminId,
    users: getUsersForAdmin(adminId),
    products: getProducts(),
    productsV2: getProductsV2(),
    ventes: getVentes(),
    depenses: getDepenses(),
    fournisseurs: getFournisseurs(),
    commandes: getCommandes(),
    retours: getRetours(),
    receipts: getReceipts(),
    stockMouvements: getMouvements(),
    stockEntrepots: getEntrepots(),
    stockLots: getLots(),
    settings: {
      company: getCompanySettings(),
      stock: getStockSettings(),
      ventes: getVentesSettings(),
      clients: getClientsSettings(),
      rapports: getRapportsSettings(),
    },
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gestocom_backup_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  return true
}

export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (data.magic !== EXPORT_MAGIC) {
          reject(new Error('Fichier invalide : ce n\'est pas un fichier GESTOCOM'))
          return
        }
        if (!data.adminId || !data.users?.length) {
          reject(new Error('Fichier invalide : données manquantes'))
          return
        }
        resolve(data)
      } catch {
        reject(new Error('Fichier invalide : format JSON incorrect'))
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsText(file)
  })
}

export function importAccountData(data) {
  const DB_PREFIX = 'gestocom_'
  const adminId = data.adminId

  function getKey(name) {
    if (name === 'users') return DB_PREFIX + name
    if (name === 'login_attempts') return DB_PREFIX + name
    if (adminId) return DB_PREFIX + 'admin_' + adminId + '_' + name
    return DB_PREFIX + name
  }

  function setTable(name, items) {
    try { localStorage.setItem(getKey(name), JSON.stringify(items || [])) } catch {}
  }

  function setSetting(key, value) {
    try { localStorage.setItem(getKey(key), JSON.stringify(value)) } catch {}
  }

  // Merge users (don't overwrite existing users on this device)
  const existingUsers = JSON.parse(localStorage.getItem(DB_PREFIX + 'users') || '[]')
  const existingIds = new Set(existingUsers.map(u => u.id))
  const newUsers = (data.users || []).filter(u => !existingIds.has(u.id))
  const mergedUsers = [...existingUsers, ...newUsers]
  setTable('users', mergedUsers)

  // Import data tables
  setTable('products', data.products || [])
  setTable('products_v2', data.productsV2 || [])
  setTable('ventes', data.ventes || [])
  setTable('depenses', data.depenses || [])
  setTable('fournisseurs', data.fournisseurs || [])
  setTable('commandes', data.commandes || [])
  setTable('retours', data.retours || [])
  setTable('receipts', data.receipts || [])
  setTable('stock_mouvements', data.stockMouvements || [])
  setTable('stock_entrepots', data.stockEntrepots || [])
  setTable('stock_lots', data.stockLots || [])

  // Import settings
  if (data.settings) {
    if (data.settings.company) setSetting('company', data.settings.company)
    if (data.settings.stock) setSetting('stock_settings', data.settings.stock)
    if (data.settings.ventes) setSetting('ventes_settings', data.settings.ventes)
    if (data.settings.clients) setSetting('clients_settings', data.settings.clients)
    if (data.settings.rapports) setSetting('rapports_settings', data.settings.rapports)
  }

  return {
    adminId,
    userCount: data.users?.length || 0,
    productCount: (data.productsV2 || data.products || []).length,
    venteCount: (data.ventes || []).length,
  }
}

export async function syncToCloud(adminId, email) {
  const data = {
    adminId,
    email,
    users: getUsersForAdmin(adminId),
    products: getProducts(),
    productsV2: getProductsV2(),
    ventes: getVentes(),
    depenses: getDepenses(),
    fournisseurs: getFournisseurs(),
    commandes: getCommandes(),
    retours: getRetours(),
    receipts: getReceipts(),
    settings: {
      company: getCompanySettings(),
      stock: getStockSettings(),
      ventes: getVentesSettings(),
      clients: getClientsSettings(),
      rapports: getRapportsSettings(),
    },
    syncedAt: new Date().toISOString(),
  }

  const resp = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!resp.ok) throw new Error('Erreur de synchronisation')
  return await resp.json()
}

export async function pullFromCloud(email, password) {
  const resp = await fetch(`/api/sync?email=${encodeURIComponent(email)}`, {
    headers: { 'Authorization': `Basic ${btoa(`${email}:${password}`)}` },
  })
  if (resp.status === 404) return null
  if (!resp.ok) throw new Error('Erreur de synchronisation')
  return await resp.json()
}
