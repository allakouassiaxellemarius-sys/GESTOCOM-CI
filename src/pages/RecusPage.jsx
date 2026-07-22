import { useState, useEffect, useMemo } from 'react'
import { getReceipts } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { shareReceiptByWhatsApp, shareReceiptByEmail } from '../lib/receipt'
import { FileText, Shield, MessageCircle, Mail, Download } from 'lucide-react'
import { exportCSV } from '../lib/exportCSV'
import Pagination from '../components/Pagination'
import SearchInput from '../components/SearchInput'
import SortableHeader, { useSort } from '../components/SortableHeader'
import DateRangeFilter, { useDateFilter } from '../components/DateRangeFilter'

export default function RecusPage() {
  const { isFiltered, sectorProductNames, sectorProductIds } = useSector()
  const [allReceipts] = useState(getReceipts)
  const receipts = useMemo(() => {
    if (!isFiltered) return allReceipts
    return allReceipts.filter(r => {
      if (!r.ventes?.length) return true
      return r.ventes.some(v => sectorProductIds.has(v.produitId) || sectorProductNames.has(v.nomProduit))
    })
  }, [allReceipts, isFiltered, sectorProductNames, sectorProductIds])
  const [search, setSearch] = useState('')
  const [caissierFilter, setCaissierFilter] = useState('all')
  const { dateKey, setDateKey, customStart, setCustomStart, customEnd, setCustomEnd, filterDate } = useDateFilter('all')
  const { sortField, sortDir, handleSort, sortData } = useSort('date', 'desc')
  const [page, setPage] = useState(1)
  const perPage = 25

  useEffect(() => setPage(1), [search, caissierFilter, dateKey])

  const uniqueCaissiers = [...new Set(receipts.map(r => r.caissier).filter(Boolean))]

  const filtered = useMemo(() => {
    return sortData(receipts.filter(r => {
      if (search) {
        const q = search.toLowerCase()
        if (!(r.numero?.toLowerCase().includes(q) || r.client?.toLowerCase().includes(q) || r.caissier?.toLowerCase().includes(q))) return false
      }
      if (caissierFilter !== 'all' && r.caissier !== caissierFilter) return false
      if (!filterDate(r.date)) return false
      return true
    }))
  }, [receipts, search, caissierFilter, filterDate, sortData])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginatedRec = filtered.slice((page - 1) * perPage, page * perPage)

  const handleExport = () => {
    exportCSV('recus', ['Numéro', 'Date', 'Client', 'Articles', 'Paiement', 'Caissier', 'Total', 'Hash'],
      filtered.map(r => [r.numero, r.date, r.client || '', r.ventes?.length || 0, r.modePaiement, r.caissier, r.total, r.hash || '']))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-brand-500" />
          <h1 className="text-2xl font-bold dark:text-white">Historique des reçus</h1>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} reçu{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un reçu..." className="flex-1 min-w-0 max-w-xs" />
        {uniqueCaissiers.length > 0 && (
          <select value={caissierFilter} onChange={e => setCaissierFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-700 focus:outline-none dark:text-white">
            <option value="all">Tous les caissiers</option>
            {uniqueCaissiers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <DateRangeFilter dateKey={dateKey} setDateKey={setDateKey} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm landscape-table">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <SortableHeader label="Numéro" field="numero" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Date" field="date" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Client" field="client" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortableHeader label="Articles" field="ventes" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Paiement" field="modePaiement" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Caissier" field="caissier" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Total" field="total" sortField={sortField} sortDir={sortDir} onSort={handleSort} className="text-right" />
                <th className="px-2 sm:px-4 py-3 font-medium hidden lg:table-cell">Intégrité</th>
                <th className="px-2 sm:px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 dark:text-gray-500 text-sm">Aucun reçu trouvé</td></tr>
              ) : (
                paginatedRec.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-2 sm:px-4 py-3 font-mono text-xs font-medium text-brand-600 dark:text-brand-400">{r.numero}</td>
                    <td className="px-2 sm:px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{new Date(r.date).toLocaleDateString('fr-FR')}<br className="sm:hidden" />{new Date(r.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-2 sm:px-4 py-3 dark:text-gray-300 text-xs hidden sm:table-cell">{r.client || '-'}</td>
                    <td className="px-2 sm:px-4 py-3 dark:text-gray-300 text-xs hidden md:table-cell">{r.ventes?.length || 0}</td>
                    <td className="px-2 sm:px-4 py-3 text-xs hidden lg:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-dark-700 dark:text-gray-300">{r.modePaiement}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden md:table-cell">{r.caissier}</td>
                    <td className="px-2 sm:px-4 py-3 font-semibold text-right dark:text-gray-200 text-xs">{r.total.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                      {r.hash ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Shield className="w-3 h-3" /> {r.hash.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => shareReceiptByWhatsApp(r.numero, r.total, { telephone: r.telephone })} className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500" title="WhatsApp">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => shareReceiptByEmail(r.numero, r.total)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Email">
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
