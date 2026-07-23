import { useState, useMemo } from 'react'
import { GraduationCap, Users, FileText, Calendar, BookOpen, BarChart3, Plus, Edit2, Trash2, X, Download, AlertTriangle } from 'lucide-react'
import { sanitize, getAll, setAll, nextId } from '../lib/db'
import { exportCSV } from '../lib/exportCSV'
import SearchInput from '../components/SearchInput'
import Pagination from '../components/Pagination'

function s(str) { return sanitize(str) }

const TABS = [
  { key: 'inscriptions', label: 'Inscriptions', icon: FileText },
  { key: 'eleves', label: 'Élèves', icon: Users },
  { key: 'notes', label: 'Notes & Bulletins', icon: BookOpen },
  { key: 'emploi', label: 'Emplois du temps', icon: Calendar },
  { key: 'enseignants', label: 'Enseignants', icon: GraduationCap },
  { key: 'rapports', label: 'Rapports', icon: BarChart3 },
]

const CLASSES = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale']
const STATUTS_INSCR = ['active', 'terminée', 'suspendue']
const SEXES = ['M', 'F']
const TRIMESTRES = ['1er trimestre', '2ème trimestre', '3ème trimestre']
const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR') }
function formatMontant(n) { return (n || 0).toLocaleString('fr-FR') + ' FCFA' }

const emptyInscription = { eleveId: '', classe: 'CP1', anneeScolaire: '2025-2026', fraisInscription: 0, statut: 'active', date: new Date().toISOString().slice(0, 10) }
const emptyEleve = { nom: '', prenom: '', telephoneParent: '', dateNaissance: '', sexe: 'M', classe: 'CP1' }
const emptyNote = { eleveId: '', matiere: '', note: '', appreciation: '', trimestre: '1er trimestre', anneeScolaire: '2025-2026' }
const emptyEmploi = { jour: 'Lundi', heureDebut: '08:00', heureFin: '09:00', matiere: '', enseignantId: '', classe: 'CP1' }
const emptyEnseignant = { nom: '', telephone: '', specialite: '', qualification: '', statut: 'actif' }

export default function EducationPage() {
  const [tab, setTab] = useState('inscriptions')
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-purple-500" /> Éducation & Formation
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

      {tab === 'inscriptions' && <InscriptionsTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'eleves' && <ElevesTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'notes' && <NotesTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'emploi' && <EmploiTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'enseignants' && <EnseignantsTab refreshKey={refreshKey} refresh={refresh} />}
      {tab === 'rapports' && <RapportsTab />}
    </div>
  )
}

function InscriptionsTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20
  const eleves = getAll('edu_eleves')

  const items = useMemo(() => {
    let list = getAll('edu_inscriptions')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i => {
        const eleve = eleves.find(e => e.id === +i.eleveId)
        return (eleve?.nom || '').toLowerCase().includes(q) || (eleve?.prenom || '').toLowerCase().includes(q) || i.classe?.toLowerCase().includes(q) || i.anneeScolaire?.toLowerCase().includes(q)
      })
    }
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [search, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('edu_inscriptions')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form }
    } else {
      form.id = nextId(list)
      list.push({ ...form })
    }
    setAll('edu_inscriptions', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette inscription ?')) return
    setAll('edu_inscriptions', getAll('edu_inscriptions').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('inscriptions', ['ID', 'Élève', 'Classe', 'Année scolaire', 'Frais inscription', 'Statut', 'Date'],
      items.map(i => {
        const eleve = eleves.find(e => e.id === +i.eleveId)
        return [i.id, eleve ? `${eleve.nom} ${eleve.prenom}` : '', i.classe, i.anneeScolaire, i.fraisInscription, i.statut, i.date]
      }))
  }

  const totalFrais = items.filter(i => i.statut === 'active').reduce((s, i) => s + (i.fraisInscription || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Inscriptions actives</p>
          <p className="text-2xl font-bold dark:text-white">{items.filter(i => i.statut === 'active').length}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total inscriptions</p>
          <p className="text-2xl font-bold dark:text-white">{items.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Frais collectés (actives)</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatMontant(totalFrais)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher une inscription..." /></div>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyInscription })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvelle inscription</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Élève</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Classe</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Année scolaire</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Frais</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(i => {
                const eleve = eleves.find(e => e.id === +i.eleveId)
                return (
                  <tr key={i.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                    <td className="px-4 py-3 font-medium dark:text-gray-200">{eleve ? `${eleve.nom} ${eleve.prenom}` : 'Inconnu'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">{i.classe}</span></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{i.anneeScolaire}</td>
                    <td className="px-4 py-3 text-right font-mono dark:text-gray-300">{formatMontant(i.fraisInscription)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        i.statut === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        i.statut === 'suspendue' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                        'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                      }`}>{i.statut}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setForm({ ...i })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search ? 'Aucune inscription ne correspond à la recherche' : 'Aucune inscription enregistrée'}</td></tr>
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
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Nouvelle'} inscription</h2>
              <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Élève *</label>
                <select value={form.eleveId} onChange={e => setForm({ ...form, eleveId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                  <option value="">Sélectionner un élève</option>
                  {eleves.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Classe *</label>
                  <select value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Année scolaire</label>
                  <input value={form.anneeScolaire} onChange={e => setForm({ ...form, anneeScolaire: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="2025-2026" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Frais d'inscription (FCFA)</label>
                  <input type="number" min={0} value={form.fraisInscription} onChange={e => setForm({ ...form, fraisInscription: +e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {STATUTS_INSCR.map(st => <option key={st} value={st}>{st === 'active' ? 'Active' : st === 'suspendue' ? 'Suspendue' : 'Terminée'}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.eleveId} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ElevesTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const items = useMemo(() => {
    let list = getAll('edu_eleves')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e => e.nom?.toLowerCase().includes(q) || e.prenom?.toLowerCase().includes(q) || e.telephoneParent?.toLowerCase().includes(q) || e.classe?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
  }, [search, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('edu_eleves')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form, nom: s(form.nom), prenom: s(form.prenom), telephoneParent: s(form.telephoneParent) }
    } else {
      form.id = nextId(list)
      list.push({ ...form, nom: s(form.nom), prenom: s(form.prenom), telephoneParent: s(form.telephoneParent) })
    }
    setAll('edu_eleves', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cet élève ?')) return
    setAll('edu_eleves', getAll('edu_eleves').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('eleves', ['ID', 'Nom', 'Prénom', 'Téléphone parent', 'Date naissance', 'Sexe', 'Classe'],
      items.map(e => [e.id, e.nom, e.prenom, e.telephoneParent, e.dateNaissance, e.sexe, e.classe]))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher un élève..." /></div>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyEleve })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Prénom</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Tél. parent</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date naissance</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Sexe</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Classe</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(e => (
                <tr key={e.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                  <td className="px-4 py-3 font-medium dark:text-gray-200">{e.nom}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{e.prenom}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.telephoneParent}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(e.dateNaissance)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${e.sexe === 'M' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'}`}>{e.sexe}</span>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">{e.classe}</span></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setForm({ ...e })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search ? 'Aucun élève ne correspond à la recherche' : 'Aucun élève enregistré'}</td></tr>
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
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Ajouter'} un élève</h2>
              <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nom *</label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prénom *</label>
                  <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone du parent</label>
                <input value={form.telephoneParent} onChange={e => setForm({ ...form, telephoneParent: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="+225 XX XX XX XX XX" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date naissance</label>
                  <input type="date" value={form.dateNaissance} onChange={e => setForm({ ...form, dateNaissance: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sexe</label>
                  <select value={form.sexe} onChange={e => setForm({ ...form, sexe: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {SEXES.map(s => <option key={s} value={s}>{s === 'M' ? 'Masculin' : 'Féminin'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Classe</label>
                  <select value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.nom || !form.prenom} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NotesTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filterClasse, setFilterClasse] = useState('all')
  const [filterTrimestre, setFilterTrimestre] = useState('all')
  const perPage = 20
  const eleves = getAll('edu_eleves')

  const items = useMemo(() => {
    let list = getAll('edu_notes')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(n => {
        const eleve = eleves.find(e => e.id === +n.eleveId)
        return (eleve?.nom || '').toLowerCase().includes(q) || (eleve?.prenom || '').toLowerCase().includes(q) || n.matiere?.toLowerCase().includes(q)
      })
    }
    if (filterClasse !== 'all') {
      list = list.filter(n => {
        const eleve = eleves.find(e => e.id === +n.eleveId)
        return eleve?.classe === filterClasse
      })
    }
    if (filterTrimestre !== 'all') list = list.filter(n => n.trimestre === filterTrimestre)
    return list.sort((a, b) => (a.matiere || '').localeCompare(b.matiere || ''))
  }, [search, filterClasse, filterTrimestre, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('edu_notes')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form, note: +form.note, appreciation: s(form.appreciation) }
    } else {
      form.id = nextId(list)
      list.push({ ...form, note: +form.note, appreciation: s(form.appreciation) })
    }
    setAll('edu_notes', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cette note ?')) return
    setAll('edu_notes', getAll('edu_notes').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('notes', ['ID', 'Élève', 'Matière', 'Note /20', 'Appréciation', 'Trimestre', 'Année scolaire'],
      items.map(n => {
        const eleve = eleves.find(e => e.id === +n.eleveId)
        return [n.id, eleve ? `${eleve.nom} ${eleve.prenom}` : '', n.matiere, n.note, n.appreciation, n.trimestre, n.anneeScolaire]
      }))
  }

  const getNoteColor = (note) => {
    if (note >= 16) return 'text-green-600 dark:text-green-400'
    if (note >= 12) return 'text-blue-600 dark:text-blue-400'
    if (note >= 10) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher une note..." /></div>
        <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-700 dark:text-white">
          <option value="all">Toutes les classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterTrimestre} onChange={e => setFilterTrimestre(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-700 dark:text-white">
          <option value="all">Tous trimestres</option>
          {TRIMESTRES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyNote })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Élève</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Matière</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Note /20</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Appréciation</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Trimestre</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(n => {
                const eleve = eleves.find(e => e.id === +n.eleveId)
                return (
                  <tr key={n.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                    <td className="px-4 py-3 font-medium dark:text-gray-200">{eleve ? `${eleve.nom} ${eleve.prenom}` : 'Inconnu'}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{n.matiere}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold font-mono text-lg ${getNoteColor(n.note)}`}>{n.note}/20</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={n.appreciation}>{n.appreciation || '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-xs">{n.trimestre}</span></td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setForm({ ...n })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search || filterClasse !== 'all' || filterTrimestre !== 'all' ? 'Aucune note ne correspond aux filtres' : 'Aucune note enregistrée'}</td></tr>
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
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Ajouter'} une note</h2>
              <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Élève *</label>
                <select value={form.eleveId} onChange={e => setForm({ ...form, eleveId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                  <option value="">Sélectionner un élève</option>
                  {eleves.map(e => <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.classe})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Matière *</label>
                  <input value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Ex: Mathématiques" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Note /20 *</label>
                  <input type="number" min={0} max={20} step={0.5} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Trimestre</label>
                  <select value={form.trimestre} onChange={e => setForm({ ...form, trimestre: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {TRIMESTRES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Année scolaire</label>
                  <input value={form.anneeScolaire} onChange={e => setForm({ ...form, anneeScolaire: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Appréciation</label>
                <textarea value={form.appreciation} onChange={e => setForm({ ...form, appreciation: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Appréciation du professeur..." />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.eleveId || !form.matiere || !form.note} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmploiTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [filterClasse, setFilterClasse] = useState('all')
  const enseignants = getAll('edu_enseignants')

  const items = useMemo(() => {
    let list = getAll('edu_emploi')
    if (filterClasse !== 'all') list = list.filter(e => e.classe === filterClasse)
    const order = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6 }
    return list.sort((a, b) => (order[a.jour] || 0) - (order[b.jour] || 0) || (a.heureDebut || '').localeCompare(b.heureDebut || ''))
  }, [filterClasse, refreshKey])

  const grouped = useMemo(() => {
    const map = {}
    items.forEach(e => {
      if (!map[e.jour]) map[e.jour] = []
      map[e.jour].push(e)
    })
    return map
  }, [items])

  const handleSave = () => {
    const list = getAll('edu_emploi')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form, matiere: s(form.matiere) }
    } else {
      form.id = nextId(list)
      list.push({ ...form, matiere: s(form.matiere) })
    }
    setAll('edu_emploi', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce créneau ?')) return
    setAll('edu_emploi', getAll('edu_emploi').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('emploi_du_temps', ['ID', 'Jour', 'Heure début', 'Heure fin', 'Matière', 'Enseignant', 'Classe'],
      items.map(e => {
        const ens = enseignants.find(en => en.id === +e.enseignantId)
        return [e.id, e.jour, e.heureDebut, e.heureFin, e.matiere, ens?.nom || '', e.classe]
      }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={filterClasse} onChange={e => setFilterClasse(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-700 dark:text-white">
          <option value="all">Toutes les classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyEmploi })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter un créneau</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {JOURS.map(jour => (
          <div key={jour} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700">
              <h3 className="font-semibold dark:text-white text-sm">{jour}</h3>
            </div>
            <div className="p-3 space-y-2 min-h-[80px]">
              {(grouped[jour] || []).map(e => {
                const ens = enseignants.find(en => en.id === +e.enseignantId)
                return (
                  <div key={e.id} className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-100 dark:border-brand-800/30 group">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono text-brand-600 dark:text-brand-400">{e.heureDebut} - {e.heureFin}</span>
                        <p className="text-sm font-medium dark:text-gray-200">{e.matiere}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{ens?.nom || ''} {e.classe}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setForm({ ...e })} className="p-1 rounded hover:bg-brand-100 dark:hover:bg-brand-800/40 text-brand-500 dark:text-brand-400"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {(grouped[jour] || []).length === 0 && (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">Aucun créneau</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Ajouter'} un créneau</h2>
              <button onClick={() => setForm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Jour *</label>
                  <select value={form.jour} onChange={e => setForm({ ...form, jour: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heure début *</label>
                  <input type="time" value={form.heureDebut} onChange={e => setForm({ ...form, heureDebut: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Heure fin *</label>
                  <input type="time" value={form.heureFin} onChange={e => setForm({ ...form, heureFin: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Matière *</label>
                <input value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Ex: Mathématiques" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Enseignant</label>
                  <select value={form.enseignantId} onChange={e => setForm({ ...form, enseignantId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    <option value="">Sélectionner</option>
                    {enseignants.map(en => <option key={en.id} value={en.id}>{en.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Classe *</label>
                  <select value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-dark-700 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm">Annuler</button>
              <button onClick={handleSave} disabled={!form.matiere} className="btn-primary text-sm disabled:opacity-50">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EnseignantsTab({ refreshKey, refresh }) {
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const items = useMemo(() => {
    let list = getAll('edu_enseignants')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e => e.nom?.toLowerCase().includes(q) || e.specialite?.toLowerCase().includes(q) || e.telephone?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
  }, [search, refreshKey])

  const totalPages = Math.ceil(items.length / perPage)
  const paged = items.slice((page - 1) * perPage, page * perPage)

  const handleSave = () => {
    const list = getAll('edu_enseignants')
    if (form.id) {
      const idx = list.findIndex(i => i.id === form.id)
      if (idx !== -1) list[idx] = { ...form, nom: s(form.nom), telephone: s(form.telephone), specialite: s(form.specialite), qualification: s(form.qualification) }
    } else {
      form.id = nextId(list)
      list.push({ ...form, nom: s(form.nom), telephone: s(form.telephone), specialite: s(form.specialite), qualification: s(form.qualification) })
    }
    setAll('edu_enseignants', list)
    setForm(null)
    refresh()
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer cet enseignant ?')) return
    setAll('edu_enseignants', getAll('edu_enseignants').filter(i => i.id !== id))
    refresh()
  }

  const handleExport = () => {
    exportCSV('enseignants', ['ID', 'Nom', 'Téléphone', 'Spécialité', 'Qualification', 'Statut'],
      items.map(e => [e.id, e.nom, e.telephone, e.specialite, e.qualification, e.statut]))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Rechercher un enseignant..." /></div>
        <button onClick={handleExport} className="btn-secondary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" /> Exporter</button>
        <button onClick={() => setForm({ ...emptyEnseignant })} className="btn-primary text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter</button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Téléphone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Spécialité</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Qualification</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(e => (
                <tr key={e.id} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                  <td className="px-4 py-3 font-medium dark:text-gray-200">{e.nom}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.telephone}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">{e.specialite || '—'}</span></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.qualification || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${e.statut === 'actif' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'}`}>{e.statut}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setForm({ ...e })} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{search ? 'Aucun enseignant ne correspond à la recherche' : 'Aucun enseignant enregistré'}</td></tr>
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
              <h2 className="text-lg font-bold dark:text-white">{form.id ? 'Modifier' : 'Ajouter'} un enseignant</h2>
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Spécialité</label>
                  <input value={form.specialite} onChange={e => setForm({ ...form, specialite: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Ex: Mathématiques" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qualification</label>
                  <input value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white" placeholder="Ex: Licence, Master" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-600 dark:bg-dark-900 dark:text-white">
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
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

function RapportsTab() {
  const eleves = getAll('edu_eleves')
  const notes = getAll('edu_notes')
  const inscriptions = getAll('edu_inscriptions')

  const statsByClasse = useMemo(() => {
    const map = {}
    notes.forEach(n => {
      const eleve = eleves.find(e => e.id === +n.eleveId)
      if (!eleve) return
      if (!map[eleve.classe]) map[eleve.classe] = { classe: eleve.classe, notes: [], total: 0, sum: 0, reussis: 0, eleves: new Set() }
      map[eleve.classe].notes.push(n.note)
      map[eleve.classe].total += 1
      map[eleve.classe].sum += n.note
      map[eleve.classe].eleves.add(n.eleveId)
      if (n.note >= 10) map[eleve.classe].reussis += 1
    })
    return Object.values(map).map(c => ({
      classe: c.classe,
      moyenne: c.total > 0 ? (c.sum / c.total).toFixed(1) : 0,
      tauxReussite: c.total > 0 ? ((c.reussis / c.total) * 100).toFixed(0) : 0,
      nbEleves: c.eleves.size,
      nbNotes: c.total,
    })).sort((a, b) => a.classe.localeCompare(b.classe))
  }, [notes, eleves])

  const elevesEnDifficulte = useMemo(() => {
    const map = {}
    notes.forEach(n => {
      if (!map[n.eleveId]) map[n.eleveId] = { eleveId: +n.eleveId, notes: [], sum: 0 }
      map[n.eleveId].notes.push(n.note)
      map[n.eleveId].sum += n.note
    })
    return Object.values(map)
      .filter(e => e.notes.length >= 2)
      .map(e => {
        const eleve = eleves.find(el => el.id === e.eleveId)
        return { ...e, nom: eleve ? `${eleve.nom} ${eleve.prenom}` : 'Inconnu', classe: eleve?.classe || '', moyenne: (e.sum / e.notes.length).toFixed(1) }
      })
      .filter(e => +e.moyenne < 10)
      .sort((a, b) => +a.moyenne - +b.moyenne)
  }, [notes, eleves])

  const totalInscriptions = inscriptions.length
  const actives = inscriptions.filter(i => i.statut === 'active').length
  const totalFrais = inscriptions.reduce((s, i) => s + (i.fraisInscription || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total élèves</p>
          <p className="text-2xl font-bold dark:text-white">{eleves.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Inscriptions actives</p>
          <p className="text-2xl font-bold dark:text-white">{actives}/{totalInscriptions}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total notes</p>
          <p className="text-2xl font-bold dark:text-white">{notes.length}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Frais collectés</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatMontant(totalFrais)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6">
        <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand-500" /> Moyennes par classe</h3>
        {statsByClasse.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucune note enregistrée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Classe</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Élèves</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Notes</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Moyenne</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Taux réussite</th>
                </tr>
              </thead>
              <tbody>
                {statsByClasse.map(c => (
                  <tr key={c.classe} className="border-b border-gray-50 dark:border-dark-800 hover:bg-gray-50 dark:hover:bg-dark-900/50">
                    <td className="px-4 py-3 font-medium dark:text-gray-200">{c.classe}</td>
                    <td className="px-4 py-3 text-center dark:text-gray-300">{c.nbEleves}</td>
                    <td className="px-4 py-3 text-center dark:text-gray-300">{c.nbNotes}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold font-mono ${+c.moyenne >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{c.moyenne}/20</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${+c.tauxReussite >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{c.tauxReussite}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {elevesEnDifficulte.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-amber-200 dark:border-amber-800/50 p-6">
          <h3 className="text-lg font-bold dark:text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Élèves en difficulté (moyenne {'<'} 10/20)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Élève</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Classe</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Nb notes</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500">Moyenne</th>
                </tr>
              </thead>
              <tbody>
                {elevesEnDifficulte.map((e, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-dark-800 bg-amber-50/50 dark:bg-amber-900/5">
                    <td className="px-4 py-2 font-medium dark:text-gray-200">{e.nom}</td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">{e.classe}</span></td>
                    <td className="px-4 py-2 text-center dark:text-gray-300">{e.notes.length}</td>
                    <td className="px-4 py-2 text-center font-bold font-mono text-red-600 dark:text-red-400">{e.moyenne}/20</td>
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
