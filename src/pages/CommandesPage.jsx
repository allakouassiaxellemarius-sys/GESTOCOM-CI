import { useState, useMemo, useEffect } from 'react'
import { getCommandes, addCommande, updateCommande, deleteCommande, recevoirCommande, getProducts, getFournisseurs } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { ClipboardList, Plus, Trash2, X, Download, CheckCircle, Package } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import SortableHeader, { useSort } from '../components/SortableHeader'
import Pagination from '../components/Pagination'
import { exportCSV } from '../lib/exportCSV'

const statuts = [
  { value: 'en_attente', label: 'En attente', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'validée', label: 'Validée', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'reçue', label: 'Reçue', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'annulée', label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]

const empty = { produitId: '', fournisseurId: '', quantite: 1, prixUnitaire: 0, notes: '' }

export default function CommandesPage() {
  const { isFiltered, sectorProductIds, sectorProductNames } = useSector()
  const [allCommandes, setAllCommandes] = useState(getCommandes)
  const commandes = useMemo(() => {
    if (!isFiltered) return allCommandes
    return allCommandes.filter(c => sectorProductIds.has(c.produitId) || sectorProductNames.has(c.produitNom))
  }, [allCommandes, isFiltered, sectorProductIds, sectorProductNames])
  const [products, setProducts] = useState(getProducts)
  const [fournisseurs, setFournisseurs] = useState(getFournisseurs)
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [page, setPage] = useState(1)
  const perPage = 25
  const { sortField, sortDir, handleSort, sortData } = useSort('dateCommande', 'desc')
  const refresh = () => { setAllCommandes(getCommandes()); setProducts(getProducts()); setFournisseurs(getFournisseurs()) }

  useEffect(() => setPage(1), [search, filterStatut])

  const filtered = useMemo(() => {
    let result = commandes
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(c => c.produitNom.toLowerCase().includes(q) || c.fournisseurNom.toLowerCase().includes(q))
    }
    if (filterStatut !== 'all') result = result.filter(c => c.statut === filterStatut)
    return sortData(result)
  }, [commandes, search, filterStatut, sortData])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const total = filtered.reduce((s, c) => s + (c.montantTotal || 0), 0)

  const handleExport = () => {
    exportCSV('commandes', ['Produit', 'Fournisseur', 'Quantité', 'Prix unitaire', 'Montant total', 'Statut', 'Date commande', 'Date livraison'],
      filtered.map(c => [c.produitNom, c.fournisseurNom, c.quantite, c.prixUnitaire, c.montantTotal, c.statut, c.dateCommande, c.dateLivraison || '']))
  }

  const handleSave = () => {
    if (!form.produitId || !form.fournisseurId || !form.quantite || !form.prixUnitaire) return
    const product = products.find(p => p.id === +form.produitId)
    const fournisseur = fournisseurs.find(f => f.id === +form.fournisseurId)
    addCommande({
      produitId: +form.produitId,
      produitNom: product?.nom || '',
      fournisseurId: +form.fournisseurId,
      fournisseurNom: fournisseur?.nom || '',
      quantite: +form.quantite,
      prixUnitaire: +form.prixUnitaire,
      notes: form.notes,
    })
    setForm(null)
    refresh()
  }

  const handleRecevoir = (id) => {
    if (confirm('Confirmer la réception de cette commande ?')) { recevoirCommande(id); refresh() }
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer cette commande ?')) { deleteCommande(id); refresh() }
  }

  const handleStatutChange = (id, statut) => {
    updateCommande({ id, statut })
    refresh()
  }

  const statutInfo = (s) => statuts.find(st => st.value === s) || statuts[0]

  const totalParStatut = (s) => commandes.filter(c => c.statut === s).reduce((acc, c) => acc + (c.montantTotal || 0), 0)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-500" /> Commandes fournisseurs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total: <span className="font-semibold text-brand-600 dark:text-brand-400">{total.toLocaleString('fr-FR')} FCFA</span></p>
        </div>
        <button onClick={() => setForm({ ...empty })} className="btn-primary text-sm py-2">
          <Plus className="w-4 h-4" /> Nouvelle commande
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        <button onClick={() => setFilterStatut('all')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            filterStatut === 'all' ? 'bg-brand-500 text-white shadow-sm' : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-dark-500'
          }`}>
          Toutes
        </button>
        {statuts.map(s => (
          <button key={s.value} onClick={() => setFilterStatut(s.value)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              filterStatut === s.value ? 'bg-brand-500 text-white shadow-sm' : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-dark-500'
            }`}>
            {s.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${filterStatut === s.value ? 'bg-white/20' : 'bg-gray-100 dark:bg-dark-700'}`}>
              {totalParStatut(s.value).toLocaleString('fr-FR')}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une commande..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} commande{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm landscape-table">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <SortableHeader label="Produit" field="produitNom" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Fournisseur" field="fournisseurNom" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortableHeader label="Qté" field="quantite" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Prix unitaire" field="prixUnitaire" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Montant total" field="montantTotal" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Statut" field="statut" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Date commande" field="dateCommande" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Date livraison" field="dateLivraison" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <th className="px-2 sm:px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => {
                const s = statutInfo(c.statut)
                return (
                  <tr key={c.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-2 sm:px-4 py-3 font-medium dark:text-white text-xs">{c.produitNom}</td>
                    <td className="px-2 sm:px-4 py-3 dark:text-gray-300 text-xs hidden sm:table-cell">{c.fournisseurNom}</td>
                    <td className="px-2 sm:px-4 py-3 dark:text-gray-300 text-xs hidden md:table-cell">{c.quantite}</td>
                    <td className="px-2 sm:px-4 py-3 dark:text-gray-300 text-xs hidden lg:table-cell">{c.prixUnitaire?.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-2 sm:px-4 py-3 font-semibold text-brand-600 dark:text-brand-400 text-xs">{(c.montantTotal || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-2 sm:px-4 py-3">
                      <select value={c.statut} onChange={e => handleStatutChange(c.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border-0 cursor-pointer ${s.color}`}>
                        {statuts.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                      </select>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden md:table-cell">{c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-2 sm:px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden lg:table-cell">{c.dateLivraison ? new Date(c.dateLivraison).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center gap-1">
                        {c.statut !== 'reçue' && c.statut !== 'annulée' && (
                          <button onClick={() => handleRecevoir(c.id)} className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 dark:text-green-400" title="Recevoir">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer">
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
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search || filterStatut !== 'all' ? 'Aucune commande ne correspond à la recherche' : 'Aucune commande'}</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-500" /> Nouvelle commande
              </h3>
              <button onClick={() => setForm(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 dark:text-gray-300" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Produit</label>
                <select value={form.produitId} onChange={e => {
                  const p = products.find(pr => pr.id === +e.target.value)
                  setForm({ ...form, produitId: e.target.value, prixUnitaire: p?.prixUnite || form.prixUnitaire })
                }} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300">
                  <option value="">Sélectionner un produit</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label>
                <select value={form.fournisseurId} onChange={e => setForm({ ...form, fournisseurId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300">
                  <option value="">Sélectionner un fournisseur</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité</label>
                  <input type="number" min={1} value={form.quantite} onChange={e => setForm({ ...form, quantite: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix unitaire (FCFA)</label>
                  <input type="number" min={0} value={form.prixUnitaire} onChange={e => setForm({ ...form, prixUnitaire: +e.target.value })} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300" />
                </div>
              </div>
              {form.quantite > 0 && form.prixUnitaire > 0 && (
                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
                  <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Montant total: {(form.quantite * form.prixUnitaire).toLocaleString('fr-FR')} FCFA</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300 resize-none" placeholder="Notes optionnelles..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form.produitId || !form.fournisseurId || !form.quantite || !form.prixUnitaire}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
