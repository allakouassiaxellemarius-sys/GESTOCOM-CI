import { addLog } from './db'

const DB_PREFIX = 'gestocom_'
function getAll(name) {
  try { return JSON.parse(localStorage.getItem(DB_PREFIX + name) || '[]') } catch { return [] }
}
function setAll(name, data) {
  try { localStorage.setItem(DB_PREFIX + name, JSON.stringify(data)) } catch {}
}
function nextId(items) { return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1 }
function sanitize(str) { if (typeof str !== 'string') return str; return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]) }

// ══════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════
export const CATEGORIES_LOGICIELS = [
  { key: 'gestion', nom: 'Gestion', icone: 'BarChart3', desc: 'Logiciels de gestion d\'entreprise', color: 'brand' },
  { key: 'erp', nom: 'ERP', icone: 'Layers', desc: 'Systèmes de planification', color: 'sky' },
  { key: 'crm', nom: 'CRM', icone: 'Users', desc: 'Gestion de la relation client', color: 'emerald' },
  { key: 'e_commerce', nom: 'E-Commerce', icone: 'ShoppingCart', desc: 'Plateformes de vente en ligne', color: 'amber' },
  { key: 'mobile', nom: 'Application Mobile', icone: 'Smartphone', desc: 'Apps iOS / Android', color: 'violet' },
  { key: 'web', nom: 'Application Web', icone: 'Globe', desc: 'Applications SaaS / Web', color: 'teal' },
  { key: 'outils', nom: 'Outils / Utilities', icone: 'Wrench', desc: 'Outils de développement et productivité', color: 'slate' },
  { key: 'ia', nom: 'Intelligence Artificielle', icone: 'Sparkles', desc: 'Solutions IA / ML', color: 'rose' },
]

