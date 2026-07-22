import { useState, useMemo } from 'react'
import { Heart, Pill, User, FileText, Receipt, BarChart3, Plus, Edit2, Trash2, X, Download, AlertTriangle, Activity } from 'lucide-react'
import { sanitize } from '../lib/db'
import { exportCSV } from '../lib/exportCSV'
import SearchInput from '../components/SearchInput'
import Pagination from '../components/Pagination'

const DB_PREFIX = 'gestocom_'
function getKey(name) { return DB_PREFIX + name }
function getAll(name) { try { return JSON.parse(localStorage.getItem(getKey(name)) || '[]') } catch { return [] } }
function setAll(name, data) { localStorage.setItem(getKey(name), JSON.stringify(data)) }
function nextId(items) { return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1 }

function s(str) { return sanitize(str) }

const TABS = [
  { key: 'medicaments', label: 'Médicaments', icon: Pill },
  { key: 'patients', label: 'Patients', icon: User },
  { key: 'ordonnances', label: 'Ordonnances', icon: FileText },
  { key: 'facturation', label: 'Facturation', icon: Receipt },
  { key: 'consommation', label: 'Consommation', icon: BarChart3 },
]

const FORMES = ['Comprimé', 'Gélule', 'Sirop', 'Injection', 'Crème', 'Pommade', 'Suppositoire', 'Goutte', 'Poudre', 'Autre']
const DOSAGES = ['50mg', '100mg', '200mg', '250mg', '500mg', '750mg', '1g', 'Autre']
const GROUPES_SANGUINS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const STATUTS_ORDO = ['active', 'terminée']
const STATUTS_FACT = ['payée', 'partielle', 'impayée']

function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR') }
function formatMontant(n) { return (n || 0).toLocaleString('fr-FR') + ' FCFA' }

const emptyMed = { nom: '', principeActif: '', forme: 'Comprimé', dosage: '500mg', stock: 0, seuilAlerte: 10, prixAchat: 0, prixVente: 0, datePeremption: '', fournisseur: '' }
const emptyPatient = { nom: '', telephone: '', dateNaissance: '', groupeSanguin: 'O+', allergies: '', antecedents: '' }
const emptyOrdo = { patientId: '', medecin: '', date: new Date().toISOString().slice(0, 10), lignes: [{ medicamentId: '', posologie: '', duree: '' }], statut: 'active' }
const emptyFact = { ordonnanceId: '', montant: 0, assuranceTontine: 0, restePatient: 0, statut: 'impayée', date: new Date().toISOString().slice(0, 10) }

export default function SantePage() {
  const [tab, setTab] = useState('medicaments')
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" /> Santé & Pharmacies
        </h1>
      </div>

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

      {tab === 'medicaments' && <MedicamentsTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'patients' && <PatientsTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'ordonnances' && <OrdonnancesTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'facturation' && <FacturationTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'consommation' && <ConsommationTab />}
    </div>
  )
}

function MedicamentsTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const items = useMemo(() => {
    let list = getAll('sante_medicaments')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(m => m.nom?.toLowerCase().includes(q) || m.principeActif?.toLowerCase().includes(q) || m.fournisseur?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
  }, [search, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('sante_medicaments')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form, nom: s(form.nom), principeActif: s(form.principeActif), fournisseur: s(form.fournisseur) }
    } else {
      form.id = nextId(list)
      list.push({ ...form, nom: s(form.nom), principeActif: s(form.principeActif), fournisseur: s(form.fournisseur) })
    }
    setAll('sante_medicaments', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce médicament ?')) return
    setAll('sante_medicaments', getAll('sante_medicaments').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('medicaments', ['ID', 'Nom', 'Principe actif', 'Forme', 'Dosage', 'Stock', 'Seuil alerte', 'Prix achat', 'Prix vente', 'Date péremption', 'Fournisseur'],
      items.map(m => [m.id, m.nom, m.principeActif, m.forme, m.dosage, m.stock, m.seuilAlerte, m.prixAchat, m.prixVente, m.datePeremption, m.fournisseur]))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher un médicament..." /></div>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyMed })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Principe actif</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Forme</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Dosage</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Stock</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Seuil</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Prix achat</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Prix vente</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Péremption</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Fournisseur</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(m => (
                <tr key={m.id} className={`border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50 ${m.stock <= m.seuilAlerte ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-3 font-medium dark:text-gray-200">{m.nom}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.principeActif}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">{m.forme}</span></td>
                  <td className="px-4 py-3 dark:text-gray-300">{m.dosage}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={m.stock <= m.seuilAlerte ? 'text-red-600 dark:text-red-400 font-bold' : 'dark:text-gray-300'}>{m.stock}</span>
                  </td>
                  <td className="px-4 py-3 text-right dark:text-gray-300">{m.seuilAlerte}</td>
                  <td className="px-4 py-3 text-right font-mono dark:text-gray-300">{formatMontant(m.prixAchat)}</td>
                  <td className="px-4 py-3 text-right font-mono dark:text-gray-300">{formatMontant(m.prixVente)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.datePeremption || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{m.fournisseur}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setForm({ ...m })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search ? 'Aucun médicament ne correspond à la recherche' : 'Aucun médicament enregistré'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Ajouter'} un médicament</h2>
              <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom du médicament *</label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Principe actif</label>
                  <input value={form.principeActif} onChange={e => setForm({ ...form, principeActif: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Forme</label>
                  <select value={form.forme} onChange={e => setForm({ ...form, forme: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {FORMES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Dosage</label>
                  <select value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {DOSAGES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Stock</label>
                  <input type="number" min={0} value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Seuil d'alerte</label>
                  <input type="number" min={0} value={form.seuilAlerte} onChange={e => setForm({ ...form, seuilAlerte: +e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prix achat (FCFA)</label>
                  <input type="number" min={0} value={form.prixAchat} onChange={e => setForm({ ...form, prixAchat: +e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prix vente (FCFA)</label>
                  <input type="number" min={0} value={form.prixVente} onChange={e => setForm({ ...form, prixVente: +e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date de péremption</label>
                  <input type="date" value={form.datePeremption} onChange={e => setForm({ ...form, datePeremption: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fournisseur</label>
                  <input value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.nom} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PatientsTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const items = useMemo(() => {
    let list = getAll('sante_patients')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.nom?.toLowerCase().includes(q) || p.telephone?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
  }, [search, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('sante_patients')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form, nom: s(form.nom), telephone: s(form.telephone), allergies: s(form.allergies), antecedents: s(form.antecedents) }
    } else {
      form.id = nextId(list)
      list.push({ ...form, nom: s(form.nom), telephone: s(form.telephone), allergies: s(form.allergies), antecedents: s(form.antecedents) })
    }
    setAll('sante_patients', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce patient ?')) return
    setAll('sante_patients', getAll('sante_patients').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('patients', ['ID', 'Nom', 'Téléphone', 'Date naissance', 'Groupe sanguin', 'Allergies', 'Antécédents'],
      items.map(p => [p.id, p.nom, p.telephone, p.dateNaissance, p.groupeSanguin, p.allergies, p.antecedents]))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher un patient..." /></div>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyPatient })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Téléphone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date naissance</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Groupe sanguin</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Allergies</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Antécédents</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(p => (
                <tr key={p.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                  <td className="px-4 py-3 font-medium dark:text-gray-200">{p.nom}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.telephone}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(p.dateNaissance)}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-semibold">{p.groupeSanguin}</span></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={p.allergies}>{p.allergies || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={p.antecedents}>{p.antecedents || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setForm({ ...p })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search ? 'Aucun patient ne correspond à la recherche' : 'Aucun patient enregistré'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Ajouter'} un patient</h2>
              <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nom complet *</label>
                <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Nom et prénom" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="+225 XX XX XX XX XX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date de naissance</label>
                  <input type="date" value={form.dateNaissance} onChange={e => setForm({ ...form, dateNaissance: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Groupe sanguin</label>
                <select value={form.groupeSanguin} onChange={e => setForm({ ...form, groupeSanguin: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                  {GROUPES_SANGUINS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Allergies</label>
                <textarea value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Liste des allergies connues..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Antécédents médicaux</label>
                <textarea value={form.antecedents} onChange={e => setForm({ ...form, antecedents: e.target.value })} rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Antécédents médicaux..." />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.nom} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrdonnancesTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20
  const patients = getAll('sante_patients')
  const medicaments = getAll('sante_medicaments')

  const items = useMemo(() => {
    let list = getAll('sante_ordonnances')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(o => {
        const patient = patients.find(p => p.id === +o.patientId)
        return (patient?.nom || '').toLowerCase().includes(q) || o.medecin?.toLowerCase().includes(q)
      })
    }
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [search, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('sante_ordonnances')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form, medecin: s(form.medecin) }
    } else {
      form.id = nextId(list)
      list.push({ ...form, medecin: s(form.medecin) })
    }
    setAll('sante_ordonnances', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette ordonnance ?')) return
    setAll('sante_ordonnances', getAll('sante_ordonnances').filter(i => i.id !== id))
    refresh()
  }

  const toggleStatut = (ordo) => {
    const list = getAll('sante_ordonnances')
    const idx = list.findIndex(i => i.id === ordo.id)
    if (idx !== -1) {
      list[idx].statut = list[idx].statut === 'active' ? 'terminée' : 'active'
      setAll('sante_ordonnances', list)
      refresh()
    }
  }

  const handleExport = () => {
    exportCSV('ordonnances', ['ID', 'Patient', 'Médecin', 'Date', 'Statut', 'Nb médicaments'],
      items.map(o => {
        const patient = patients.find(p => p.id === +o.patientId)
        return [o.id, patient?.nom || '', o.medecin, o.date, o.statut, o.lignes?.length || 0]
      }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher une ordonnance..." /></div>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyOrdo, lignes: [{ medicamentId: '', posologie: '', duree: '' }] })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvelle ordonnance</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Patient</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Médecin</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Médicaments</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(o => {
                const patient = patients.find(p => p.id === +o.patientId)
                return (
                  <tr key={o.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                    <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">#{o.id}</td>
                    <td className="px-4 py-3 font-medium dark:text-gray-200">{patient?.nom || 'Inconnu'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{o.medecin}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(o.date)}</td>
                    <td className="px-4 py-3 text-center">{o.lignes?.length || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleStatut(o)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${o.statut === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'}`}>
                        {o.statut}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setForm({ ...o })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search ? 'Aucune ordonnance ne correspond à la recherche' : 'Aucune ordonnance enregistrée'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      {form && (
        <OrdonnanceModal form={form} setForm={setForm} onSave={handleSave} patients={patients} medicaments={medicaments} />
      )}
    </div>
  )
}

function OrdonnanceModal({ form, setForm, onSave, patients, medicaments }) {
  const updateLigne = (idx, field, value) => {
    const newLignes = [...form.lignes]
    newLignes[idx] = { ...newLignes[idx], [field]: value }
    setForm({ ...form, lignes: newLignes })
  }
  const addLigne = () => setForm({ ...form, lignes: [...form.lignes, { medicamentId: '', posologie: '', duree: '' }] })
  const removeLigne = (idx) => setForm({ ...form, lignes: form.lignes.filter((_, i) => i !== idx) })

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
          <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Nouvelle'} ordonnance</h2>
          <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Patient *</label>
              <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                <option value="">Sélectionner un patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Médecin *</label>
              <input value={form.medecin} onChange={e => setForm({ ...form, medecin: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Dr. ..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                {STATUTS_ORDO.map(s => <option key={s} value={s}>{s === 'active' ? 'Active' : 'Terminée'}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold dark:text-white">Lignes de prescription</h3>
              <button onClick={addLigne} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {form.lignes.map((ligne, idx) => (
                <div key={idx} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                  <div className="col-span-2 sm:col-span-5">
                    <select value={ligne.medicamentId} onChange={e => updateLigne(idx, 'medicamentId', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                      <option value="">Médicament</option>
                      {medicaments.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.dosage})</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <input type="text" value={ligne.posologie} placeholder="Posologie" onChange={e => updateLigne(idx, 'posologie', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <input type="text" value={ligne.duree} placeholder="Durée" onChange={e => updateLigne(idx, 'duree', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                  </div>
                  <div className="col-span-1 sm:col-span-1 flex justify-center">
                    {form.lignes.length > 1 && (
                      <button onClick={() => removeLigne(idx)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
          <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
          <button onClick={onSave} disabled={!form.patientId || !form.medecin} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
        </div>
      </div>
    </div>
  )
}

function FacturationTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20
  const patients = getAll('sante_patients')
  const ordonnances = getAll('sante_ordonnances')
  const medicaments = getAll('sante_medicaments')

  const items = useMemo(() => {
    let list = getAll('sante_facturations')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(f => {
        const ordo = ordonnances.find(o => o.id === +f.ordonnanceId)
        const patient = patients.find(p => p.id === ordo?.patientId)
        return (patient?.nom || '').toLowerCase().includes(q) || f.statut?.toLowerCase().includes(q)
      })
    }
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [search, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('sante_facturations')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form }
    } else {
      form.id = nextId(list)
      list.push({ ...form })
    }
    setAll('sante_facturations', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette facturation ?')) return
    setAll('sante_facturations', getAll('sante_facturations').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('facturations', ['ID', 'Ordonnance', 'Patient', 'Montant', 'Assurance Tontine', 'Reste patient', 'Statut', 'Date'],
      items.map(f => {
        const ordo = ordonnances.find(o => o.id === +f.ordonnanceId)
        const patient = patients.find(p => p.id === ordo?.patientId)
        return [f.id, f.ordonnanceId, patient?.nom || '', f.montant, f.assuranceTontine, f.restePatient, f.statut, f.date]
      }))
  }

  const totalMontant = items.reduce((s, f) => s + (f.montant || 0), 0)
  const totalTontine = items.reduce((s, f) => s + (f.assuranceTontine || 0), 0)
  const totalReste = items.reduce((s, f) => s + (f.restePatient || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total facturé</p>
          <p className="text-lg font-bold font-mono dark:text-white">{formatMontant(totalMontant)}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Assurance Tontine payée</p>
          <p className="text-lg font-bold font-mono text-green-600 dark:text-green-400">{formatMontant(totalTontine)}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Reste à charge patient</p>
          <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{formatMontant(totalReste)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher une facturation..." /></div>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyFact })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvelle facturation</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Ordonnance</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Montant</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Tontine</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Reste patient</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(f => (
                <tr key={f.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                  <td className="px-4 py-3 font-mono text-xs text-brand-600 dark:text-brand-400">#{f.id}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Ordo #{f.ordonnanceId}</td>
                  <td className="px-4 py-3 text-right font-mono dark:text-gray-300">{formatMontant(f.montant)}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-600 dark:text-green-400">{formatMontant(f.assuranceTontine)}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">{formatMontant(f.restePatient)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      f.statut === 'payée' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      f.statut === 'partielle' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>{f.statut}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(f.date)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setForm({ ...f })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search ? 'Aucune facturation ne correspond à la recherche' : 'Aucune facturation enregistrée'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Nouvelle'} facturation</h2>
              <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ordonnance *</label>
                <select value={form.ordonnanceId} onChange={e => {
                  const ordo = ordonnances.find(o => o.id === +e.target.value)
                  const montantEstime = (ordo?.lignes || []).reduce((s, l) => {
                    const med = medicaments.find(m => m.id === +l.medicamentId)
                    return s + (med?.prixVente || 0)
                  }, 0)
                  setForm({ ...form, ordonnanceId: e.target.value, montant: montantEstime, restePatient: montantEstime - (form.assuranceTontine || 0) })
                }} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                  <option value="">Sélectionner une ordonnance</option>
                  {ordonnances.map(o => {
                    const patient = patients.find(p => p.id === +o.patientId)
                    return <option key={o.id} value={o.id}>#{o.id} — {patient?.nom || 'Inconnu'} ({o.date})</option>
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Montant total (FCFA)</label>
                  <input type="number" min={0} value={form.montant} onChange={e => setForm({ ...form, montant: +e.target.value, restePatient: +e.target.value - (form.assuranceTontine || 0) })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Assurance Tontine (FCFA)</label>
                  <input type="number" min={0} value={form.assuranceTontine} onChange={e => setForm({ ...form, assuranceTontine: +e.target.value, restePatient: (form.montant || 0) - +e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reste à charge patient (FCFA)</label>
                <input type="number" min={0} value={form.restePatient} onChange={e => setForm({ ...form, restePatient: +e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {STATUTS_FACT.map(st => <option key={st} value={st}>{st === 'payée' ? 'Payée' : st === 'partielle' ? 'Partielle' : 'Impayée'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.ordonnanceId} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConsommationTab() {
  const medicaments = getAll('sante_medicaments')
  const facturations = getAll('sante_facturations')
  const ordonnances = getAll('sante_ordonnances')

  const topVendus = useMemo(() => {
    const countMap = {}
    ordonnances.forEach(o => {
      (o.lignes || []).forEach(l => {
        if (!l.medicamentId) return
        const med = medicaments.find(m => m.id === +l.medicamentId)
        if (!med) return
        if (!countMap[med.id]) countMap[med.id] = { nom: med.nom, forme: med.forme, total: 0 }
        countMap[med.id].total += 1
      })
    })
    return Object.values(countMap).sort((a, b) => b.total - a.total)
  }, [ordonnances])

  const stockParForme = useMemo(() => {
    const map = {}
    medicaments.forEach(m => {
      if (!map[m.forme]) map[m.forme] = { forme: m.forme, stock: 0, count: 0 }
      map[m.forme].stock += m.stock || 0
      map[m.forme].count += 1
    })
    return Object.values(map).sort((a, b) => b.stock - a.stock)
  }, [medicaments])

  const alertesPeremption = useMemo(() => {
    const now = new Date()
    const soon = new Date()
    soon.setDate(soon.getDate() + 30)
    return medicaments.filter(m => {
      if (!m.datePeremption) return false
      const exp = new Date(m.datePeremption)
      return exp <= soon
    }).sort((a, b) => new Date(a.datePeremption) - new Date(b.datePeremption))
  }, [medicaments])

  const alertesStock = medicaments.filter(m => m.stock <= m.seuilAlerte)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <div className="flex items-center gap-2 mb-2"><Pill className="w-5 h-5 text-brand-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Total médicaments</span></div>
          <p className="text-2xl font-bold dark:text-white">{medicaments.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-5 h-5 text-green-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Stock total</span></div>
          <p className="text-2xl font-bold dark:text-white">{medicaments.reduce((s, m) => s + (m.stock || 0), 0)}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-amber-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Alertes stock</span></div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{alertesStock.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <div className="flex items-center gap-2 mb-2"><Activity className="w-5 h-5 text-red-500" /><span className="text-xs text-gray-500 dark:text-gray-400">Péremption ≤ 30j</span></div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{alertesPeremption.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2"><Pill className="w-5 h-5 text-brand-500" /> Médicaments les plus prescrits</h3>
          {topVendus.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucune donnée de prescription</p>
          ) : (
            <div className="space-y-2">
              {topVendus.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-800 last:border-0">
                  <div>
                    <span className="text-sm font-medium dark:text-gray-200">{m.nom}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{m.forme}</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">{m.total}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
          <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-green-500" /> Stock par catégorie</h3>
          {stockParForme.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucun médicament enregistré</p>
          ) : (
            <div className="space-y-3">
              {stockParForme.map((c, i) => {
                const maxStock = Math.max(...stockParForme.map(x => x.stock), 1)
                const pct = (c.stock / maxStock) * 100
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium dark:text-gray-200">{c.forme} ({c.count})</span>
                      <span className="font-mono dark:text-gray-300">{c.stock}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-2">
                      <div className="bg-brand-500 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {alertesPeremption.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-red-200 dark:border-red-800/50 p-6">
          <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Alertes de péremption</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Médicament</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Forme</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Dosage</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Date péremption</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Stock</th>
                </tr>
              </thead>
              <tbody>
                {alertesPeremption.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 dark:border-dark-800 bg-red-50/50 dark:bg-red-900/5">
                    <td className="px-4 py-2 font-medium dark:text-gray-200">{m.nom}</td>
                    <td className="px-4 py-2 dark:text-gray-300">{m.forme}</td>
                    <td className="px-4 py-2 dark:text-gray-300">{m.dosage}</td>
                    <td className="px-4 py-2 font-mono text-red-600 dark:text-red-400">{m.datePeremption}</td>
                    <td className="px-4 py-2 text-right dark:text-gray-300">{m.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {alertesStock.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-amber-200 dark:border-amber-800/50 p-6">
          <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Alertes de stock bas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Médicament</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Stock actuel</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Seuil</th>
                </tr>
              </thead>
              <tbody>
                {alertesStock.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 dark:border-dark-800 bg-amber-50/50 dark:bg-amber-900/5">
                    <td className="px-4 py-2 font-medium dark:text-gray-200">{m.nom}</td>
                    <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400 font-bold">{m.stock}</td>
                    <td className="px-4 py-2 text-right font-mono dark:text-gray-300">{m.seuilAlerte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
