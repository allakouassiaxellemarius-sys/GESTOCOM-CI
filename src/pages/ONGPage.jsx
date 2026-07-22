import { useState, useMemo } from 'react'
import { HandHeart, FolderOpen, Users, Building, DollarSign, FileText, Plus, X, Pencil, Trash2, Download, Search } from 'lucide-react'
const DB_PREFIX = 'gestocom_'
function getAll(name) { try { return JSON.parse(localStorage.getItem(DB_PREFIX + name) || '[]') } catch { return [] } }
function setAll(name, data) { localStorage.setItem(DB_PREFIX + name, JSON.stringify(data)) }
function nextId(items) { return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1 }
function sanitize(str) { if (typeof str !== 'string') return str; return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]) }
import { exportCSV } from '../lib/exportCSV'
import SearchInput from '../components/SearchInput'
import Pagination from '../components/Pagination'

const ONG_STORE = 'gestocom_ong'

const initialData = { projets: [], beneficiaires: [], activites: [], partenaires: [] }

function loadData() {
  try { return JSON.parse(localStorage.getItem(ONG_STORE) || JSON.stringify(initialData)) } catch { return { ...initialData } }
}

function saveData(data) { localStorage.setItem(ONG_STORE, JSON.stringify(data)) }

const tabs = [
  { key: 'projets', label: 'Projets', icon: FolderOpen },
  { key: 'beneficiaires', label: 'Bénéficiaires', icon: Users },
  { key: 'activites', label: 'Activités', icon: HandHeart },
  { key: 'partenaires', label: 'Partenaires & Donateurs', icon: Building },
  { key: 'budget', label: 'Budget', icon: DollarSign },
  { key: 'rapports', label: 'Rapports', icon: FileText },
]

const emptyProjet = { nom: '', description: '', bailleur: '', budgetTotal: 0, budgetConsomme: 0, dateDebut: '', dateFin: '', statut: 'planifie', zoneGeographique: '' }
const emptyBeneficiaire = { nom: '', sexe: '', age: '', telephone: '', adresse: '', projetId: '', type: 'direct' }
const emptyActivite = { projetId: '', description: '', date: '', beneficiairesCibles: 0, resultats: '', statut: 'prevue' }
const emptyPartenaire = { nom: '', type: 'bailleur', contact: '', telephone: '', email: '', montantTotalFinance: 0 }
const emptyPoste = { poste: '', prevu: 0, realise: 0 }

