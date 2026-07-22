import { useState, useMemo, useEffect } from 'react'
import { getRetours, addRetour, deleteRetour, getVentes } from '../lib/db'
import { useSector } from '../context/SectorContext'
import SearchInput from '../components/SearchInput'
import SortableHeader, { useSort } from '../components/SortableHeader'
import Pagination from '../components/Pagination'
import { exportCSV } from '../lib/exportCSV'
import { RotateCcw, Trash2, X, Plus, Download } from 'lucide-react'

export default function RetoursPage() {
  const { isFiltered, filterVentes } = useSector()
  const [allRetours, setAllRetours] = useState(getRetours)
  const retours = useMemo(() => {
    if (!isFiltered) return allRetours
    const ventesSet = new Set(filterVentes(getVentes()).map(v => v.id))
    return allRetours.filter(r => ventesSet.has(r.venteId))
  }, [allRetours, isFiltered, filterVentes])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 25
  const { sortField, sortDir, handleSort, sortData } = useSort('date', 'desc')
  const [showModal, setShowModal] = useState(false)
  const [venteSearch, setVenteSearch] = useState('')
  const [selectedVente, setSelectedVente] = useState(null)
  const [returnQty, setReturnQty] = useState(1)
  const [motif, setMotif] = useState('')

  const refresh = () => setAllRetours(getRetours())

  const filteredRetours = useMemo(() => {
    let result = retours
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(r => r.produit?.toLowerCase().includes(q) || r.motif?.toLowerCase().includes(q) || r.caissier?.toLowerCase().includes(q))
    }
    return sortData(result)
  }, [retours, search, sortData])

  const totalPages = Math.ceil(filteredRetours.length / perPage)
  const paginatedRetours = filteredRetours.slice((page - 1) * perPage, page * perPage)

  useEffect(() => setPage(1), [search])

  const handleExport = () => {
    exportCSV('retours', ['ID', 'Produit', 'Qté rendue', 'Motif', 'Montant', 'Caissier', 'Date', 'Statut'],
      filteredRetours.map(r => [r.id, r.produit, r.quantite, r.motif || '', r.montant, r.caissier || '', r.date, r.statut || 'Terminé']))
  }

  const handleDelete = (id) => {
    if (confirm('Supprimer ce retour ?')) { deleteRetour(id); refresh() }
  }

  const recentVentes = useMemo(() => {
    const all = getVentes()
    return all.slice(-100).reverse()
  }, [showModal])

  const filteredVentes = recentVentes.filter(v =>
    !venteSearch || v.nomProduit?.toLowerCase().includes(venteSearch.toLowerCase())
  )

  const handleSelectVente = (v) => {
    setSelectedVente(v)
    setReturnQty(1)
    setVenteSearch('')
  }

  const handleSubmit = () => {
    if (!selectedVente || !returnQty || returnQty < 1) return
    if (returnQty > selectedVente.quantite) { alert(`La quantité retournée ne peut pas dépasser ${selectedVente.quantite}`); return }
    const montant = returnQty * selectedVente.prixUnitaire
    addRetour({
      produit: selectedVente.nomProduit,
      produitId: selectedVente.produitId,
      venteId: selectedVente.id,
      quantite: returnQty,
      motif: motif || 'Aucun motif',
      montant,
      caissier: selectedVente.caissier || 'Inconnu',
      statut: 'Terminé',
    })
    setShowModal(false)
    setSelectedVente(null)
    setReturnQty(1)
    setMotif('')
    refresh()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <RotateCcw className="w-6 h-6 text-brand-500" />
          <h1 className="text-2xl font-bold dark:text-white">Retours</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm py-2 inline-flex items-center gap-2">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exporter CSV</span>
          </button>
          <button onClick={() => { setShowModal(true); setSelectedVente(null); setReturnQty(1); setMotif(''); setVenteSearch('') }} className="btn-primary text-sm py-2 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau retour
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un retour..." className="flex-1 min-w-0 max-w-xs" />
        <span className="text-xs text-gray-400 dark:text-gray-500">{filteredRetours.length} retour{filteredRetours.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm landscape-table">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <SortableHeader label="Produit" field="produit" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Qté" field="quantite" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortableHeader label="Motif" field="motif" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Montant" field="montant" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Caissier" field="caissier" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Date" field="date" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortableHeader label="Statut" field="statut" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <th className="px-2 sm:px-4 py-3 font-medium dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRetours.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Aucun retour</td></tr>
              ) : (
                paginatedRetours.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-2 sm:px-4 py-3 font-medium dark:text-gray-200 text-xs">{r.produit}</td>
                    <td className="px-2 sm:px-4 py-3 dark:text-gray-300 text-xs hidden sm:table-cell">{r.quantite}</td>
                    <td className="px-2 sm:px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[120px] truncate text-xs hidden md:table-cell">{r.motif || '-'}</td>
                    <td className="px-2 sm:px-4 py-3 font-semibold text-red-500 dark:text-red-400 text-xs">-{r.montant?.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-2 sm:px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell">{r.caissier || '-'}</td>
                    <td className="px-2 sm:px-4 py-3 text-gray-400 dark:text-gray-500 text-xs hidden sm:table-cell">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-2 sm:px-4 py-3 hidden md:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                        {r.statut || 'Terminé'}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">Nouveau retour</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600">
                <X className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vente concernée</label>
              <div className="relative">
                <input type="text" placeholder="Rechercher une vente..." value={venteSearch} onChange={e => setVenteSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                {venteSearch && filteredVentes.length > 0 && !selectedVente && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredVentes.map(v => (
                      <button key={v.id} onClick={() => handleSelectVente(v)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-700 border-b border-gray-50 dark:border-dark-700 last:border-0 dark:text-gray-200">
                        <span className="font-medium">{v.nomProduit}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-2">x{v.quantite}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-2">{v.prixUnitaire?.toLocaleString('fr-FR')} FCFA/u</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-2">— {new Date(v.dateVente).toLocaleDateString('fr-FR')}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedVente && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <div className="text-sm font-medium dark:text-gray-200">{selectedVente.nomProduit}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Quantité vendue: {selectedVente.quantite} · Prix unitaire: {selectedVente.prixUnitaire?.toLocaleString('fr-FR')} FCFA
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Date: {new Date(selectedVente.dateVente).toLocaleDateString('fr-FR')}</div>
              </div>
            )}

            {selectedVente && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité retournée (max: {selectedVente.quantite})</label>
                  <input type="number" min={1} max={selectedVente.quantite} value={returnQty}
                    onChange={e => setReturnQty(Math.min(Math.max(1, +e.target.value || 1), selectedVente.quantite))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Motif du retour</label>
                  <input type="text" placeholder="Ex: Produit abîmé, erreur commande..." value={motif}
                    onChange={e => setMotif(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>

                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl mb-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">Montant à rembourser</div>
                  <div className="text-xl font-bold text-brand-600 dark:text-brand-400">
                    {(returnQty * selectedVente.prixUnitaire).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={handleSubmit} className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2" disabled={!selectedVente || !returnQty || returnQty < 1}>
                <RotateCcw className="w-4 h-4" /> Confirmer le retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
