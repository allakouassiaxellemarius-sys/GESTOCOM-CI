import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getVentes, getBeneficeParJour, getDepenses } from '../lib/db'
import { getStatsStock, getAlertesStock } from '../lib/stockDb'
import { SECTORS } from '../lib/modules'
import { useSector } from '../context/SectorContext'
import { useDevice } from '../context/DeviceContext'
import { useAuth } from '../context/AuthContext'
import { Package, ShoppingCart, TrendingUp, DollarSign, Briefcase, Warehouse, AlertTriangle, Plus, ArrowRight, Bell, Layers, Landmark, Factory, Heart, GraduationCap, HandHeart, Truck } from 'lucide-react'

const ICONS = { ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart, Layers }

export default function DashboardPage() {
  const navigate = useNavigate()
  const { activeSector, setSector, isFiltered, sectorDef, filterVentes, filterAlertes, enabledSectors } = useSector()
  const { isMobile } = useDevice()
  const { user } = useAuth()

  const allVentes = getVentes()
  const allDepenses = getDepenses()

  const ventes = useMemo(() => filterVentes(allVentes), [allVentes, activeSector, isFiltered])
  const entitesAlertes = useMemo(() => filterAlertes(getAlertesStock()), [activeSector, isFiltered])

  const ca30 = useMemo(() => ventes.filter(v => new Date(v.dateVente) >= new Date(Date.now() - 30 * 86400000)).reduce((s, v) => s + v.total, 0), [ventes])
  const ca7 = useMemo(() => ventes.filter(v => new Date(v.dateVente) >= new Date(Date.now() - 7 * 86400000)).reduce((s, v) => s + v.total, 0), [ventes])
  const todayCA = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return ventes.filter(v => v.dateVente?.slice(0, 10) === today).reduce((s, v) => s + v.total, 0)
  }, [ventes])
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return ventes.filter(v => v.dateVente?.slice(0, 10) === today).length
  }, [ventes])

  const benefice = useMemo(() => {
    const b30 = getBeneficeParJour(30)
    const today = b30[b30.length - 1]
    return {
      today: today?.benefice || 0,
      jour30: b30.reduce((s, j) => s + j.benefice, 0),
    }
  }, [])

  const stockStats = useMemo(() => getStatsStock(isFiltered ? activeSector : null), [activeSector, isFiltered])

  const topProduits = useMemo(() => {
    const map = {}
    const since = new Date(Date.now() - 30 * 86400000)
    ventes.filter(v => new Date(v.dateVente) >= since).forEach(v => {
      if (!map[v.nomProduit]) map[v.nomProduit] = { nom: v.nomProduit, quantite: 0, total: 0 }
      map[v.nomProduit].quantite += v.quantite
      map[v.nomProduit].total += v.total
    })
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [ventes])

  const derniersVentes = useMemo(() => ventes.slice(-5).reverse(), [ventes])
  const alertes = entitesAlertes.filter(a => a.gravite === 'critique' || a.gravite === 'warning')

  const formatMontant = (v) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + ' M'
    if (v >= 1000) return (v / 1000).toFixed(0) + ' k'
    return v.toLocaleString('fr-FR')
  }

  return (
    <div className="space-y-4">
      {/* ═══ SECTOR FILTER ═══ */}
      {enabledSectors.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSector('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              !isFiltered ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25' : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-700'
            }`}
          >
            <Layers className="w-3 h-3" />
            Tous
          </button>
          {Object.values(SECTORS).filter(s => enabledSectors.includes(s.id)).map(s => {
            const SIcon = ICONS[s.icon] || Layers
            return (
              <button
                key={s.id}
                onClick={() => setSector(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeSector === s.id ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25' : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-700'
                }`}
              >
                <SIcon className="w-3 h-3" />
                <span>{s.nom}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ═══ ALERTES CRITIQUES ═══ */}
      {alertes.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl">
          <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            {alertes.length} alerte{alertes.length > 1 ? 's' : ''} — {alertes[0]?.message?.slice(0, 60)}...
          </span>
        </div>
      )}

      {/* ═══ KPIs PRINCIPAUX ═══ */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Aujourd'hui</p>
          <p className="text-lg font-bold dark:text-white leading-tight">{formatMontant(todayCA)} FCFA</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{todayCount} vente{todayCount > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">30 jours</p>
          <p className="text-lg font-bold dark:text-white leading-tight">{formatMontant(ca30)} FCFA</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">7j: {formatMontant(ca7)}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${benefice.jour30 >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <Briefcase className={`w-4 h-4 ${benefice.jour30 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Bénéfice 30j</p>
          <p className="text-lg font-bold dark:text-white leading-tight">{formatMontant(benefice.jour30)} FCFA</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">Stock</p>
          <p className="text-lg font-bold dark:text-white leading-tight">{formatMontant(stockStats.valeurStock || 0)} FCFA</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{stockStats.totalProduits || 0} produits</p>
        </div>
      </div>

      {/* ═══ ACTIONS RAPIDES ═══ */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => navigate('/app/ventes')}
          className="flex flex-col items-center gap-2 p-4 bg-brand-500 text-white rounded-xl active:scale-[0.97] transition-transform shadow-lg shadow-brand-500/25">
          <ShoppingCart className="w-6 h-6" />
          <span className="text-xs font-semibold">Vente</span>
        </button>
        <button onClick={() => navigate('/app/stock')}
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 rounded-xl active:scale-[0.97] transition-transform">
          <Package className="w-6 h-6" />
          <span className="text-xs font-semibold">Stock</span>
        </button>
        <button onClick={() => navigate('/app/depenses')}
          className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 rounded-xl active:scale-[0.97] transition-transform">
          <Plus className="w-6 h-6" />
          <span className="text-xs font-semibold">Dépense</span>
        </button>
      </div>

      {/* ═══ TOP PRODUITS ═══ */}
      {topProduits.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
          <h3 className="text-xs font-semibold dark:text-white mb-3">Top ventes 30j</h3>
          <div className="space-y-2">
            {topProduits.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 h-5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                  <span className="text-xs font-medium dark:text-white truncate">{p.nom}</span>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{p.quantite} u.</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-3">{formatMontant(p.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ DERNIÈRES VENTES ═══ */}
      {derniersVentes.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold dark:text-white">Dernières ventes</h3>
            <button onClick={() => navigate('/app/ventes/historique')} className="text-[10px] text-brand-500 flex items-center gap-0.5">
              Tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {derniersVentes.map((v, i) => (
              <div key={v.id || i} className="flex items-center justify-between py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium dark:text-white truncate">{v.nomProduit}</p>
                  <p className="text-[10px] text-gray-400">x{v.quantite} · {v.modePaiement || 'Espèces'}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-xs font-semibold dark:text-white">{v.total?.toLocaleString('fr-FR')} F</p>
                  <p className="text-[10px] text-gray-400">{v.dateVente ? new Date(v.dateVente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STOCK BAS ═══ */}
      {entitesAlertes.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="text-xs font-semibold dark:text-white">Alertes stock</h3>
            </div>
            <span className="text-[10px] text-gray-400">{entitesAlertes.length}</span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {entitesAlertes.slice(0, 5).map((a, i) => (
              <div key={i} className={`flex items-start gap-2 py-2 px-2.5 rounded-lg text-xs ${a.gravite === 'critique' ? 'bg-red-50 dark:bg-red-900/20' : a.gravite === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-dark-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${a.gravite === 'critique' ? 'bg-red-500' : a.gravite === 'warning' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                <span className="dark:text-gray-300 leading-snug">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