function StatutBadge({ statut, options }) {
  const map = options || { planifie: { label: 'Planifié', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' }, en_cours: { label: 'En cours', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' }, suspendu: { label: 'Suspendu', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' }, termine: { label: 'Terminé', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' }, prevue: { label: 'Prévue', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' }, realisee: { label: 'Réalisée', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' } }
  const s = map[statut] || { label: statut, cls: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400' }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-dark-800 rounded-2xl p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function ONGPage() {
  const [data, setData] = useState(loadData)
  const [tab, setTab] = useState('projets')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10

  const [modal, setModal] = useState(null)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(null)

  const [budgetProjetId, setBudgetProjetId] = useState('')
  const [budgetPostes, setBudgetPostes] = useState([])
  const [budgetNewPoste, setBudgetNewPoste] = useState({ ...emptyPoste })

  const refresh = () => { setData(loadData()) }

  const projets = data.projets || []
  const beneficiaires = data.beneficiaires || []
  const activites = data.activites || []
  const partenaires = data.partenaires || []

  const filteredProjets = useMemo(() => {
    let r = [...projets]
    if (search) { const q = search.toLowerCase(); r = r.filter(p => p.nom.toLowerCase().includes(q) || p.bailleur?.toLowerCase().includes(q)) }
    return r
  }, [projets, search])

  const filteredBeneficiaires = useMemo(() => {
    let r = [...beneficiaires]
    if (search) { const q = search.toLowerCase(); r = r.filter(b => b.nom.toLowerCase().includes(q) || (b.telephone || '').includes(q)) }
    return r
  }, [beneficiaires, search])

  const filteredActivites = useMemo(() => {
    let r = [...activites]
    if (search) { const q = search.toLowerCase(); r = r.filter(a => a.description.toLowerCase().includes(q) || (a.resultats || '').toLowerCase().includes(q)) }
    return r
  }, [activites, search])

  const filteredPartenaires = useMemo(() => {
    let r = [...partenaires]
    if (search) { const q = search.toLowerCase(); r = r.filter(p => p.nom.toLowerCase().includes(q) || (p.contact || '').toLowerCase().includes(q)) }
    return r
  }, [partenaires, search])

  const currentItems = useMemo(() => {
    const items = tab === 'projets' ? filteredProjets : tab === 'beneficiaires' ? filteredBeneficiaires : tab === 'activites' ? filteredActivites : tab === 'partenaires' ? filteredPartenaires : []
    return items.slice((page - 1) * perPage, page * perPage)
  }, [tab, filteredProjets, filteredBeneficiaires, filteredActivites, filteredPartenaires, page])

  const totalFiltered = useMemo(() => {
    return tab === 'projets' ? filteredProjets.length : tab === 'beneficiaires' ? filteredBeneficiaires.length : tab === 'activites' ? filteredActivites.length : tab === 'partenaires' ? filteredPartenaires.length : 0
  }, [tab, filteredProjets, filteredBeneficiaires, filteredActivites, filteredPartenaires])

  const handleSearchChange = (v) => { setSearch(v); setPage(1) }

  const openModal = (entity, item = null) => {
    setEditId(item?.id || null)
    if (entity === 'projet') setForm(item ? { ...emptyProjet, ...item } : { ...emptyProjet })
    else if (entity === 'beneficiaire') setForm(item ? { ...emptyBeneficiaire, ...item } : { ...emptyBeneficiaire })
    else if (entity === 'activite') setForm(item ? { ...emptyActivite, ...item } : { ...emptyActivite })
    else if (entity === 'partenaire') setForm(item ? { ...emptyPartenaire, ...item } : { ...emptyPartenaire })
    setModal(entity)
  }

  const closeModal = () => { setModal(null); setEditId(null); setForm(null) }

  const handleSave = () => {
    const items = [...(tab === 'projets' ? projets : tab === 'beneficiaires' ? beneficiaires : tab === 'activites' ? activites : partenaires)]
    const clean = {}
    for (const [k, v] of Object.entries(form)) clean[k] = typeof v === 'string' ? sanitize(v) : v
    if (editId) {
      const idx = items.findIndex(i => i.id === editId)
      if (idx !== -1) items[idx] = { ...items[idx], ...clean }
    } else {
      clean.id = nextId(items)
      items.push(clean)
    }
    const newData = { ...data }
    if (tab === 'projets') newData.projets = items
    else if (tab === 'beneficiaires') newData.beneficiaires = items
    else if (tab === 'activites') newData.activites = items
    else if (tab === 'partenaires') newData.partenaires = items
    saveData(newData)
    refresh()
    closeModal()
  }

  const handleDelete = (entity, id) => {
    if (!confirm('Supprimer cet élément ?')) return
    const items = entity === 'projet' ? projets : entity === 'beneficiaire' ? beneficiaires : entity === 'activite' ? activites : partenaires
    const newData = { ...data }
    newData[entity === 'projet' ? 'projets' : entity === 'beneficiaire' ? 'beneficiaires' : entity === 'activite' ? 'activites' : 'partenaires'] = items.filter(i => i.id !== id)
    saveData(newData)
    refresh()
  }

  const handleExport = () => {
    const labels = { projets: ['Nom', 'Description', 'Bailleur', 'Budget Total', 'Budget Consommé', 'Date Début', 'Date Fin', 'Statut', 'Zone'], beneficiaires: ['Nom', 'Sexe', 'Âge', 'Téléphone', 'Adresse', 'Projet', 'Type'], activites: ['Projet', 'Description', 'Date', 'Bénéficiaires Ciblés', 'Résultats', 'Statut'], partenaires: ['Nom', 'Type', 'Contact', 'Téléphone', 'Email', 'Montant Financé'] }
    let items; let hdrs
    if (tab === 'projets') { items = filteredProjets; hdrs = labels.projets }
    else if (tab === 'beneficiaires') { items = filteredBeneficiaires; hdrs = labels.beneficiaires }
    else if (tab === 'activites') { items = filteredActivites; hdrs = labels.activites }
    else if (tab === 'partenaires') { items = filteredPartenaires; hdrs = labels.partenaires }
    else return
    const rows = items.map(i => {
      if (tab === 'projets') return [i.nom, i.description, i.bailleur, i.budgetTotal, i.budgetConsomme, i.dateDebut, i.dateFin, i.statut, i.zoneGeographique]
      if (tab === 'beneficiaires') return [i.nom, i.sexe, i.age, i.telephone, i.adresse, projets.find(p => p.id === i.projetId)?.nom || '', i.type]
      if (tab === 'activites') return [projets.find(p => p.id === i.projetId)?.nom || '', i.description, i.date, i.beneficiairesCibles, i.resultats, i.statut]
      if (tab === 'partenaires') return [i.nom, i.type, i.contact, i.telephone, i.email, i.montantTotalFinance]
      return []
    })
    exportCSV(`ong_${tab}`, hdrs, rows)
  }

  const projetNom = (id) => projets.find(p => p.id === id)?.nom || '—'

  const renderProjets = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {currentItems.map(p => (
        <div key={p.id} className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold dark:text-white">{p.nom}</h3>
            <StatutBadge statut={p.statut} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{p.description}</p>
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>Bailleur: <span className="text-gray-600 dark:text-gray-300">{p.bailleur}</span></p>
            <p>Budget: {p.budgetTotal?.toLocaleString('fr-FR')} FCFA / Consommé: {p.budgetConsomme?.toLocaleString('fr-FR')} FCFA</p>
            <p>{p.dateDebut} → {p.dateFin}</p>
            <p>Zone: {p.zoneGeographique}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700 flex justify-end gap-1">
            <button onClick={() => openModal('projet', p)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => handleDelete('projet', p.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
      {currentItems.length === 0 && <div className="col-span-full text-center text-gray-400 dark:text-gray-500 py-8">Aucun projet trouvé</div>}
    </div>
  )

  const renderBeneficiaires = () => (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Sexe</th>
              <th className="px-4 py-3 font-medium">Âge</th>
              <th className="px-4 py-3 font-medium">Téléphone</th>
              <th className="px-4 py-3 font-medium">Projet</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(b => (
              <tr key={b.id} className="border-b border-gray-50 dark:border-dark-700">
                <td className="px-4 py-3 font-medium dark:text-gray-200">{b.nom}</td>
                <td className="px-4 py-3 dark:text-gray-300">{b.sexe}</td>
                <td className="px-4 py-3 dark:text-gray-300">{b.age}</td>
                <td className="px-4 py-3 dark:text-gray-300">{b.telephone}</td>
                <td className="px-4 py-3 dark:text-gray-300">{projetNom(b.projetId)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${b.type === 'direct' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'}`}>{b.type}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openModal('beneficiaire', b)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete('beneficiaire', b.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {currentItems.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucun bénéficiaire trouvé</p>}
    </div>
  )

  const renderActivites = () => (
    <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
              <th className="px-4 py-3 font-medium">Projet</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Bénéf. ciblés</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(a => (
              <tr key={a.id} className="border-b border-gray-50 dark:border-dark-700">
                <td className="px-4 py-3 dark:text-gray-200">{projetNom(a.projetId)}</td>
                <td className="px-4 py-3 dark:text-gray-300 max-w-[200px] truncate">{a.description}</td>
                <td className="px-4 py-3 dark:text-gray-300">{a.date}</td>
                <td className="px-4 py-3 dark:text-gray-300">{a.beneficiairesCibles}</td>
                <td className="px-4 py-3"><StatutBadge statut={a.statut} options={{ prevue: { label: 'Prévue', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' }, en_cours: { label: 'En cours', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' }, realisee: { label: 'Réalisée', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' } }} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openModal('activite', a)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete('activite', a.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {currentItems.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucune activité trouvée</p>}
    </div>
  )

  const renderPartenaires = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {currentItems.map(p => (
        <div key={p.id} className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold dark:text-white">{p.nom}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'bailleur' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : p.type === 'ONG' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : p.type === 'gouvernement' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>{p.type}</span>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>Contact: <span className="text-gray-600 dark:text-gray-300">{p.contact}</span></p>
            <p>Tél: {p.telephone}</p>
            <p>Email: {p.email}</p>
            <p>Montant financé: <span className="text-brand-600 dark:text-brand-400 font-medium">{p.montantTotalFinance?.toLocaleString('fr-FR')} FCFA</span></p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-700 flex justify-end gap-1">
            <button onClick={() => openModal('partenaire', p)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => handleDelete('partenaire', p.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
      {currentItems.length === 0 && <div className="col-span-full text-center text-gray-400 dark:text-gray-500 py-8">Aucun partenaire trouvé</div>}
    </div>
  )

  const renderBudget = () => {
    const selectedProjet = projets.find(p => p.id === budgetProjetId)
    const storedKey = `gestocom_budget_${budgetProjetId}`
    const stored = useMemo(() => {
      if (!budgetProjetId) return []
      try { return JSON.parse(localStorage.getItem(storedKey) || '[]') } catch { return [] }
    }, [budgetProjetId])

    const postes = budgetProjetId ? stored : []
    const totalPrevu = postes.reduce((s, p) => s + (p.prevu || 0), 0)
    const totalRealise = postes.reduce((s, p) => s + (p.realise || 0), 0)
    const ecart = totalPrevu - totalRealise
    const tauxExec = totalPrevu > 0 ? ((totalRealise / totalPrevu) * 100).toFixed(1) : 0

    return (
      <div>
        <div className="mb-6">
          <Field label="Sélectionner un projet">
            <select value={budgetProjetId} onChange={e => setBudgetProjetId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">Choisir un projet...</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </Field>
        </div>

        {budgetProjetId && selectedProjet && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Budget total projet</p>
                <p className="text-sm sm:text-lg font-bold text-brand-600 dark:text-brand-400 break-all">{selectedProjet.budgetTotal?.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Budget consommé</p>
                <p className="text-sm sm:text-lg font-bold text-amber-600 dark:text-amber-400 break-all">{selectedProjet.budgetConsomme?.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Taux d'exécution</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{tauxExec}%</p>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <h4 className="font-semibold dark:text-white">Postes budgétaires</h4>
                <span className="text-xs text-gray-400">{postes.length} poste{postes.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                      <th className="px-4 py-3 font-medium">Poste</th>
                      <th className="px-4 py-3 font-medium">Prévu (FCFA)</th>
                      <th className="px-4 py-3 font-medium">Réalisé (FCFA)</th>
                      <th className="px-4 py-3 font-medium">Écart</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postes.map((poste, idx) => {
                      const ecartP = (poste.prevu || 0) - (poste.realise || 0)
                      return (
                        <tr key={idx} className="border-b border-gray-50 dark:border-dark-700">
                          <td className="px-4 py-3 font-medium dark:text-gray-200">{poste.poste}</td>
                          <td className="px-4 py-3 dark:text-gray-300">{poste.prevu?.toLocaleString('fr-FR')}</td>
                          <td className="px-4 py-3 dark:text-gray-300">{poste.realise?.toLocaleString('fr-FR')}</td>
                          <td className={`px-4 py-3 ${ecartP < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{ecartP.toLocaleString('fr-FR')}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => { const newPostes = postes.filter((_, i) => i !== idx); localStorage.setItem(storedKey, JSON.stringify(newPostes)); refresh() }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-dark-700 font-medium">
                      <td className="px-4 py-3 dark:text-gray-200">Total</td>
                      <td className="px-4 py-3 dark:text-gray-200">{totalPrevu.toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 dark:text-gray-200">{totalRealise.toLocaleString('fr-FR')}</td>
                      <td className={`px-4 py-3 ${ecart < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{ecart.toLocaleString('fr-FR')}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {postes.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucun poste budgétaire</p>}
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h4 className="font-semibold dark:text-white mb-4">Ajouter un poste budgétaire</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Field label="Poste"><input value={budgetNewPoste.poste} onChange={e => setBudgetNewPoste({ ...budgetNewPoste, poste: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
                <Field label="Prévu (FCFA)"><input type="number" value={budgetNewPoste.prevu} onChange={e => setBudgetNewPoste({ ...budgetNewPoste, prevu: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
                <Field label="Réalisé (FCFA)"><input type="number" value={budgetNewPoste.realise} onChange={e => setBudgetNewPoste({ ...budgetNewPoste, realise: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
              </div>
              <button onClick={() => { if (!budgetNewPoste.poste) return; const newPostes = [...postes, { ...budgetNewPoste }]; localStorage.setItem(storedKey, JSON.stringify(newPostes)); setBudgetNewPoste({ ...emptyPoste }); refresh() }} className="btn-primary text-sm py-2 mt-4" disabled={!budgetNewPoste.poste}>Ajouter le poste</button>
            </div>
          </>
        )}

        {!budgetProjetId && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Sélectionnez un projet pour voir son budget</p>}
      </div>
    )
  }

  const renderRapports = () => {
    const handleGenerer = (type) => {
      if (type === 'financier') {
        const rows = projets.map(p => [p.nom, p.budgetTotal || 0, p.budgetConsomme || 0, ((p.budgetTotal > 0 ? ((p.budgetConsomme || 0) / p.budgetTotal) * 100 : 0)).toFixed(1) + '%', p.statut])
        exportCSV('rapport_financier_projets', ['Projet', 'Budget Total', 'Budget Consommé', 'Taux Exécution', 'Statut'], rows)
      } else if (type === 'narratif') {
        const rows = projets.map(p => [p.nom, p.description, p.dateDebut, p.dateFin, p.statut, p.zoneGeographique])
        exportCSV('rapport_narratif_projets', ['Projet', 'Description', 'Début', 'Fin', 'Statut', 'Zone'], rows)
      } else if (type === 'beneficiaires') {
        const rows = beneficiaires.map(b => [b.nom, b.sexe, b.age, b.telephone, b.adresse, projetNom(b.projetId), b.type])
        exportCSV('liste_beneficiaires', ['Nom', 'Sexe', 'Âge', 'Téléphone', 'Adresse', 'Projet', 'Type'], rows)
      } else if (type === 'tableau_bord') {
        const totalProjets = projets.length
        const actifs = projets.filter(p => p.statut === 'en_cours').length
        const totalBeneficiaires = beneficiaires.length
        const totalFinance = partenaires.reduce((s, p) => s + (p.montantTotalFinance || 0), 0)
        const totalBudget = projets.reduce((s, p) => s + (p.budgetTotal || 0), 0)
        const totalConsomme = projets.reduce((s, p) => s + (p.budgetConsomme || 0), 0)
        const rows = [['Indicateur', 'Valeur'], ['Total Projets', totalProjets], ['Projets en cours', actifs], ['Total Bénéficiaires', totalBeneficiaires], ['Financement total', totalFinance.toLocaleString('fr-FR') + ' FCFA'], ['Budget total', totalBudget.toLocaleString('fr-FR') + ' FCFA'], ['Budget consommé', totalConsomme.toLocaleString('fr-FR') + ' FCFA']]
        exportCSV('tableau_bord_ong', rows[0], rows.slice(1))
      }
    }

    const reports = [
      { key: 'financier', label: 'Rapport financier par projet', desc: 'Budget vs consommé pour chaque projet', icon: DollarSign },
      { key: 'narratif', label: 'Rapport narratif', desc: 'Descriptions et statuts des projets', icon: FileText },
      { key: 'beneficiaires', label: 'Liste des bénéficiaires', desc: 'Tous les bénéficiaires avec leurs projets', icon: Users },
      { key: 'tableau_bord', label: 'Tableau de bord ONG', desc: 'Indicateurs clés et statistiques', icon: FolderOpen },
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map(r => (
          <div key={r.key} className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <r.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h4 className="font-semibold dark:text-white">{r.label}</h4>
                <p className="text-xs text-gray-400 dark:text-gray-500">{r.desc}</p>
              </div>
            </div>
            <button onClick={() => handleGenerer(r.key)} className="btn-primary text-sm py-2 w-full">
              <Download className="w-4 h-4" /> Générer le rapport
            </button>
          </div>
        ))}
      </div>
    )
  }

  const tabContent = () => {
    switch (tab) {
      case 'projets': return renderProjets()
      case 'beneficiaires': return renderBeneficiaires()
      case 'activites': return renderActivites()
      case 'partenaires': return renderPartenaires()
      case 'budget': return renderBudget()
      case 'rapports': return renderRapports()
      default: return null
    }
  }

  const showSearch = tab !== 'budget' && tab !== 'rapports'
  const showExport = tab !== 'budget' && tab !== 'rapports'
  const showAdd = tab !== 'budget' && tab !== 'rapports'

  const entityMap = { projets: 'projet', beneficiaires: 'beneficiaire', activites: 'activite', partenaires: 'partenaire' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <HandHeart className="w-6 h-6 text-brand-500" /> ONG & Associations
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = tab === t.key
          return (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setPage(1) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {showSearch && (
          <SearchInput value={search} onChange={handleSearchChange} placeholder={`Rechercher dans ${tab}...`} className="flex-1 min-w-0 max-w-xs" />
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">{totalFiltered} élément{totalFiltered !== 1 ? 's' : ''}</span>
        <div className="flex gap-2 ml-auto">
          {showExport && (
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
              <Download className="w-3.5 h-3.5" /> Exporter CSV
            </button>
          )}
          {showAdd && (
            <button onClick={() => openModal(entityMap[tab])} className="btn-primary text-sm py-1.5">
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          )}
        </div>
      </div>

      {tabContent()}

      {showSearch && totalFiltered > perPage && (
        <Pagination currentPage={page} totalPages={Math.ceil(totalFiltered / perPage)} onPageChange={setPage} />
      )}

      <Modal open={modal === 'projet'} onClose={closeModal} title={editId ? 'Modifier le projet' : 'Nouveau projet'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom"><input value={form?.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
            <Field label="Bailleur"><input value={form?.bailleur || ''} onChange={e => setForm({ ...form, bailleur: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          </div>
          <Field label="Description"><textarea value={form?.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget total (FCFA)"><input type="number" value={form?.budgetTotal || 0} onChange={e => setForm({ ...form, budgetTotal: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
            <Field label="Budget consommé (FCFA)"><input type="number" value={form?.budgetConsomme || 0} onChange={e => setForm({ ...form, budgetConsomme: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date début"><input type="date" value={form?.dateDebut || ''} onChange={e => setForm({ ...form, dateDebut: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
            <Field label="Date fin"><input type="date" value={form?.dateFin || ''} onChange={e => setForm({ ...form, dateFin: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Statut">
              <select value={form?.statut || 'planifie'} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
              </select>
            </Field>
            <Field label="Zone géographique"><input value={form?.zoneGeographique || ''} onChange={e => setForm({ ...form, zoneGeographique: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeModal} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form?.nom}>Enregistrer</button>
        </div>
      </Modal>

      <Modal open={modal === 'beneficiaire'} onClose={closeModal} title={editId ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom"><input value={form?.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
            <Field label="Âge"><input type="number" value={form?.age || ''} onChange={e => setForm({ ...form, age: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sexe">
              <select value={form?.sexe || ''} onChange={e => setForm({ ...form, sexe: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                <option value="">Sélectionner...</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </Field>
            <Field label="Type">
              <select value={form?.type || 'direct'} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                <option value="direct">Direct</option>
                <option value="indirect">Indirect</option>
              </select>
            </Field>
          </div>
          <Field label="Téléphone"><input value={form?.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          <Field label="Adresse"><input value={form?.adresse || ''} onChange={e => setForm({ ...form, adresse: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          <Field label="Projet rattaché">
            <select value={form?.projetId || ''} onChange={e => setForm({ ...form, projetId: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">Aucun projet</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeModal} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form?.nom}>Enregistrer</button>
        </div>
      </Modal>

      <Modal open={modal === 'activite'} onClose={closeModal} title={editId ? "Modifier l'activité" : 'Nouvelle activité'}>
        <div className="space-y-4">
          <Field label="Projet">
            <select value={form?.projetId || ''} onChange={e => setForm({ ...form, projetId: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">Sélectionner un projet...</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          </Field>
          <Field label="Description"><textarea value={form?.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date"><input type="date" value={form?.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
            <Field label="Bénéficiaires ciblés"><input type="number" value={form?.beneficiairesCibles || 0} onChange={e => setForm({ ...form, beneficiairesCibles: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          </div>
          <Field label="Résultats"><textarea value={form?.resultats || ''} onChange={e => setForm({ ...form, resultats: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          <Field label="Statut">
            <select value={form?.statut || 'prevue'} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="prevue">Prévue</option>
              <option value="en_cours">En cours</option>
              <option value="realisee">Réalisée</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeModal} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form?.projetId || !form?.description}>Enregistrer</button>
        </div>
      </Modal>

      <Modal open={modal === 'partenaire'} onClose={closeModal} title={editId ? 'Modifier le partenaire' : 'Nouveau partenaire'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom"><input value={form?.nom || ''} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
            <Field label="Type">
              <select value={form?.type || 'bailleur'} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                <option value="bailleur">Bailleur</option>
                <option value="ONG">ONG</option>
                <option value="gouvernement">Gouvernement</option>
                <option value="prive">Privé</option>
              </select>
            </Field>
          </div>
          <Field label="Contact"><input value={form?.contact || ''} onChange={e => setForm({ ...form, contact: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Téléphone"><input value={form?.telephone || ''} onChange={e => setForm({ ...form, telephone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
            <Field label="Email"><input type="email" value={form?.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
          </div>
          <Field label="Montant total financé (FCFA)"><input type="number" value={form?.montantTotalFinance || 0} onChange={e => setForm({ ...form, montantTotalFinance: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={closeModal} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form?.nom}>Enregistrer</button>
        </div>
      </Modal>
    </div>
  )
}
