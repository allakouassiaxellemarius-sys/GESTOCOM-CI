import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Landmark, BookOpen, FileText, Scale, TrendingUp, TrendingDown,
  CreditCard, Search, Plus, Trash2, ChevronDown, Calculator,
  Receipt, AlertTriangle, Download, Filter, ArrowUpDown, ClipboardList,
} from 'lucide-react'
import { getEcritures, addEcriture, deleteEcriture, getBalance, getBilan, getCompteResultat, getTresorerie, getCreancesDettes, getExercices, createExercice, getExerciceActif, getRapprochements, addRapprochement } from '../lib/financeDb'
import { searchComptes, getCompteLabel, JOURNAUX } from '../lib/planComptable'
import SearchInput from '../components/SearchInput'
import Pagination from '../components/Pagination'
import { exportCSV } from '../lib/exportCSV'

const TABS = [
  { key: 'ecritures', label: 'Écritures', icon: BookOpen },
  { key: 'balance', label: 'Balance', icon: Scale },
  { key: 'bilan', label: 'Bilan', icon: FileText },
  { key: 'resultat', label: 'Résultat', icon: TrendingUp },
  { key: 'tresorerie', label: 'Trésorerie', icon: CreditCard },
  { key: 'creances', label: 'Créances', icon: AlertTriangle },
  { key: 'rapprochement', label: 'Rapprochement', icon: ClipboardList },
]

function formatMontant(n) { return (n || 0).toLocaleString('fr-FR') + ' FCFA' }

export default function FinancePage() {
  const [tab, setTab] = useState('ecritures')
  const [showNewEcriture, setShowNewEcriture] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rappRefresh, setRappRefresh] = useState(0)
  const exercice = getExerciceActif()

  const ecritures = useMemo(() => {
    let items = getEcritures()
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(e => e.numero?.toLowerCase().includes(q) || e.libelle?.toLowerCase().includes(q) || e.journal?.toLowerCase().includes(q))
    }
    return items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [search, showNewEcriture])

  const balance = useMemo(() => getBalance(), [showNewEcriture])
  const bilan = useMemo(() => getBilan(), [showNewEcriture])
  const resultat = useMemo(() => getCompteResultat(), [showNewEcriture])
  const tresorerie = useMemo(() => getTresorerie(), [showNewEcriture])
  const creances = useMemo(() => getCreancesDettes(), [showNewEcriture])
  const rapprochements = useMemo(() => getRapprochements(), [rappRefresh])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-500" /> Finance & Comptabilité
          </h1>
          {exercice && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Exercice : {exercice.libelle} ({exercice.dateDebut} → {exercice.dateFin})</p>}
        </div>
        <button onClick={() => setShowNewEcriture(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Nouvelle écriture
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 dark:bg-dark-800 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-white dark:bg-dark-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'ecritures' && (
        <EcrituresTab ecritures={ecritures} search={search} setSearch={setSearch} page={page} setPage={setPage}
          onDelete={deleteEcriture} onRefresh={() => setShowNewEcriture(!showNewEcriture)} />
      )}
      {tab === 'balance' && <BalanceTab balance={balance} />}
      {tab === 'bilan' && <BilanTab bilan={bilan} />}
      {tab === 'resultat' && <ResultatTab resultat={resultat} />}
      {tab === 'tresorerie' && <TresorerieTab tresorerie={tresorerie} />}
      {tab === 'creances' && <CreancesTab creances={creances} />}
      {tab === 'rapprochement' && <RapprochementTab rapprochements={rapprochements} onRefresh={() => setRappRefresh(r => r + 1)} />}

      {/* Modal Nouvelle Écriture */}
      {showNewEcriture && (
        <NouvelleEcritureModal onClose={() => setShowNewEcriture(false)} exercice={exercice} />
      )}
    </div>
  )
}

