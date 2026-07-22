import { useState, useMemo, useEffect } from 'react'
import { getDepenses, addDepense, updateDepense, deleteDepense } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { Plus, Trash2, X, Pencil, Home, Users, Truck, UtensilsCrossed, HelpCircle, Filter, Download } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import SortableHeader, { useSort } from '../components/SortableHeader'
import DateRangeFilter, { useDateFilter } from '../components/DateRangeFilter'
import { exportCSV } from '../lib/exportCSV'
import Pagination from '../components/Pagination'

const categories = [
  { value: 'Fixed', label: 'Fixe', icon: '🏠', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'Personnel', label: 'Personnel', icon: '👥', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'Transport', label: 'Transport', icon: '🚚', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'Alimentation', label: 'Alimentation', icon: '🍽️', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'Autre', label: 'Autre', icon: '📌', color: 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-gray-300' },
]

const empty = { libelle: '', montant: 0, categorie: 'Autre', recurring: false }

export default function DepensesPage() {
  const { isFiltered, sectorDef } = useSector()
  const [depenses, setDepenses] = useState(getDepenses)
  const [form, setForm] = useState(null)
  const [editId, setEditId] = useState(null)
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const { dateKey, setDateKey, customStart, setCustomStart, customEnd, setCustomEnd, filterDate } = useDateFilter('all')
  const { sortField, sortDir, handleSort, sortData } = useSort('date', 'desc')
  const refresh = () => setDepenses(getDepenses())

  const [page, setPage] = useState(1)
  const perPage = 25

  useEffect(() => setPage(1), [filterCat, search, dateKey])

  const handleSave = () => {
    if (!form.libelle || !form.montant) return
    if (editId) {
      updateDepense({ ...form, id: editId })
    } else {
      addDepense(form)
    }
    setForm(null)
    setEditId(null)
    refresh()
  }

  const handleEdit = (d) => {
    setForm({ libelle: d.libelle, montant: d.montant, categorie: d.categorie, recurring: d.recurring || false })
    setEditId(d.id)
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer cette dépense ?')) { deleteDepense(id); refresh() }
  }

  const filtered = useMemo(() => {
    let result = depenses
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d => d.libelle.toLowerCase().includes(q))
    }
    if (filterCat === 'recurring') result = result.filter(d => d.recurring)
    else if (filterCat !== 'all') result = result.filter(d => d.categorie === filterCat)
    result = result.filter(d => filterDate(d.date))
    return sortData(result)
  }, [depenses, filterCat, search, filterDate, sortData])
  const total = filtered.reduce((s, d) => s + d.montant, 0)

  const handleExport = () => {
    exportCSV('depenses', ['Libellé', 'Montant', 'Catégorie', 'Date'],
      filtered.map(d => [d.libelle, d.montant, d.categorie, d.date]))
  }

  const catInfo = (cat) => categories.find(c => c.value === cat) || categories[4]

  const totalParCategorie = (cat) => depenses.filter(d => d.categorie === cat).reduce((s, d) => s + d.montant, 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginatedDepenses = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Dépenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total: <span className="font-semibold text-red-500 dark:text-red-400">{total.toLocaleString('fr-FR')} FCFA</span></p>
        </div>
        <button onClick={() => setForm({ ...empty })} className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            filterCat === 'all' ? 'bg-brand-500 text-white shadow-sm' : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-dark-500'
          }`}>
          <Filter className="w-3 h-3" /> Toutes
        </button>
        {categories.map(cat => (
          <button key={cat.value} onClick={() => setFilterCat(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filterCat === cat.value ? 'bg-brand-500 text-white shadow-sm' : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-dark-500'
            }`}>
            <span>{cat.icon}</span> {cat.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filterCat === cat.value ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-700'}`}>
              {totalParCategorie(cat.value).toLocaleString('fr-FR')}
            </span>
          </button>
        ))}
        <button onClick={() => setFilterCat(filterCat === 'recurring' ? 'all' : 'recurring')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            filterCat === 'recurring' ? 'bg-purple-500 text-white shadow-sm' : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-dark-500'
          }`}>
          🔄 Récurrentes
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une dépense..." className="flex-1 min-w-0 max-w-xs" />
        <DateRangeFilter dateKey={dateKey} setDateKey={setDateKey} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} dépense{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-700">
              <SortableHeader label="Libellé" field="libelle" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Montant" field="montant" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Catégorie" field="categorie" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Date" field="date" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDepenses.map(d => {
              const cat = catInfo(d.categorie)
              return (
                <tr key={d.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                  <td className="px-4 py-3 font-medium dark:text-white">{d.libelle}{d.recurring && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">🔄 Récurrente</span>}</td>
                  <td className="px-4 py-3 font-semibold text-red-500 dark:text-red-400">{d.montant.toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                      {cat.icon} {cat.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(d)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 dark:text-blue-400">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {d.recurring && (
                        <button onClick={() => { setForm({ libelle: d.libelle, montant: d.montant, categorie: d.categorie, recurring: true }); setEditId(null) }}
                          className="p-1.5 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500 dark:text-purple-400" title="Dupliquer">
                          <span className="text-xs">📋</span>
                        </button>
                      )}
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucune dépense</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal nouvelle dépense */}
      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{editId ? 'Modifier la dépense' : 'Nouvelle dépense'}</h3>
              <button onClick={() => { setForm(null); setEditId(null) }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 dark:text-gray-300" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Libellé</label>
                <input value={form.libelle} onChange={e => setForm({ ...form, libelle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300" placeholder="Ex: Électricité du mois" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Montant (FCFA)</label>
                <input type="number" value={form.montant || ''} onChange={e => setForm({ ...form, montant: +e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300" placeholder="0" />
              </div>
              <div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                  <span className="text-sm font-medium dark:text-gray-200">🔄 Dépense récurrente</span>
                  <button type="button" onClick={() => setForm({ ...form, recurring: !form.recurring })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.recurring ? 'bg-purple-500' : 'bg-gray-300 dark:bg-dark-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.recurring ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Catégorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button key={cat.value} type="button" onClick={() => setForm({ ...form, categorie: cat.value })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                        form.categorie === cat.value
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800'
                          : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-dark-500'
                      }`}>
                      <span className="text-lg">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setForm(null); setEditId(null) }} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form.libelle || !form.montant}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
