import { addLog, getAll, setAll, nextId } from './db'

function sanitize(str) {
  if (typeof str !== 'string') return str
  return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c])
}
function sanitizeObj(obj) {
  const clean = {}
  for (const [k, v] of Object.entries(obj)) clean[k] = typeof v === 'string' ? sanitize(v) : v
  return clean
}

const FINANCE_KEYS = {
  comptes: 'comptes',
  ecritures: 'ecritures_comptables',
  journaux: 'journaux_comptes',
  exercices: 'exercices_comptables',
  rapprochements: 'rapprochements_bancaires',
  creances: 'creances_dettes',
  lettrages: 'lettrages',
}

function safeDb(fn, fallback) {
  try { return fn() } catch { return fallback }
}

function getFinanceData(key) { return getAll(FINANCE_KEYS[key] || key) }
function setFinanceData(key, data) { setAll(FINANCE_KEYS[key] || key, data) }

// ── Exercices Comptables ──
export function getExercices() { return getFinanceData('exercices') }

export function createExercice(ex) {
  const items = getFinanceData('exercices')
  const exercice = {
    id: nextId(items),
    libelle: sanitize(ex.libelle || ''),
    dateDebut: ex.dateDebut || new Date().toISOString().slice(0, 10),
    dateFin: ex.dateFin || new Date().toISOString().slice(0, 10),
    statut: ex.statut || 'ouvert',
    dateCreation: new Date().toISOString(),
  }
  items.push(exercice)
  setFinanceData('exercices', items)
  addLog('Exercice créé', exercice.libelle, exercice.id)
  return exercice
}

export function closeExercice(id) {
  const items = getFinanceData('exercices')
  const idx = items.findIndex(e => e.id === id)
  if (idx !== -1) {
    items[idx].statut = 'clôturé'
    items[idx].dateCloture = new Date().toISOString()
    setFinanceData('exercices', items)
    addLog('Exercice clôturé', items[idx].libelle, id)
  }
}

export function getExerciceActif() {
  return getFinanceData('exercices').find(e => e.statut === 'ouvert') || null
}

// ── Écritures Comptables ──
export function getEcritures() { return getFinanceData('ecritures') }

export function getEcrituresByExercice(exerciceId) {
  return getFinanceData('ecritures').filter(e => e.exerciceId === exerciceId)
}

export function addEcriture(ec) {
  const items = getFinanceData('ecritures')
  const exercice = getExerciceActif()
  const ecriture = {
    id: nextId(items),
    numero: ec.numero || generateEcritureNumber(items),
    date: ec.date || new Date().toISOString().slice(0, 10),
    journal: ec.journal || 'OD',
    libelle: sanitize(ec.libelle || ''),
    exerciceId: ec.exerciceId || exercice?.id || null,
    lignes: (ec.lignes || []).map(l => ({
      compte: l.compte,
      libelle: sanitize(l.libelle || ''),
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
    })),
    totalDebit: (ec.lignes || []).reduce((s, l) => s + (Number(l.debit) || 0), 0),
    totalCredit: (ec.lignes || []).reduce((s, l) => s + (Number(l.credit) || 0), 0),
    statut: 'validée',
    creeePar: sanitize(ec.creeePar || ''),
    dateCreation: new Date().toISOString(),
  }
  items.push(ecriture)
  setFinanceData('ecritures', items)
  addLog('Écriture comptable', `${ecriture.numero} — ${ecriture.libelle}`, ecriture.id)
  return ecriture
}

export function updateEcriture(ec) {
  const items = getFinanceData('ecritures')
  const idx = items.findIndex(e => e.id === ec.id)
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...sanitizeObj(ec) }
    setFinanceData('ecritures', items)
    addLog('Écriture modifiée', ec.numero || '', ec.id)
  }
}

export function deleteEcriture(id) {
  const items = getFinanceData('ecritures')
  const e = items.find(x => x.id === id)
  setFinanceData('ecritures', items.filter(x => x.id !== id))
  addLog('Écriture supprimée', e?.numero || String(id), id)
}

