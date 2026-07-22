import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getDb } from './firebase'
import {
  getUsers, getProducts, getVentes, getDepenses,
  getFournisseurs, getCommandes, getRetours, getReceipts,
  getCompanySettings, getStockSettings, getVentesSettings,
  getClientsSettings, getRapportsSettings,
  getUsersForAdmin,
} from './db'
import { getProductsV2, getMouvements, getEntrepots, getLots } from './stockDb'
import { getDocuments } from './documentsDb'
import { getAllLogicielsData, restoreLogicielsData } from './logicielsDb'

export function collectAllData(adminId) {
  return {
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
    kycKybDocuments: getDocuments(),
    ...getAllLogicielsData(),
    settings: {
      company: getCompanySettings(),
      stock: getStockSettings(),
      ventes: getVentesSettings(),
      clients: getClientsSettings(),
      rapports: getRapportsSettings(),
    },
  }
}

export async function pushToFirestore(email, adminId) {
  const db = getDb()
  if (!db) throw new Error('Firebase non configuré')

  const data = collectAllData(adminId)
  const ref = doc(db, 'gestocom_accounts', email.toLowerCase().trim())
  await setDoc(ref, {
    email: email.toLowerCase().trim(),
    adminId,
    data,
    syncedAt: new Date().toISOString(),
    version: '1.5.1',
  })
}

export async function pullFromFirestore(email) {
  const db = getDb()
  if (!db) throw new Error('Firebase non configuré')

  const ref = doc(db, 'gestocom_accounts', email.toLowerCase().trim())
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data()
}

export function restoreDataFromCloud(cloudData) {
  const DB_PREFIX = 'gestocom_'
  const adminId = cloudData.adminId

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

  const existingUsers = JSON.parse(localStorage.getItem(DB_PREFIX + 'users') || '[]')
  const existingIds = new Set(existingUsers.map(u => u.id))
  const newUsers = (cloudData.data.users || []).filter(u => !existingIds.has(u.id))
  setTable('users', [...existingUsers, ...newUsers])

  const d = cloudData.data
  setTable('products', d.products || [])
  setTable('products_v2', d.productsV2 || [])
  setTable('ventes', d.ventes || [])
  setTable('depenses', d.depenses || [])
  setTable('fournisseurs', d.fournisseurs || [])
  setTable('commandes', d.commandes || [])
  setTable('retours', d.retours || [])
  setTable('receipts', d.receipts || [])
  setTable('stock_mouvements', d.stockMouvements || [])
  setTable('stock_entrepots', d.stockEntrepots || [])
  setTable('stock_lots', d.stockLots || [])
  setTable('kyc_kyb_documents', d.kycKybDocuments || [])
  restoreLogicielsData(d)

  if (d.settings) {
    if (d.settings.company) setSetting('company', d.settings.company)
    if (d.settings.stock) setSetting('stock_settings', d.settings.stock)
    if (d.settings.ventes) setSetting('ventes_settings', d.settings.ventes)
    if (d.settings.clients) setSetting('clients_settings', d.settings.clients)
    if (d.settings.rapports) setSetting('rapports_settings', d.settings.rapports)
  }

  return {
    adminId,
    userCount: (cloudData.data.users || []).length,
    productCount: (d.productsV2 || d.products || []).length,
    venteCount: (d.ventes || []).length,
  }
}
