import { useState, useMemo } from 'react'
import { getTopProduits, getVentesParCaissier, getMarges, getRecettesParMode, getVentes } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { BarChart3, TrendingUp, Users, Wallet } from 'lucide-react'
import DateRangeFilter from '../components/DateRangeFilter'

const PAIEMENTS = [
  { key: 'especes', label: 'Espèces', icon: '💵' },
  { key: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { key: 'carte', label: 'Carte Bancaire', icon: '💳' },
  { key: 'credit', label: 'Crédit', icon: '📝' },
]

const DAYS_MAP = { all: 365, today: 1, week: 7, month: 30, quarter: 90, custom: 90 }

export default function RapportsVentesPage() {
  const [dateKey, setDateKey] = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const { isFiltered, filterVentes } = useSector()

  const daysBack = DAYS_MAP[dateKey] || 30
  const startDate = useMemo(() => {
    if (dateKey === 'today') return new Date()
    if (dateKey === 'custom' && customStart) return new Date(customStart)
    const d = new Date()
    d.setDate(d.getDate() - daysBack)
    return d
  }, [dateKey, daysBack, customStart])

  const filteredVentes = useMemo(() => filterVentes(getVentes()), [isFiltered])
  const topProduits = useMemo(() => {
    if (!isFiltered) return getTopProduits(5, startDate)
    const map = {}
    filteredVentes.filter(v => new Date(v.dateVente) >= startDate).forEach(v => {
      const nom = v.nomProduit || 'Inconnu'
      if (!map[nom]) map[nom] = { nom, ventes: 0, unites: 0, total: 0 }
      map[nom].ventes++; map[nom].unites += v.quantite; map[nom].total += v.total
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [filteredVentes, startDate, isFiltered])
  const ventesCaissier = useMemo(() => {
    if (!isFiltered) return getVentesParCaissier(startDate)
    const map = {}
    filteredVentes.filter(v => new Date(v.dateVente) >= startDate).forEach(v => {
      const nom = v.caissier || 'Inconnu'
      if (!map[nom]) map[nom] = { nom, ventes: 0, unites: 0, total: 0 }
      map[nom].ventes++; map[nom].unites += v.quantite; map[nom].total += v.total
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [filteredVentes, startDate, isFiltered])
  const marges = useMemo(() => {
    if (!isFiltered) return getMarges()
    return getMarges().filter(m => {
      const v = filteredVentes.find(ve => ve.id === m.id)
      return v != null
    })
  }, [filteredVentes, isFiltered])
  const totalMarge = marges.reduce((s, v) => s + v.marge, 0)
  const totalRemisesAll = marges.reduce((s, v) => s + (v.remise || 0), 0)
  const recettesMode = useMemo(() => {
    if (!isFiltered) return getRecettesParMode(startDate)
    const map = {}
    filteredVentes.filter(v => new Date(v.dateVente) >= startDate).forEach(v => {
      const mode = v.modePaiement || 'especes'
      if (!map[mode]) map[mode] = { mode, total: 0 }
      map[mode].total += v.total
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [filteredVentes, startDate, isFiltered])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-brand-500" />
        <h1 className="text-2xl font-bold dark:text-white">Rapports des ventes</h1>
      </div>

      <div className="mb-6">
        <DateRangeFilter dateKey={dateKey} setDateKey={setDateKey} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <TrendingUp className="w-4 h-4 text-brand-500 dark:text-brand-400" /> Produits les plus vendus
          </h3>
          {topProduits.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {topProduits.map((p, i) => {
                const maxTotal = topProduits[0]?.total || 1
                return (
                  <div key={i} className="flex items-center gap-2 sm:gap-4">
                    <span className="text-xs sm:text-sm font-medium w-20 sm:w-32 truncate dark:text-gray-200">{p.nom}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-dark-700 rounded-full h-4 sm:h-5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(p.total / maxTotal) * 100}%` }}>
                        <span className="text-[9px] sm:text-[10px] text-white font-medium">{p.quantite.toLocaleString('fr-FR')} u.</span>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold w-20 sm:w-28 text-right dark:text-gray-200">{p.total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Ventes par caissier
            </h3>
            {ventesCaissier.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {ventesCaissier.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-dark-700 last:border-0">
                    <div>
                      <div className="text-sm font-medium dark:text-gray-200">{c.nom}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{c.ventes} ventes · {c.unites.toLocaleString('fr-FR')} unités</div>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{c.total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Wallet className="w-4 h-4 text-gold-500 dark:text-gold-400" /> Recettes par mode
            </h3>
            {recettesMode.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {recettesMode.map((r, i) => {
                  const total30 = recettesMode.reduce((s, x) => s + x.total, 0)
                  const pct = total30 > 0 ? (r.total / total30 * 100).toFixed(1) : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium dark:text-gray-200">{PAIEMENTS.find(p => p.key === r.mode)?.icon} {PAIEMENTS.find(p => p.key === r.mode)?.label || r.mode}</span>
                        <span className="text-sm font-bold dark:text-gray-200">{r.total.toLocaleString('fr-FR')} FCFA <span className="text-gray-400 dark:text-gray-500 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-2">
                        <div className="h-full bg-brand-400 dark:bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <BarChart3 className="w-4 h-4 text-green-500 dark:text-green-400" /> Suivi des marges et bénéfices
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
              <div className="text-sm sm:text-lg font-bold text-green-700 dark:text-green-300 break-all">{totalMarge.toLocaleString('fr-FR')} FCFA</div>
              <div className="text-xs text-green-600 dark:text-green-400">Marge totale</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <div className="text-sm sm:text-lg font-bold text-red-600 dark:text-red-400 break-all">{totalRemisesAll.toLocaleString('fr-FR')} FCFA</div>
              <div className="text-xs text-red-500 dark:text-red-400">Remises totales</div>
            </div>
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 text-center">
              <div className="text-sm sm:text-lg font-bold text-brand-700 dark:text-brand-300">{marges.length > 0 ? (marges.reduce((s, v) => s + +v.margePct, 0) / marges.length).toFixed(1) : 0}%</div>
              <div className="text-xs text-brand-600 dark:text-brand-400">Marge moyenne</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm landscape-table">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                  <th className="px-2 sm:px-3 py-2 font-medium">Produit</th>
                  <th className="px-2 sm:px-3 py-2 font-medium hidden sm:table-cell">Qté</th>
                  <th className="px-2 sm:px-3 py-2 font-medium">CA</th>
                  <th className="px-2 sm:px-3 py-2 font-medium hidden md:table-cell">Coût</th>
                  <th className="px-2 sm:px-3 py-2 font-medium">Marge</th>
                  <th className="px-2 sm:px-3 py-2 font-medium hidden sm:table-cell">%</th>
                </tr>
              </thead>
              <tbody>
                {marges.slice(-20).reverse().map(v => (
                  <tr key={v.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0">
                    <td className="px-2 sm:px-3 py-2 font-medium dark:text-gray-200 text-xs">{v.nomProduit}</td>
                    <td className="px-2 sm:px-3 py-2 dark:text-gray-300 text-xs hidden sm:table-cell">{v.quantite}</td>
                    <td className="px-2 sm:px-3 py-2 dark:text-gray-300 text-xs">{v.total.toLocaleString('fr-FR')}</td>
                    <td className="px-2 sm:px-3 py-2 text-gray-500 dark:text-gray-400 text-xs hidden md:table-cell">{((v.coutAchat || 0) * v.quantite).toLocaleString('fr-FR')}</td>
                    <td className={`px-2 sm:px-3 py-2 font-semibold text-xs ${v.marge >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{v.marge.toLocaleString('fr-FR')}</td>
                    <td className="px-2 sm:px-3 py-2 dark:text-gray-300 text-xs hidden sm:table-cell">{v.margePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
