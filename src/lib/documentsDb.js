import { addLog } from './db'

const DB_PREFIX = 'gestocom_'
function getAll(name) {
  try { return JSON.parse(localStorage.getItem(DB_PREFIX + name) || '[]') } catch { return [] }
}
function setAll(name, data) {
  try { localStorage.setItem(DB_PREFIX + name, JSON.stringify(data)) } catch {}
}
function nextId(items) { return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1 }

export const KYC_TYPES = [
  { key: 'carte_identite', label: "Carte d'identité", icon: 'CreditCard', desc: 'CNI ou carte d\'identité' },
  { key: 'passeport', label: 'Passeport', icon: 'BookOpen', desc: 'Passeport en cours de validité' },
  { key: 'justificatif_domicile', label: 'Justificatif de domicile', icon: 'Home', desc: 'Facture ou attestation' },
  { key: 'permis_conduire', label: 'Permis de conduire', icon: 'Car', desc: 'Permis en cours de validité' },
]

export const KYB_TYPES = [
  { key: 'registre_commerce', label: 'Registre de commerce', icon: 'Building2', desc: 'Extrait K-bis ou registre' },
  { key: 'nif', label: 'NIF', icon: 'Hash', desc: 'Numéro d\'Identification Fiscale' },
  { key: 'attestation_fiscale', label: 'Attestation fiscale', icon: 'FileText', desc: 'Attestation de régularité fiscale' },
  { key: 'statuts_societe', label: 'Statuts de la société', icon: 'ScrollText', desc: 'Statuts constitutifs' },
  { key: 'certificat_ncc', label: 'Certificat NCC', icon: 'Award', desc: 'Numéro de Contrôle du Commerce' },
]

export const ALL_DOC_TYPES = [...KYC_TYPES, ...KYB_TYPES]
export function getTypeInfo(key) { return ALL_DOC_TYPES.find(t => t.key === key) || null }

export const STATUTS = {
  en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  approuve: { label: 'Approuvé', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejete: { label: 'Rejeté', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export function getDocuments() { return getAll('kyc_kyb_documents') }
export function getDocumentById(id) { return getDocuments().find(d => d.id === id) || null }

export function addDocument({ categorie, typeDocument, nomFichier, fileData, fileType, fileSize, thumbnailData, notes }) {
  const items = getDocuments()
  const now = new Date().toISOString()
  const doc = {
    id: nextId(items),
    categorie,
    typeDocument,
    typeDocumentLabel: getTypeInfo(typeDocument)?.label || typeDocument,
    nomFichier,
    fileData,
    thumbnailData: thumbnailData || null,
    fileType,
    fileSize,
    statut: 'en_attente',
    rejetMotif: null,
    dateCreation: now,
    dateModification: now,
    dateTraitement: null,
    notes: notes || '',
  }
  items.push(doc)
  setAll('kyc_kyb_documents', items)
  addLog('Document KYC/KYB ajouté', `${doc.typeDocumentLabel} (${categorie})`)
  return doc
}

export function updateDocument(id, changes) {
  const items = getDocuments()
  const idx = items.findIndex(d => d.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...changes, dateModification: new Date().toISOString() }
  setAll('kyc_kyb_documents', items)
  return items[idx]
}

export function deleteDocument(id) {
  const items = getDocuments()
  const doc = items.find(d => d.id === id)
  if (!doc) return false
  setAll('kyc_kyb_documents', items.filter(d => d.id !== id))
  addLog('Document KYC/KYB supprimé', `${doc.typeDocumentLabel} (${doc.categorie})`)
  return true
}

export function approveDocument(id) {
  return updateDocument(id, { statut: 'approuve', dateTraitement: new Date().toISOString(), rejetMotif: null })
}

export function rejectDocument(id, motif) {
  return updateDocument(id, { statut: 'rejete', dateTraitement: new Date().toISOString(), rejetMotif: motif || 'Non spécifié' })
}

export function searchDocuments(query) {
  if (!query) return getDocuments()
  const q = query.toLowerCase()
  return getDocuments().filter(d =>
    d.typeDocumentLabel.toLowerCase().includes(q) ||
    d.nomFichier.toLowerCase().includes(q) ||
    d.categorie.toLowerCase().includes(q) ||
    (d.notes && d.notes.toLowerCase().includes(q))
  )
}

export function getDocumentsStats() {
  const all = getDocuments()
  return {
    total: all.length,
    kyc: all.filter(d => d.categorie === 'kyc').length,
    kyb: all.filter(d => d.categorie === 'kyb').length,
    en_attente: all.filter(d => d.statut === 'en_attente').length,
    approuve: all.filter(d => d.statut === 'approuve').length,
    rejete: all.filter(d => d.statut === 'rejete').length,
  }
}