function generateEcritureNumber(items) {
  const now = new Date()
  const prefix = `EC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const count = items.filter(e => e.numero?.startsWith(prefix)).length + 1
  return `${prefix}-${String(count).padStart(4, '0')}`
}

// ── Balance Générale ──
export function getBalance(depuis = null, jusqu = null) {
  const ecritures = getFinanceData('ecritures').filter(e => e.statut === 'validée')
  let filtered = ecritures
  if (depuis) filtered = filtered.filter(e => e.date >= depuis)
  if (jusqu) filtered = filtered.filter(e => e.date <= jusqu)

  const comptes = {}
  for (const ec of filtered) {
    for (const ligne of ec.lignes || []) {
      if (!comptes[ligne.compte]) comptes[ligne.compte] = { compte: ligne.compte, libelle: ligne.libelle || '', debit: 0, credit: 0, solde: 0 }
      comptes[ligne.compte].debit += ligne.debit || 0
      comptes[ligne.compte].credit += ligne.credit || 0
    }
  }

  return Object.values(comptes).map(c => ({
    ...c,
    solde: c.debit - c.credit,
    soldeD: c.debit > c.credit ? c.debit - c.credit : 0,
    soldeC: c.credit > c.debit ? c.credit - c.debit : 0,
  })).sort((a, b) => a.compte.localeCompare(b.compte))
}

// ── Grand Livre ──
export function getGrandLivre(compteFilter = null, depuis = null) {
  const ecritures = getFinanceData('ecritures').filter(e => e.statut === 'validée')
  let filtered = ecritures
  if (depuis) filtered = filtered.filter(e => e.date >= depuis)

  const lignes = []
  let soldeCumul = 0

  for (const ec of filtered.sort((a, b) => a.date.localeCompare(b.date) || a.numero?.localeCompare(b.numero))) {
    for (const ligne of ec.lignes || []) {
      if (compteFilter && !ligne.compte.startsWith(compteFilter)) continue
      soldeCumul += (ligne.debit || 0) - (ligne.credit || 0)
      lignes.push({
        date: ec.date,
        numero: ec.numero,
        journal: ec.journal,
        libelle: ligne.libelle || ec.libelle,
        compte: ligne.compte,
        debit: ligne.debit || 0,
        credit: ligne.credit || 0,
        solde: soldeCumul,
      })
    }
  }
  return lignes
}

// ── Bilan OHADA ──
export function getBilan(exerciceId = null) {
  const balance = getBalance()

  const immobilisations = balance.filter(c => c.compte.startsWith('2') && c.compte.length === 4)
  const stocks = balance.filter(c => c.compte.startsWith('3') && c.compte.length === 4)
  const tiers = balance.filter(c => c.compte.startsWith('4') && c.compte.length === 4)
  const financiers = balance.filter(c => c.compte.startsWith('5') && c.compte.length === 4)

  const actifImmobilise = immobilisations.filter(c => !c.compte.startsWith('28') && !c.compte.startsWith('29'))
  const amortissements = immobilisations.filter(c => c.compte.startsWith('28'))
  const provisions = immobilisations.filter(c => c.compte.startsWith('29'))

  const actifCirculant = [...stocks, ...tiers.filter(c => c.solde > 0), ...financiers.filter(c => c.solde > 0)]

  const capitauxPropres = balance.filter(c => c.compte.startsWith('1'))
  const dettes = [...tiers.filter(c => c.solde < 0), ...financiers.filter(c => c.solde < 0)]

  const totalActifImmobilise = actifImmobilise.reduce((s, c) => s + c.soldeD, 0) - amortissements.reduce((s, c) => s + c.soldeC, 0)
  const totalActifCirculant = actifCirculant.reduce((s, c) => s + c.soldeD, 0)

  const totalCapitaux = capitauxPropres.reduce((s, c) => s + (c.debit > c.credit ? -c.solde : c.solde), 0)
  const totalDettes = dettes.reduce((s, c) => s + Math.abs(c.solde), 0)

  return {
    actif: {
      immobilise: actifImmobilise,
      amortissements,
      provisions,
      total: totalActifImmobilise,
      circulant: actifCirculant,
      totalCirculant: totalActifCirculant,
      totalGeneral: totalActifImmobilise + totalActifCirculant,
    },
    passif: {
      capitaux: capitauxPropres,
      totalCapitaux,
      dettes,
      totalDettes,
      totalGeneral: totalCapitaux + totalDettes,
    },
  }
}

// ── Compte de Résultat ──
export function getCompteResultat() {
  const balance = getBalance()

  const charges = balance.filter(c => c.compte.startsWith('6') && c.compte.length === 4)
  const produits = balance.filter(c => c.compte.startsWith('7') && c.compte.length === 4)

  const achats = charges.filter(c => c.compte.startsWith('60')).reduce((s, c) => s + c.soldeD, 0)
  const autresChargesExterne = charges.filter(c => c.compte.startsWith('61') || c.compte.startsWith('62')).reduce((s, c) => s + c.soldeD, 0)
  const impotsTaxes = charges.filter(c => c.compte.startsWith('63')).reduce((s, c) => s + c.soldeD, 0)
  const chargesPersonnel = charges.filter(c => c.compte.startsWith('64')).reduce((s, c) => s + c.soldeD, 0)
  const chargesFinancieres = charges.filter(c => c.compte.startsWith('65')).reduce((s, c) => s + c.soldeD, 0)
  const dotations = charges.filter(c => c.compte.startsWith('68')).reduce((s, c) => s + c.soldeD, 0)
  const totalCharges = charges.reduce((s, c) => s + c.soldeD, 0)

  const ventes = produits.filter(c => c.compte.startsWith('70') || c.compte.startsWith('71')).reduce((s, c) => s + c.soldeC, 0)
  const produitsFinanciers = produits.filter(c => c.compte.startsWith('76')).reduce((s, c) => s + c.soldeC, 0)
  const produitsExceptionnels = produits.filter(c => c.compte.startsWith('77')).reduce((s, c) => s + c.soldeC, 0)
  const reprises = produits.filter(c => c.compte.startsWith('78')).reduce((s, c) => s + c.soldeC, 0)
  const totalProduits = produits.reduce((s, c) => s + c.soldeC, 0)

  const resultat = totalProduits - totalCharges

  return {
    charges: { achats, autresChargesExterne, impotsTaxes, chargesPersonnel, chargesFinancieres, dotations, total: totalCharges },
    produits: { ventes, produitsFinanciers, produitsExceptionnels, reprises, total: totalProduits },
    resultat,
    benefice: resultat > 0,
  }
}

// ── Trésorerie ──
export function getTresorerie() {
  const balance = getBalance()
  const caisse = balance.filter(c => c.compte.startsWith('53')).reduce((s, c) => s + c.solde, 0)
  const banque = balance.filter(c => c.compte.startsWith('52')).reduce((s, c) => s + c.solde, 0)
  return { caisse, banque, total: caisse + banque }
}

// ── Créances & Dettes ──
export function getCreancesDettes() {
  const balance = getBalance()
  const creancesClients = balance.filter(c => c.compte.startsWith('41')).filter(c => c.solde > 0).reduce((s, c) => s + c.soldeD, 0)
  const dettesFournisseurs = balance.filter(c => c.compte.startsWith('40')).filter(c => c.solde < 0).reduce((s, c) => s + Math.abs(c.solde), 0)
  const dettesFiscales = balance.filter(c => c.compte.startsWith('44')).reduce((s, c) => s + Math.abs(c.solde), 0)
  return { creancesClients, dettesFournisseurs, dettesFiscales, netTresorerie: creancesClients - dettesFournisseurs - dettesFiscales }
}

// ── Rapprochement Bancaire ──
export function getRapprochements() { return getFinanceData('rapprochements') }

export function addRapprochement(r) {
  const items = getFinanceData('rapprochements')
  const rapp = {
    id: nextId(items),
    date: r.date || new Date().toISOString().slice(0, 10),
    dateReleve: r.dateReleve,
    soldeReleve: r.soldeReleve || 0,
    soldeLivre: r.soldeLivre || 0,
    ecart: (r.soldeReleve || 0) - (r.soldeLivre || 0),
    lignes: r.lignes || [],
    statut: 'en_cours',
    notes: sanitize(r.notes || ''),
  }
  items.push(rapp)
  setFinanceData('rapprochements', items)
  addLog('Rapprochement bancaire', `Solde relevé: ${rapp.soldeReleve} | Solde livre: ${rapp.soldeLivre}`, rapp.id)
  return rapp
}

// ── Lettrage ──
export function getLettrages() { return getFinanceData('lettrages') }

export function addLettrage(l) {
  const items = getFinanceData('lettrages')
  const lettrage = {
    id: nextId(items),
    numero: l.numero || `LET${Date.now()}`,
    date: l.date || new Date().toISOString().slice(0, 10),
    compte: l.compte,
    ecritures: l.ecritures || [],
    montant: l.montant || 0,
  }
  items.push(lettrage)
  setFinanceData('lettrages', items)
  addLog('Lettrage', `${lettrage.compte} — ${lettrage.montant?.toLocaleString('fr-FR')} FCFA`, lettrage.id)
  return lettrage
}

// ── Helpers ──
export function getJournaux() { return getFinanceData('journaux') }

export function addJournal(j) {
  const items = getFinanceData('journaux')
  const journal = { id: nextId(items), code: sanitize(j.code), libelle: sanitize(j.libelle) }
  items.push(journal)
  setFinanceData('journaux', items)
  return journal
}
