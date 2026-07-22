import { useState, useMemo, useEffect } from 'react'
import { getVentes } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { exportCSV } from '../lib/exportCSV'
import { History, Search, Download } from 'lucide-react'
import SortableHeader, { useSort } from '../components/SortableHeader'
import Pagination from '../components/Pagination'

const PAIEMENTS = [
  { key: 'especes', label: 'Espèces', icon: '💵' },
  { key: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { key: 'carte', label: 'Carte Bancaire', icon: '💳' },
  { key: 'credit', label: 'Crédit', icon: '📝' },
]

export default function HistoriqueVentesPage() {
  const { filterVentes } = useSector()
  const [allVentes] = useState(getVentes)
  const ventes = useMemo(() => filterVentes(allVentes), [allVentes])
  const [dateFilter, setDateFilter] = useState('all')
  const [caissierFilter, setCaissierFilter] = useState('all')
  const [search, setSearch] = useState('')
  const { sortField, sortDir, handleSort, sortData } = useSort('dateVente', 'desc')
  const [page, setPage] = useState(1)
  const perPage = 25

  const filteredVentes = useMemo(() => {
    return sortData(ventes.filter(v => {
      if (dateFilter === 'today') return v.dateVente.slice(0, 10) === new Date().toISOString().slice(0, 10)
      if (dateFilter === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); return new Date(v.dateVente) >= d }
      if (dateFilter === 'month') { const d = new Date(); d.setDate(d.getDate() - 30); return new Date(v.dateVente) >= d }
      return true
    }).filter(v => caissierFilter === 'all' || v.caissier === caissierFilter)
      .filter(v => !search || v.nomProduit?.toLowerCase().includes(search.toLowerCase()) || v.caissier?.toLowerCase().includes(search.toLowerCase())))
  }, [ventes, dateFilter, caissierFilter, search, sortData])

  useEffect(() => setPage(1), [dateFilter, caissierFilter, search])

  const handleExport = () => {
    exportCSV('historique_ventes', ['ID', 'Produit', 'Qté', 'Prix u.', 'Remise', 'Mode', 'Caissier', 'Total', 'Date'],
      filteredVentes.map(v => [v.id, v.nomProduit, v.quantite, v.prixUnitaire, v.remise || 0, v.modePaiement || 'especes', v.caissier || '', v.total, v.dateVente]))
  }

  const totalPages = Math.ceil(filteredVentes.length / perPage)
  const paginatedVentes = filteredVentes.slice((page - 1) * perPage, page * perPage)

  const stats = useMemo(() => ({
    nbVentes: filteredVentes.length,
    totalCA: filteredVentes.reduce((s, v) => s + v.total, 0),
    totalUnites: filteredVentes.reduce((s, v) => s + v.quantite, 0),
    totalRemises: filteredVentes.reduce((s, v) => s + (v.remise || 0), 0),
  }), [filteredVentes])

  const uniqueCaissiers = [...new Set(ventes.map(v => v.caissier).filter(Boolean))]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <History className="w-6 h-6 text-brand-500" />
        <h1 className="text-2xl font-bold dark:text-white">Historique des ventes</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          {[{ key: 'all', label: 'Tout' }, { key: 'today', label: "Aujourd'hui" }, { key: 'week', label: '7 jours' }, { key: 'month', label: '30 jours' }].map(f => (
            <button key={f.key} onClick={() => setDateFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dateFilter === f.key ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
        {uniqueCaissiers.length > 0 && (
          <select value={caissierFilter} onChange={e => setCaissierFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-700 focus:outline-none dark:text-white">
            <option value="all">Tous les caissiers</option>
            {uniqueCaissiers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 text-center">
          <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.nbVentes}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Ventes</div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalCA.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">CA (FCFA)</div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalUnites.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Unités vendues</div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 text-center">
          <div className="text-2xl font-bold text-red-500 dark:text-red-400">{stats.totalRemises.toLocaleString('fr-FR')}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Remises (FCFA)</div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <SortableHeader label="ID" field="id" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Produit" field="nomProduit" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Qté" field="quantite" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Prix u." field="prixUnitaire" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Remise" field="remise" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Mode" field="modePaiement" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Caissier" field="caissier" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Total" field="total" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                <SortableHeader label="Date" field="dateVente" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {filteredVentes.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Aucune vente</td></tr>
              ) : (
                paginatedVentes.map(v => (
                  <tr key={v.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">#{v.id}</td>
                    <td className="px-4 py-3 font-medium dark:text-gray-200">{v.nomProduit}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{v.quantite}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.prixUnitaire.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3 text-red-500 dark:text-red-400">{v.remise ? `-${v.remise.toLocaleString('fr-FR')}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-700 dark:text-gray-300">{PAIEMENTS.find(p => p.key === v.modePaiement)?.icon || '💵'} {v.modePaiement || 'especes'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.caissier || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-right dark:text-gray-200">{v.total.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-right">{new Date(v.dateVente).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}
