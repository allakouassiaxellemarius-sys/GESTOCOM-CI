import { useState, useMemo } from 'react'
import { getFournisseurs, addFournisseur, updateFournisseur, deleteFournisseur } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { normalizePhone, formatPhoneDisplay } from '../lib/phone'
import { Plus, Trash2, X, Pencil, ArrowUpDown, Download } from 'lucide-react'
import { exportCSV } from '../lib/exportCSV'
import SearchInput from '../components/SearchInput'

const empty = { nom: '', contact: '', telephone: '', adresse: '' }

export default function FournisseursPage() {
  const { isFiltered } = useSector()
  const [fournisseurs, setFournisseurs] = useState(getFournisseurs)
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('nom')
  const [sortDir, setSortDir] = useState('asc')
  const refresh = () => setFournisseurs(getFournisseurs())

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let result = fournisseurs
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(f => f.nom.toLowerCase().includes(q) || f.contact.toLowerCase().includes(q) || f.telephone.includes(q))
    }
    return [...result].sort((a, b) => {
      let va = a[sortKey] || ''
      let vb = b[sortKey] || ''
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [fournisseurs, search, sortKey, sortDir])

  const handleExport = () => {
    exportCSV('fournisseurs', ['Nom', 'Contact', 'Téléphone', 'Adresse'],
      filtered.map(f => [f.nom, f.contact, f.telephone, f.adresse]))
  }

  const handleSave = () => {
    if (editId) {
      updateFournisseur({ ...form, telephone: normalizePhone(form.telephone), id: editId })
    } else {
      addFournisseur({ ...form, telephone: normalizePhone(form.telephone) })
    }
    setForm(null)
    setEditId(null)
    refresh()
  }

  const handleEdit = (f) => {
    setForm({ nom: f.nom, contact: f.contact, telephone: f.telephone, adresse: f.adresse })
    setEditId(f.id)
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer ce fournisseur ?')) { deleteFournisseur(id); refresh() }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Fournisseurs</h1>
        <button onClick={() => { setForm({ ...empty }); setEditId(null) }} className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un fournisseur..." className="flex-1 min-w-0 max-w-xs" />
        <div className="flex gap-1">
          {[{ key: 'nom', label: 'Nom' }, { key: 'contact', label: 'Contact' }].map(s => (
            <button key={s.key} onClick={() => handleSort(s.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortKey === s.key ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400'}`}>
              {s.label} <ArrowUpDown className="w-3 h-3" />
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} fournisseur{filtered.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
            <Download className="w-3.5 h-3.5" /> Exporter CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(f => (
          <div key={f.id} className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold dark:text-white">{f.nom}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{f.contact}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.telephone}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{f.adresse}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(f)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 dark:text-blue-400">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search ? 'Aucun fournisseur ne correspond à la recherche' : 'Aucun fournisseur'}</p>}

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{editId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
              <button onClick={() => { setForm(null); setEditId(null) }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 dark:text-gray-300" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom</label>
                <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contact</label>
                <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                <div className="flex items-center">
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-gray-100 dark:bg-dark-600 border border-gray-200 dark:border-dark-600 border-r-0 rounded-l-lg px-1.5 py-2">+225</span>
                  <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} placeholder="XX XX XX XX XX"
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-r-lg text-sm dark:bg-dark-900 dark:text-white" />
                </div>
                {form.telephone && <p className="text-[10px] text-green-500 mt-0.5">{formatPhoneDisplay(form.telephone)}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
                <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setForm(null); setEditId(null) }} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form.nom}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