function EcrituresTab({ ecritures, search, setSearch, page, setPage, onDelete, onRefresh }) {
  const PAGE_SIZE = 20
  const total = ecritures.length
  const paged = ecritures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher une écriture..." /></div>
        <button onClick={() => exportCSV(ecritures.map(e => ({
          Numero: e.numero, Date: e.date, Journal: e.journal, Libellé: e.libelle,
          'Total Débit': e.totalDebit, 'Total Crédit': e.totalCredit,
        })), 'ecritures_comptables')} className="btn-secondary text-sm"><Download className="w-4 h-4" /> Exporter</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Numéro</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Journal</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Libellé</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Débit</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Crédit</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(e => (
                <tr key={e.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                  <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">{e.numero}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.date}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-xs font-medium">{e.journal}</span></td>
                  <td className="px-4 py-3">{e.libelle}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600">{e.totalDebit ? formatMontant(e.totalDebit) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600">{e.totalCredit ? formatMontant(e.totalCredit) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { if (confirm('Supprimer cette écriture ?')) { onDelete(e.id); onRefresh() } }}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucune écriture comptable</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </div>
  )
}

function BalanceTab({ balance }) {
  const classes = useMemo(() => {
    const map = {}
    balance.forEach(c => {
      const cl = c.compte.charAt(0)
      if (!map[cl]) map[cl] = []
      map[cl].push(c)
    })
    return map
  }, [balance])

  const CLASSE_NAMES = { '1': 'Capitaux propres', '2': 'Immobilisations', '3': 'Stocks', '4': 'Tiers', '5': 'Financiers', '6': 'Charges', '7': 'Produits' }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Compte</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Libellé</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Débit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Crédit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Solde D</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Solde C</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(classes).sort(([a], [b]) => a.localeCompare(b)).map(([classe, comptes]) => (
              <>
                <tr key={`header-${classe}`} className="bg-gray-50 dark:bg-dark-900/50">
                  <td colSpan={6} className="px-4 py-2 font-semibold text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Classe {classe} — {CLASSE_NAMES[classe] || ''}
                  </td>
                </tr>
                {comptes.map(c => (
                  <tr key={c.compte} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                    <td className="px-4 py-2 font-mono text-xs text-brand-600 dark:text-brand-400">{c.compte}</td>
                    <td className="px-4 py-2">{c.libelle}</td>
                    <td className="px-4 py-2 text-right font-mono text-amber-600">{c.debit ? formatMontant(c.debit) : '—'}</td>
                    <td className="px-4 py-2 text-right font-mono text-emerald-600">{c.credit ? formatMontant(c.credit) : '—'}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-amber-700">{c.soldeD ? formatMontant(c.soldeD) : '—'}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-700">{c.soldeC ? formatMontant(c.soldeC) : '—'}</td>
                  </tr>
                ))}
              </>
            ))}
            {balance.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucune donnée de balance</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BilanTab({ bilan }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
        <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-500" /> ACTIF
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Actif Immobilisé</h4>
            {bilan.actif.immobilise.map(c => (
              <div key={c.compte} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{c.compte} — {c.libelle}</span>
                <span className="font-mono">{formatMontant(c.soldeD)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-dark-700 font-bold text-sm">
              <span>Total Immobilisations</span>
              <span className="font-mono">{formatMontant(bilan.actif.total)}</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Actif Circulant</h4>
            {bilan.actif.circulant.map(c => (
              <div key={c.compte} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{c.compte} — {c.libelle}</span>
                <span className="font-mono">{formatMontant(c.soldeD)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-dark-700 font-bold text-sm">
              <span>Total Circulant</span>
              <span className="font-mono">{formatMontant(bilan.actif.totalCirculant)}</span>
            </div>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-brand-500 font-bold text-brand-600">
            <span>TOTAL ACTIF</span>
            <span className="font-mono text-lg">{formatMontant(bilan.actif.totalGeneral)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
        <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-emerald-500" /> PASSIF
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Capitaux Propres</h4>
            {bilan.passif.capitaux.map(c => (
              <div key={c.compte} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{c.compte} — {c.libelle}</span>
                <span className="font-mono">{formatMontant(Math.abs(c.solde))}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-dark-700 font-bold text-sm">
              <span>Total Capitaux</span>
              <span className="font-mono">{formatMontant(bilan.passif.totalCapitaux)}</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Dettes</h4>
            {bilan.passif.dettes.map(c => (
              <div key={c.compte} className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">{c.compte} — {c.libelle}</span>
                <span className="font-mono">{formatMontant(Math.abs(c.solde))}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 dark:border-dark-700 font-bold text-sm">
              <span>Total Dettes</span>
              <span className="font-mono">{formatMontant(bilan.passif.totalDettes)}</span>
            </div>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-emerald-500 font-bold text-emerald-600">
            <span>TOTAL PASSIF</span>
            <span className="font-mono text-lg">{formatMontant(bilan.passif.totalGeneral)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultatTab({ resultat }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 max-w-2xl">
      <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-brand-500" /> Compte de Résultat
      </h3>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-3">CHARGES</h4>
          <div className="space-y-2 text-sm">
            <Row label="Achats" value={resultat.charges.achats} />
            <Row label="Charges externes" value={resultat.charges.autresChargesExterne} />
            <Row label="Impôts & taxes" value={resultat.charges.impotsTaxes} />
            <Row label="Personnel" value={resultat.charges.chargesPersonnel} />
            <Row label="Charges financières" value={resultat.charges.chargesFinancieres} />
            <Row label="Dotations" value={resultat.charges.dotations} />
            <div className="border-t border-gray-200 dark:border-dark-700 pt-2 mt-2">
              <Row label="TOTAL CHARGES" value={resultat.charges.total} bold />
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">PRODUITS</h4>
          <div className="space-y-2 text-sm">
            <Row label="Ventes" value={resultat.produits.ventes} />
            <Row label="Produits financiers" value={resultat.produits.produitsFinanciers} />
            <Row label="Produits exceptionnels" value={resultat.produits.produitsExceptionnels} />
            <Row label="Reprises" value={resultat.produits.reprises} />
            <div className="border-t border-gray-200 dark:border-dark-700 pt-2 mt-2">
              <Row label="TOTAL PRODUITS" value={resultat.produits.total} bold />
            </div>
          </div>
        </div>
      </div>
      <div className={`mt-6 p-4 rounded-xl ${resultat.resultat >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">{resultat.resultat >= 0 ? 'Résultat Bénéficiaire' : 'Résultat Déficitaire'}</span>
          <span className={`font-bold text-xl font-mono ${resultat.resultat >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatMontant(Math.abs(resultat.resultat))}
          </span>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? 'font-semibold' : 'text-gray-600 dark:text-gray-400'}>{label}</span>
      <span className={`font-mono ${bold ? 'font-bold' : ''}`}>{formatMontant(value)}</span>
    </div>
  )
}

function TresorerieTab({ tresorerie }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 max-w-md">
      <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-sky-500" /> Trésorerie
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between py-3 border-b border-gray-100 dark:border-dark-700">
          <span className="text-gray-600 dark:text-gray-400">Caisse</span>
          <span className="font-mono font-semibold">{formatMontant(tresorerie.caisse)}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-gray-100 dark:border-dark-700">
          <span className="text-gray-600 dark:text-gray-400">Banque</span>
          <span className="font-mono font-semibold">{formatMontant(tresorerie.banque)}</span>
        </div>
        <div className="flex justify-between py-3 border-t-2 border-sky-500 font-bold text-sky-600 text-lg">
          <span>Total Trésorerie</span>
          <span className="font-mono">{formatMontant(tresorerie.total)}</span>
        </div>
      </div>
    </div>
  )
}

function CreancesTab({ creances }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 max-w-lg">
      <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" /> Créances & Dettes
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between py-3 border-b border-gray-100 dark:border-dark-700">
          <span className="text-gray-600 dark:text-gray-400">Créances clients (41)</span>
          <span className="font-mono font-semibold text-emerald-600">{formatMontant(creances.creancesClients)}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-gray-100 dark:border-dark-700">
          <span className="text-gray-600 dark:text-gray-400">Dettes fournisseurs (40)</span>
          <span className="font-mono font-semibold text-red-600">{formatMontant(creances.dettesFournisseurs)}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-gray-100 dark:border-dark-700">
          <span className="text-gray-600 dark:text-gray-400">Dettes fiscales (44)</span>
          <span className="font-mono font-semibold text-amber-600">{formatMontant(creances.dettesFiscales)}</span>
        </div>
        <div className="flex justify-between py-3 border-t-2 border-brand-500 font-bold">
          <span>Net Trésorerie</span>
          <span className={`font-mono text-lg ${creances.netTresorerie >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatMontant(creances.netTresorerie)}
          </span>
        </div>
      </div>
    </div>
  )
}

function NouvelleEcritureModal({ onClose, exercice }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [journal, setJournal] = useState('OD')
  const [libelle, setLibelle] = useState('')
  const [lignes, setLignes] = useState([
    { compte: '', libelle: '', debit: '', credit: '' },
    { compte: '', libelle: '', debit: '', credit: '' },
  ])
  const [compteSearch, setCompteSearch] = useState(null)
  const [compteSearchIdx, setCompteSearchIdx] = useState(null)

  const totalDebit = lignes.reduce((s, l) => s + (Number(l.debit) || 0), 0)
  const totalCredit = lignes.reduce((s, l) => s + (Number(l.credit) || 0), 0)
  const equilibre = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  const updateLigne = (idx, field, value) => {
    const newLignes = [...lignes]
    newLignes[idx] = { ...newLignes[idx], [field]: value }
    setLignes(newLignes)
  }

  const addLigne = () => setLignes([...lignes, { compte: '', libelle: '', debit: '', credit: '' }])

  const save = () => {
    if (!equilibre || !libelle) return
    addEcriture({ date, journal, libelle, lignes, creeePar: 'Admin' })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">Nouvelle Écriture Comptable</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Journal</label>
              <select value={journal} onChange={e => setJournal(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                {Object.entries(JOURNAUX).map(([code, label]) => (
                  <option key={code} value={code}>{code} — {label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Exercice</label>
              <input type="text" value={exercice?.libelle || 'Aucun'} disabled
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Libellé</label>
            <input type="text" value={libelle} onChange={e => setLibelle(e.target.value)} placeholder="Description de l'écriture..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
          </div>

          {/* Lignes d'écriture */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold dark:text-white">Lignes d'écriture</h3>
              <button onClick={addLigne} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                <Plus className="w-3 h-3" /> Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {lignes.map((ligne, idx) => (
                <div key={idx} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 sm:col-span-3 relative">
                    <input type="text" value={ligne.compte} placeholder="Compte"
                      onChange={e => { updateLigne(idx, 'compte', e.target.value); setCompteSearchIdx(idx); setCompteSearch(e.target.value) }}
                      className="w-full px-2 py-1.5 text-xs font-mono rounded border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                    {compteSearchIdx === idx && compteSearch && (
                      <CompteSearchDropdown query={compteSearch} onSelect={(c) => { updateLigne(idx, 'compte', c.numero); updateLigne(idx, 'libelle', c.libelle); setCompteSearch(null) }} />
                    )}
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <input type="text" value={ligne.libelle} placeholder="Libellé"
                      onChange={e => updateLigne(idx, 'libelle', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <input type="number" value={ligne.debit} placeholder="Débit" min="0"
                      onChange={e => updateLigne(idx, 'debit', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono rounded border border-amber-200 dark:border-amber-800 dark:bg-dark-900 dark:text-amber-400" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <input type="number" value={ligne.credit} placeholder="Crédit" min="0"
                      onChange={e => updateLigne(idx, 'credit', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono rounded border border-emerald-200 dark:border-emerald-800 dark:bg-dark-900 dark:text-emerald-400" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-center">
                    {lignes.length > 2 && (
                      <button onClick={() => setLignes(lignes.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className={`flex justify-between p-3 rounded-lg ${equilibre ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : 'bg-red-50 dark:bg-red-900/20 text-red-700'}`}>
            <span className="text-sm font-semibold">Débit: {formatMontant(totalDebit)} | Crédit: {formatMontant(totalCredit)}</span>
            <span className="text-sm font-bold">{equilibre ? 'Équilibré' : `Écart: ${formatMontant(Math.abs(totalDebit - totalCredit))}`}</span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary text-sm">Annuler</button>
          <button onClick={save} disabled={!equilibre || !libelle} className="btn-primary text-sm disabled:opacity-50">
            Enregistrer l'écriture
          </button>
        </div>
      </div>
    </div>
  )
}

function CompteSearchDropdown({ query, onSelect }) {
  const results = searchComptes(query)
  if (results.length === 0) return null
  return (
    <div className="absolute z-50 top-full left-0 w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
      {results.map(c => (
        <button key={c.numero} onClick={() => onSelect(c)}
          className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-700 border-b border-gray-50 dark:border-dark-800 last:border-0">
          <span className="font-mono text-brand-500">{c.numero}</span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">{c.libelle}</span>
        </button>
      ))}
    </div>
  )
}

function RapprochementTab({ rapprochements, onRefresh }) {
  const [showNew, setShowNew] = useState(false)
  const [dateReleve, setDateReleve] = useState('')
  const [soldeReleve, setSoldeReleve] = useState('')
  const [soldeLivre, setSoldeLivre] = useState('')
  const [notes, setNotes] = useState('')
  const [lignes, setLignes] = useState([{ libelle: '', montant: 0 }])

  const handleCreate = () => {
    if (!dateReleve || !soldeReleve) return
    addRapprochement({
      dateReleve,
      soldeReleve: parseFloat(soldeReleve) || 0,
      soldeLivre: parseFloat(soldeLivre) || 0,
      lignes: lignes.filter(l => l.libelle.trim()),
      notes,
    })
    setShowNew(false)
    setDateReleve('')
    setSoldeReleve('')
    setSoldeLivre('')
    setNotes('')
    setLignes([{ libelle: '', montant: 0 }])
    onRefresh()
  }

  const addLigne = () => setLignes([...lignes, { libelle: '', montant: 0 }])
  const removeLigne = (idx) => setLignes(lignes.filter((_, i) => i !== idx))
  const updateLigne = (idx, key, val) => {
    const updated = [...lignes]
    updated[idx] = { ...updated[idx], [key]: val }
    setLignes(updated)
  }

  const statusColors = {
    en_cours: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    valide: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    ecart: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Rapprochement bancaire — Comparez vos relevés avec la comptabilité</p>
        <button onClick={() => setShowNew(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Nouveau rapprochement
        </button>
      </div>

      {showNew && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-emerald-300 dark:border-emerald-800 p-4 shadow-lg space-y-3">
          <h3 className="text-sm font-semibold dark:text-white">Nouveau rapprochement bancaire</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date du relevé</label>
              <input type="date" value={dateReleve} onChange={e => setDateReleve(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Solde relevé (FCFA)</label>
              <input type="number" value={soldeReleve} onChange={e => setSoldeReleve(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Solde comptable (FCFA)</label>
              <input type="number" value={soldeLivre} onChange={e => setSoldeLivre(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lignes de rapprochement</label>
            {lignes.map((l, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" value={l.libelle} onChange={e => updateLigne(idx, 'libelle', e.target.value)} placeholder="Libellé"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                <input type="number" value={l.montant || ''} onChange={e => updateLigne(idx, 'montant', parseFloat(e.target.value) || 0)} placeholder="Montant"
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white font-mono" />
                {lignes.length > 1 && (
                  <button onClick={() => removeLigne(idx)} className="p-2 text-red-400 hover:text-red-600 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addLigne} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1">
              <Plus className="w-3 h-3" /> Ajouter une ligne
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observations..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          {soldeReleve && soldeLivre && (
            <div className={`text-xs font-medium p-2 rounded-lg ${parseFloat(soldeReleve) === parseFloat(soldeLivre) ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
              Écart : {formatMontant(Math.abs(parseFloat(soldeReleve) - parseFloat(soldeLivre)))}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNew(false)} className="btn-secondary text-sm">Annuler</button>
            <button onClick={handleCreate} disabled={!dateReleve || !soldeReleve} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
          </div>
        </div>
      )}

      {rapprochements.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun rapprochement bancaire</p>
          <p className="text-xs mt-1">Créez un rapprochement pour vérifier vos relevés bancaires</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rapprochements.sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(r => (
            <div key={r.id} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold dark:text-white">{r.dateReleve || r.date}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${r.ecart === 0 ? statusColors.valide : statusColors.ecart}`}>
                    {r.ecart === 0 ? 'Équilibré' : `Écart: ${formatMontant(Math.abs(r.ecart))}`}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{r.statut === 'en_cours' ? 'En cours' : 'Validé'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Solde relevé</span>
                  <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">{formatMontant(r.soldeReleve)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Solde comptable</span>
                  <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatMontant(r.soldeLivre)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Écart</span>
                  <p className={`font-mono font-semibold ${r.ecart === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatMontant(r.ecart)}</p>
                </div>
              </div>
              {r.lignes?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-700">
                  <p className="text-[10px] text-gray-400 mb-1">Lignes ({r.lignes.length})</p>
                  {r.lignes.map((l, i) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600 dark:text-gray-400 py-0.5">
                      <span>{l.libelle}</span>
                      <span className="font-mono">{formatMontant(l.montant)}</span>
                    </div>
                  ))}
                </div>
              )}
              {r.notes && <p className="mt-2 text-xs text-gray-400 italic">{r.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
