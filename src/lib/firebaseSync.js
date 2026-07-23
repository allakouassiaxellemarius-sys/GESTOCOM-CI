import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getDb } from './firebase'
import {
  getUsers, getProducts, getVentes, getDepenses,
  getFournisseurs, getCommandes, getRetours, getReceipts,
  getCompanySettings, getStockSettings, getVentesSettings,
  getClientsSettings, getRapportsSettings,
  getUsersForAdmin, getAll, setAll,
} from './db'
import { getProductsV2, getMouvements, getEntrepots, getLots } from './stockDb'
import { getDocuments } from './documentsDb'
import { getAllLogicielsData, restoreLogicielsData } from './logicielsDb'
import { getExercices, getEcritures, getJournaux, getRapprochements, getLettrages } from './financeDb'

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
    finance: {
      exercices: getExercices(),
      ecritures: getEcritures(),
      journaux: getJournaux(),
      rapprochements: getRapprochements(),
      lettrages: getLettrages(),
    },
    industrie: {
      matieres: getAll('ind_matieres'),
      productions: getAll('ind_productions'),
      lots: getAll('ind_lots'),
    },
    transport: {
      vehicules: getAll('tr_vehicules'),
      chauffeurs: getAll('tr_chauffeurs'),
      livraisons: getAll('tr_livraisons'),
    },
    sante: {
      medicaments: getAll('sante_medicaments'),
      patients: getAll('sante_patients'),
      ordonnances: getAll('sante_ordonnances'),
      facturations: getAll('sante_facturations'),
    },
    education: {
      eleves: getAll('edu_eleves'),
      inscriptions: getAll('edu_inscriptions'),
      notes: getAll('edu_notes'),
      emploi: getAll('edu_emploi'),
      enseignants: getAll('edu_enseignants'),
    },
    ong: getAll('ong'),
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

  // Finance
  if (d.finance) {
    setTable('comptes', d.finance.comptes || [])
    setTable('ecritures_comptables', d.finance.ecritures || [])
    setTable('journaux_comptes', d.finance.journaux || [])
    setTable('exercices_comptables', d.finance.exercices || [])
    setTable('rapprochements_bancaires', d.finance.rapprochements || [])
    setTable('lettrages', d.finance.lettrages || [])
  }

  // Industrie
  if (d.industrie) {
    setTable('ind_matieres', d.industrie.matieres || [])
    setTable('ind_productions', d.industrie.productions || [])
    setTable('ind_lots', d.industrie.lots || [])
  }

  // Transport
  if (d.transport) {
    setTable('tr_vehicules', d.transport.vehicules || [])
    setTable('tr_chauffeurs', d.transport.chauffeurs || [])
    setTable('tr_livraisons', d.transport.livraisons || [])
  }

  // Santé
  if (d.sante) {
    setTable('sante_medicaments', d.sante.medicaments || [])
    setTable('sante_patients', d.sante.patients || [])
    setTable('sante_ordonnances', d.sante.ordonnances || [])
    setTable('sante_facturations', d.sante.facturations || [])
  }

  // Éducation
  if (d.education) {
    setTable('edu_eleves', d.education.eleves || [])
    setTable('edu_inscriptions', d.education.inscriptions || [])
    setTable('edu_notes', d.education.notes || [])
    setTable('edu_emploi', d.education.emploi || [])
    setTable('edu_enseignants', d.education.enseignants || [])
  }

  // ONG
  if (d.ong) {
    setTable('ong', d.ong || [])
  }

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