export const STATUTS_LOGICIEL = {
  actif: { label: 'Actif', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  brouillon: { label: 'Brouillon', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  archive: { label: 'Archivé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
}

export const STATUTS_LICENCE = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  expiree: { label: 'Expirée', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  revoquee: { label: 'Révoquée', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

export const STATUTS_DEPLOIEMENT = {
  actif: { label: 'Actif', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  desinstalle: { label: 'Désinstallé', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
}

export function getCategoryInfo(key) { return CATEGORIES_LOGICIELS.find(c => c.key === key) || null }
export function generateCleLicence() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `GCI-${seg()}-${seg()}-${seg()}`
}

// ══════════════════════════════════════════════════════════════
// LOGICIELS CRUD
// ══════════════════════════════════════════════════════════════
export function getLogiciels() { return getAll('logiciels') }
export function getLogicielById(id) { return getLogiciels().find(l => l.id === id) || null }

export function addLogiciel({ nom, description, categorie, prix, devise, icone, couleur }) {
  const items = getLogiciels()
  const now = new Date().toISOString()
  const logiciel = {
    id: nextId(items),
    nom: sanitize(nom),
    slug: nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    description: sanitize(description || ''),
    categorie: categorie || 'gestion',
    prix: Number(prix) || 0,
    devise: devise || 'XOF',
    statut: 'brouillon',
    icone: icone || '📦',
    couleur: couleur || 'brand',
    date_creation: now,
    date_modification: now,
  }
  items.push(logiciel)
  setAll('logiciels', items)
  addLog('Logiciel ajouté', logiciel.nom)
  return logiciel
}

export function updateLogiciel(id, changes) {
  const items = getLogiciels()
  const idx = items.findIndex(l => l.id === id)
  if (idx === -1) return null
  if (changes.nom) changes.slug = changes.nom.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  items[idx] = { ...items[idx], ...changes, date_modification: new Date().toISOString() }
  setAll('logiciels', items)
  return items[idx]
}

export function deleteLogiciel(id) {
  const items = getLogiciels()
  const logiciel = items.find(l => l.id === id)
  if (!logiciel) return false
  setAll('logiciels', items.filter(l => l.id !== id))
  // Supprimer versions, licences et déploiements liés
  setAll('logiciels_versions', getAll('logiciels_versions').filter(v => v.logiciel_id !== id))
  setAll('logiciels_licences', getAll('logiciels_licences').filter(l => l.logiciel_id !== id))
  setAll('logiciels_deploiements', getAll('logiciels_deploiements').filter(d => d.logiciel_id !== id))
  addLog('Logiciel supprimé', logiciel.nom)
  return true
}

export function duplicateLogiciel(id) {
  const src = getLogicielById(id)
  if (!src) return null
  return addLogiciel({ nom: `${src.nom} (copie)`, description: src.description, categorie: src.categorie, prix: src.prix, devise: src.devise, icone: src.icone, couleur: src.couleur })
}

export function searchLogiciels(query) {
  if (!query) return getLogiciels()
  const q = query.toLowerCase()
  return getLogiciels().filter(l => l.nom.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.categorie.toLowerCase().includes(q))
}

// ══════════════════════════════════════════════════════════════
// VERSIONS CRUD
// ══════════════════════════════════════════════════════════════
export function getVersions(logicielId) {
  const all = getAll('logiciels_versions')
  return logicielId ? all.filter(v => v.logiciel_id === logicielId) : all
}
export function getAllVersions() { return getAll('logiciels_versions') }
export function getVersionById(id) { return getAll('logiciels_versions').find(v => v.id === id) || null }

export function addVersion({ logicielId, numero, changelog, url_telechargement, taille, est_stable }) {
  const items = getAll('logiciels_versions')
  const version = {
    id: nextId(items),
    logiciel_id: logicielId,
    numero: sanitize(numero),
    changelog: sanitize(changelog || ''),
    url_telechargement: sanitize(url_telechargement || ''),
    taille: sanitize(taille || ''),
    est_stable: est_stable !== false,
    date_release: new Date().toISOString(),
    date_creation: new Date().toISOString(),
  }
  items.push(version)
  setAll('logiciels_versions', items)
  addLog('Version ajoutée', `${numero} pour logiciel #${logicielId}`)
  return version
}

export function updateVersion(id, changes) {
  const items = getAll('logiciels_versions')
  const idx = items.findIndex(v => v.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...changes }
  setAll('logiciels_versions', items)
  return items[idx]
}

export function deleteVersion(id) {
  const items = getAll('logiciels_versions')
  const version = items.find(v => v.id === id)
  if (!version) return false
  setAll('logiciels_versions', items.filter(v => v.id !== id))
  addLog('Version supprimée', version.numero)
  return true
}

// ══════════════════════════════════════════════════════════════
// LICENCES CRUD
// ══════════════════════════════════════════════════════════════
export function getLicences(logicielId) {
  const all = getAll('logiciels_licences')
  return logicielId ? all.filter(l => l.logiciel_id === logicielId) : all
}
export function getAllLicences() { return getAll('logiciels_licences') }
export function getLicenceById(id) { return getAll('logiciels_licences').find(l => l.id === id) || null }

export function addLicence({ logicielId, cle, clientNom, clientEmail, date_activation, date_expiration, max_installations, notes }) {
  const items = getAll('logiciels_licences')
  const licence = {
    id: nextId(items),
    logiciel_id: logicielId,
    cle: cle || generateCleLicence(),
    client_nom: sanitize(clientNom || ''),
    client_email: sanitize(clientEmail || ''),
    date_activation: date_activation || new Date().toISOString(),
    date_expiration: date_expiration || null,
    statut: 'active',
    max_installations: Number(max_installations) || 1,
    notes: sanitize(notes || ''),
    date_creation: new Date().toISOString(),
  }
  items.push(licence)
  setAll('logiciels_licences', items)
  addLog('Licence créée', `${licence.cle} pour ${licence.client_nom}`)
  return licence
}

export function updateLicence(id, changes) {
  const items = getAll('logiciels_licences')
  const idx = items.findIndex(l => l.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...changes }
  setAll('logiciels_licences', items)
  return items[idx]
}

export function deleteLicence(id) {
  const items = getAll('logiciels_licences')
  const licence = items.find(l => l.id === id)
  if (!licence) return false
  setAll('logiciels_licences', items.filter(l => l.id !== id))
  setAll('logiciels_deploiements', getAll('logiciels_deploiements').filter(d => d.licence_id !== id))
  addLog('Licence supprimée', licence.cle)
  return true
}

export function revokeLicence(id) { return updateLicence(id, { statut: 'revoquee' }) }

export function searchLicences(query) {
  if (!query) return getAllLicences()
  const q = query.toLowerCase()
  return getAllLicences().filter(l => l.cle.toLowerCase().includes(q) || l.client_nom.toLowerCase().includes(q) || (l.client_email && l.client_email.toLowerCase().includes(q)))
}

// ══════════════════════════════════════════════════════════════
// DÉPLOIEMENTS CRUD
// ══════════════════════════════════════════════════════════════
export function getDeploiements(logicielId) {
  const all = getAll('logiciels_deploiements')
  return logicielId ? all.filter(d => d.logiciel_id === logicielId) : all
}
export function getAllDeploiements() { return getAll('logiciels_deploiements') }

export function addDeploiement({ licenceId, logicielId, versionId, machine_info, ip }) {
  const items = getAll('logiciels_deploiements')
  const dep = {
    id: nextId(items),
    licence_id: licenceId,
    logiciel_id: logicielId,
    version_id: versionId,
    machine_info: sanitize(machine_info || ''),
    ip: sanitize(ip || ''),
    date_installation: new Date().toISOString(),
    statut: 'actif',
  }
  items.push(dep)
  setAll('logiciels_deploiements', items)
  addLog('Déploiement enregistré', `#${dep.id}`)
  return dep
}

export function updateDeploiement(id, changes) {
  const items = getAll('logiciels_deploiements')
  const idx = items.findIndex(d => d.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...changes }
  setAll('logiciels_deploiements', items)
  return items[idx]
}

export function deleteDeploiement(id) {
  const items = getAll('logiciels_deploiements')
  if (!items.find(d => d.id === id)) return false
  setAll('logiciels_deploiements', items.filter(d => d.id !== id))
  addLog('Déploiement supprimé', `#${id}`)
  return true
}

// ══════════════════════════════════════════════════════════════
// CATÉGORIES CRUD
// ══════════════════════════════════════════════════════════════
export function getCategories() {
  const stored = getAll('logiciels_categories')
  return stored.length > 0 ? stored : CATEGORIES_LOGICIELS.map(c => ({ ...c, id: c.key }))
}

export function addCategory({ nom, desc, icone, color }) {
  const items = getAll('logiciels_categories')
  const cat = { id: nom.toLowerCase().replace(/[^a-z0-9]+/g, '_'), nom: sanitize(nom), desc: sanitize(desc || ''), icone: icone || 'FolderOpen', color: color || 'brand' }
  items.push(cat)
  setAll('logiciels_categories', items)
  return cat
}

export function updateCategory(id, changes) {
  const items = getAll('logiciels_categories')
  const idx = items.findIndex(c => c.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...changes }
  setAll('logiciels_categories', items)
  return items[idx]
}

export function deleteCategory(id) {
  const items = getAll('logiciels_categories')
  if (!items.find(c => c.id === id)) return false
  setAll('logiciels_categories', items.filter(c => c.id !== id))
  return true
}

// ══════════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════════
export function getLogicielsStats() {
  const logiciels = getLogiciels()
  const licences = getAllLicences()
  const versions = getAllVersions()
  const deploiements = getAllDeploiements()
  return {
    totalLogiciels: logiciels.length,
    actifs: logiciels.filter(l => l.statut === 'actif').length,
    brouillons: logiciels.filter(l => l.statut === 'brouillon').length,
    archives: logiciels.filter(l => l.statut === 'archive').length,
    totalVersions: versions.length,
    totalLicences: licences.length,
    licencesActives: licences.filter(l => l.statut === 'active').length,
    licencesExpirees: licences.filter(l => l.statut === 'expiree').length,
    licencesRevoquees: licences.filter(l => l.statut === 'revoquee').length,
    totalDeploiements: deploiements.length,
    deploiementsActifs: deploiements.filter(d => d.statut === 'actif').length,
  }
}

// ══════════════════════════════════════════════════════════════
// EXPORT / IMPORT (cloudSync)
// ══════════════════════════════════════════════════════════════
export function getAllLogicielsData() {
  return {
    logiciels: getLogiciels(),
    logicielsVersions: getAllVersions(),
    logicielsLicences: getAllLicences(),
    logicielsDeploiements: getAllDeploiements(),
    logicielsCategories: getCategories(),
  }
}

export function restoreLogicielsData(d) {
  if (d.logiciels) setAll('logiciels', d.logiciels)
  if (d.logicielsVersions) setAll('logiciels_versions', d.logicielsVersions)
  if (d.logicielsLicences) setAll('logiciels_licences', d.logicielsLicences)
  if (d.logicielsDeploiements) setAll('logiciels_deploiements', d.logicielsDeploiements)
  if (d.logicielsCategories) setAll('logiciels_categories', d.logicielsCategories)
}
