import { useState, useMemo } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Minus, AlertTriangle, Shield,
  ShoppingCart, Package, Users, UserX, RefreshCw,
  Zap, Target, Eye, Filter, ArrowUp, ArrowDown,
  Clock, Star, Wallet, Activity, Bell, DollarSign,
} from 'lucide-react'
import {
  predictGlobalSales, predictStockout, getAutoReorderSuggestions,
  analyzeABC, segmentCustomers, getSegmentStats, detectSalesAnomalies,
  getSecurityScore, getTrendingProducts, getMostDemandedProducts,
  getAIKeyMetrics, predictMonthlyRevenue, getPriceOptimization,
  getProactiveAlerts, predictChurn,
} from '../lib/ai'
import { getProducts, getVentes } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { useSector } from '../context/SectorContext'

const TABS = [
  { key: 'apercu', label: 'Aperçu', icon: BarChart3 },
  { key: 'ventes', label: 'Prédictions', icon: TrendingUp },
  { key: 'stock', label: 'Prévisions Stock', icon: Package },
  { key: 'clients', label: 'Clients', icon: Users },
  { key: 'securite', label: 'Sécurité', icon: Shield },
  { key: 'prix', label: 'Prix', icon: DollarSign },
  { key: 'alertes', label: 'Alertes', icon: Bell },
]

export default function IAPage() {
  const { user } = useAuth()
  const { isFiltered, sectorProductNames } = useSector()
  const [tab, setTab] = useState('apercu')

  const metrics = useMemo(() => getAIKeyMetrics(), [])
  const salesPrediction = useMemo(() => predictGlobalSales(7), [])
  const monthlyPrediction = useMemo(() => predictMonthlyRevenue(), [])
  const stockAlerts = useMemo(() => predictStockout(), [])
  const reorderSuggestions = useMemo(() => getAutoReorderSuggestions(), [])
  const abcAnalysis = useMemo(() => analyzeABC(), [])
  const customerSegments = useMemo(() => getSegmentStats(), [])
  const segmentedCustomers = useMemo(() => segmentCustomers(), [])
  const anomalies = useMemo(() => detectSalesAnomalies(), [])
  const security = useMemo(() => getSecurityScore(), [])
  const trending = useMemo(() => {
    const t = getTrendingProducts()
    if (!isFiltered) return t
    return t.filter(p => sectorProductNames.has(p.nom))
  }, [isFiltered, sectorProductNames])
  const topProducts = useMemo(() => {
    const t = getMostDemandedProducts(10)
    if (!isFiltered) return t
    return t.filter(p => sectorProductNames.has(p.nom))
  }, [isFiltered, sectorProductNames])
  const priceOptim = useMemo(() => getPriceOptimization(), [])
  const proactiveAlerts = useMemo(() => getProactiveAlerts(), [])

  const TrendIcon = ({ trend }) => {
    if (trend === 'hausse' || trend === 'en Hausse' || trend === 'croissance') return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === 'baisse' || trend === 'en Baisse' || trend === 'décroissance') return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const SeverityBadge = ({ severity }) => {
    const styles = {
      critique: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
      attention: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      ok: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    }
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${styles[severity] || styles.info}`}>{severity}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold dark:text-white">Analyses & Prévisions</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Statistiques avancées & recommandations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {proactiveAlerts.filter(a => a.severity === 'critique').length > 0 && (
            <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
              <Bell className="w-3 h-3 inline mr-1" />
              {proactiveAlerts.filter(a => a.severity === 'critique').length} alerte(s) critique(s)
            </div>
          )}
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            security.score >= 90 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
            security.score >= 70 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
            'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            <Shield className="w-3 h-3 inline mr-1" />
            {security.score}/100
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
            {t.key === 'alertes' && proactiveAlerts.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{proactiveAlerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════ APERÇU ═══════ */}
      {tab === 'apercu' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "CA Aujourd'hui", value: metrics.todayCA.toLocaleString('fr-FR') + ' FCFA', sub: `${metrics.todayCount} ventes`, icon: Wallet, color: 'green' },
              { label: 'CA Mois', value: metrics.monthCA.toLocaleString('fr-FR') + ' FCFA', sub: `${metrics.monthCount} ventes`, icon: BarChart3, color: 'brand' },
              { label: 'Alertes Stock', value: metrics.stockCritical, sub: `${metrics.stockAlerts} au total`, icon: AlertTriangle, color: metrics.stockCritical > 0 ? 'red' : 'green' },
              { label: 'Sécurité', value: `${security.score}/100`, sub: security.rating, icon: Shield, color: security.score >= 70 ? 'green' : 'red' },
              { label: 'Churn Risks', value: metrics.churnRisks, sub: `${metrics.totalClients} clients`, icon: UserX, color: metrics.churnRisks > 0 ? 'orange' : 'green' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{kpi.label}</span>
                  <kpi.icon className={`w-4 h-4 text-${kpi.color}-500 dark:text-${kpi.color}-400`} />
                </div>
                <div className="text-xl font-bold dark:text-white">{kpi.value}</div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Proactive Alerts */}
          {proactiveAlerts.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <Bell className="w-4 h-4 text-red-500" /> Alertes Proactives ({proactiveAlerts.length})
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {proactiveAlerts.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <SeverityBadge severity={a.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate dark:text-gray-200">{a.title}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{a.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Prediction */}
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <TrendingUp className="w-4 h-4 text-brand-500" /> Prédictions (7j — Holt-Winters)
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-brand-700 dark:text-brand-300">{salesPrediction.prediction.toLocaleString('fr-FR')} FCFA</div>
                  <div className="text-[11px] text-brand-600 dark:text-brand-400">CA prévu</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{monthlyPrediction.prediction.toLocaleString('fr-FR')} FCFA</div>
                  <div className="text-[11px] text-purple-600 dark:text-purple-400">CA Mois prochain</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <TrendIcon trend={salesPrediction.trend} />
                <span className="text-gray-600 dark:text-gray-400">
                  Tendance : <span className="font-medium capitalize">{salesPrediction.trend}</span>
                </span>
                <span className="text-gray-400 dark:text-gray-500 ml-auto">
                  Confiance: {(salesPrediction.confidence * 100).toFixed(0)}%
                </span>
              </div>
              {salesPrediction.dailyForecast?.length > 0 && (
                <div className="mt-3 flex items-end gap-1 h-12">
                  {salesPrediction.dailyForecast.map((v, i) => {
                    const max = Math.max(...salesPrediction.dailyForecast)
                    return <div key={i} className="flex-1 bg-brand-200 dark:bg-brand-800 rounded-t" style={{ height: `${max > 0 ? (v / max) * 100 : 0}%` }} title={`${v.toLocaleString('fr-FR')} FCFA`} />
                  })}
                </div>
              )}
              {monthlyPrediction.growthRate && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Croissance : <span className={`font-medium ${+monthlyPrediction.growthRate > 0 ? 'text-green-600' : 'text-red-500'}`}>{monthlyPrediction.growthRate}%</span>
                  {monthlyPrediction.trendDirection && <span className="ml-2">({monthlyPrediction.trendDirection})</span>}
                </div>
              )}
            </div>

            {/* Stock Alerts */}
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Alertes Stock
              </h3>
              {stockAlerts.length === 0 ? (
                <div className="text-center py-6 text-green-600 dark:text-green-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Tous les stocks sont OK</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {stockAlerts.slice(0, 8).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <SeverityBadge severity={a.severity} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate dark:text-gray-200">{a.produit.nom}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">
                          {a.stockActuel} u. · ~{a.joursRestants === Infinity ? '∞' : `${a.joursRestants}j`}
                        </div>
                      </div>
                      <TrendIcon trend={a.tendance} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
                <Zap className="w-4 h-4 text-gold-500" /> Produits Tendance
              </h3>
              {trending.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Pas assez de données</p>
              ) : (
                <div className="space-y-2">
                  {trending.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <span className="w-6 h-6 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium dark:text-gray-200">{t.produit.nom}</div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500">{t.unites7j} u./sem · {t.velocity7j} u./j</div>
                      </div>
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
                <Target className="w-4 h-4 text-brand-500" /> Top 5 (30j)
              </h3>
              <div className="space-y-3">
                {topProducts.slice(0, 5).map((t, i) => {
                  const maxCA = topProducts[0]?.ca30j || 1
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium dark:text-gray-200">{t.produit.nom}</span>
                          <TrendIcon trend={t.tendance} />
                        </div>
                        <span className="text-xs font-bold dark:text-gray-200">{t.ca30j.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-dark-700 rounded-full h-1.5">
                        <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full" style={{ width: `${(t.ca30j / maxCA) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {reorderSuggestions.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <RefreshCw className="w-4 h-4 text-blue-500" /> Réapprovisionnement
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                      <th className="pb-2 font-medium">Produit</th>
                      <th className="pb-2 font-medium">Classe</th>
                      <th className="pb-2 font-medium">Stock</th>
                      <th className="pb-2 font-medium">Jours</th>
                      <th className="pb-2 font-medium">Casiers</th>
                      <th className="pb-2 font-medium">Coût</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reorderSuggestions.map((r, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-dark-700 last:border-0">
                        <td className="py-2 font-medium dark:text-gray-200">{r.produit.nom}</td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.classe === 'A' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                            r.classe === 'B' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                            'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                          }`}>{r.classe}</span>
                        </td>
                        <td className="py-2 dark:text-gray-300">{r.stockActuel} u.</td>
                        <td className="py-2">
                          <span className={`font-medium ${r.joursRestants <= 3 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {r.joursRestants}j
                          </span>
                        </td>
                        <td className="py-2 font-semibold text-brand-600 dark:text-brand-400">{r.casiersRecommandes}</td>
                        <td className="py-2 dark:text-gray-300">{r.coutEstime?.toLocaleString('fr-FR')} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ PRÉDICTIONS ═══════ */}
      {tab === 'ventes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Prédiction 7 jours (Holt-Winters)</div>
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{salesPrediction.prediction.toLocaleString('fr-FR')} FCFA</div>
              {salesPrediction.intervals?.[0] && (
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  IC 95%: {salesPrediction.intervals[0].lower.toLocaleString('fr-FR')} — {salesPrediction.intervals[0].upper.toLocaleString('fr-FR')}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <TrendIcon trend={salesPrediction.trend} />
                <span className="text-xs capitalize">{salesPrediction.trend}</span>
                <span className="text-xs text-gray-400 ml-auto">RMSE: {salesPrediction.rmse}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">CA Mensuel Prédit</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{monthlyPrediction.prediction.toLocaleString('fr-FR')} FCFA</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Dernier mois: {monthlyPrediction.lastMonth?.toLocaleString('fr-FR')} FCFA
              </div>
              {monthlyPrediction.regression && (
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  R² = {monthlyPrediction.regression.r2.toFixed(2)} · {monthlyPrediction.trendDirection}
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">CA Moyen / Mois</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monthlyPrediction.avgMonthly?.toLocaleString('fr-FR')} FCFA</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Confiance: {(monthlyPrediction.confidence * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Daily forecast mini chart */}
          {salesPrediction.dailyForecast?.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <BarChart3 className="w-4 h-4 text-brand-500" /> Prévisions Quotidiennes (7 jours)
              </h3>
              <div className="flex items-end gap-2 h-32">
                {salesPrediction.dailyForecast.map((v, i) => {
                  const max = Math.max(...salesPrediction.dailyForecast)
                  const interval = salesPrediction.intervals?.[i]
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      {interval && (
                        <div className="text-[9px] text-gray-400">{interval.upper.toLocaleString('fr-FR')}</div>
                      )}
                      <div className="w-full bg-brand-200 dark:bg-brand-800 rounded-t relative" style={{ height: `${max > 0 ? (v / max) * 100 : 0}%` }}>
                        {interval && (
                          <div className="absolute inset-0 bg-brand-300/30 dark:bg-brand-700/30 rounded-t" style={{
                            marginBottom: `${max > 0 ? ((max - interval.upper) / max) * 100 : 0}%`,
                            marginTop: `${max > 0 ? ((v - interval.lower) / max) * 100 : 0}%`,
                          }} />
                        )}
                      </div>
                      <div className="text-[10px] font-medium dark:text-gray-300">{v.toLocaleString('fr-FR')}</div>
                      <div className="text-[9px] text-gray-400">J{i + 1}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Weekly pattern */}
          {salesPrediction.weeklyPattern?.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <Clock className="w-4 h-4 text-purple-500" /> Pattern Hebdomadaire
              </h3>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-2 min-w-[350px]">
                {salesPrediction.weeklyPattern.map((d, i) => (
                  <div key={i} className={`text-center p-3 rounded-xl ${d.isPeak ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : d.isLow ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-dark-700'}`}>
                    <div className="text-[10px] font-medium dark:text-gray-300">{d.jour}</div>
                    <div className="text-lg font-bold dark:text-white">{d.caMoyen.toLocaleString('fr-FR')}</div>
                    <div className={`text-[10px] ${d.ratio > 1 ? 'text-green-500' : d.ratio < 1 ? 'text-red-500' : 'text-gray-400'}`}>
                      {d.ratio > 1 ? '+' : ''}{((d.ratio - 1) * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <BarChart3 className="w-4 h-4 text-brand-500" /> Produits les Plus Demandés
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                    <th className="pb-2 font-medium">Produit</th>
                    <th className="pb-2 font-medium">Ventes 30j</th>
                    <th className="pb-2 font-medium">Unites 30j</th>
                    <th className="pb-2 font-medium">CA 30j</th>
                    <th className="pb-2 font-medium">Velocité</th>
                    <th className="pb-2 font-medium">Tendance</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                      <td className="py-2 font-medium dark:text-gray-200">{p.produit.nom}</td>
                      <td className="py-2 dark:text-gray-300">{p.totalVentes30j}</td>
                      <td className="py-2 dark:text-gray-300">{p.unites30j}</td>
                      <td className="py-2 font-semibold dark:text-gray-200">{p.ca30j.toLocaleString('fr-FR')} FCFA</td>
                      <td className="py-2 dark:text-gray-300">{p.velocity7j} u./j</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <TrendIcon trend={p.tendance} />
                          <span className="capitalize">{p.tendance}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ PRÉVISIONS STOCK ═══════ */}
      {tab === 'stock' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Target className="w-4 h-4 text-brand-500" /> Analyse ABC
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['A', 'B', 'C'].map(cl => {
                const items = abcAnalysis.filter(a => a.classe === cl)
                const totalCA = items.reduce((s, a) => s + a.ca, 0)
                const colors = { A: 'red', B: 'orange', C: 'gray' }
                const descs = { A: 'Valeur (80% du CA)', B: 'Intermédiaire (15%)', C: 'Faible (5%)' }
                return (
                  <div key={cl} className={`bg-${colors[cl]}-50 dark:bg-${colors[cl]}-900/20 rounded-xl p-4 text-center`}>
                    <div className={`text-3xl font-black text-${colors[cl]}-600 dark:text-${colors[cl]}-400`}>{cl}</div>
                    <div className="text-xs font-medium mt-1 dark:text-gray-300">{items.length} produit(s)</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{totalCA.toLocaleString('fr-FR')} FCFA</div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{descs[cl]}</div>
                  </div>
                )
              })}
            </div>
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white dark:bg-dark-800">
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                    <th className="pb-2 font-medium">Classe</th>
                    <th className="pb-2 font-medium">Produit</th>
                    <th className="pb-2 font-medium">CA 30j</th>
                    <th className="pb-2 font-medium">Cumul %</th>
                  </tr>
                </thead>
                <tbody>
                  {abcAnalysis.map((a, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-dark-700 last:border-0">
                      <td className="py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          a.classe === 'A' ? 'bg-red-100 text-red-700' : a.classe === 'B' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                        }`}>{a.classe}</span>
                      </td>
                      <td className="py-1.5 font-medium dark:text-gray-200">{a.produit.nom}</td>
                      <td className="py-1.5 dark:text-gray-300">{a.ca.toLocaleString('fr-FR')} FCFA</td>
                      <td className="py-1.5 dark:text-gray-300">{a.cumulPct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Prédictions de Rupture
            </h3>
            {stockAlerts.length === 0 ? (
              <p className="text-sm text-green-600 dark:text-green-400">✅ Tous les stocks sont suffisants</p>
            ) : (
              <div className="space-y-2">
                {stockAlerts.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 px-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-100 dark:border-dark-600">
                    <SeverityBadge severity={a.severity} />
                    <div className="flex-1">
                      <div className="text-sm font-medium dark:text-gray-200">{a.produit.nom}</div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500">
                        Stock: {a.stockActuel} u. · Seuil: {a.seuilAlerte} · ~{a.joursRestants === Infinity ? '∞' : `${a.joursRestants}j`}
                        {a.avgDaily && <span> · Moy: {a.avgDaily} u./j</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium dark:text-gray-300">7j: {a.demandePrevue7j} u.</div>
                      {a.besoinReappro > 0 && (
                        <div className="text-[11px] text-red-600 dark:text-red-400">Besoin: +{a.besoinReappro} u.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reorderSuggestions.length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <RefreshCw className="w-4 h-4 text-blue-500" /> Plan de Réapprovisionnement
              </h3>
              <div className="space-y-3">
                {reorderSuggestions.map((r, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 px-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${
                      r.classe === 'A' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                      r.classe === 'B' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                      'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400'
                    }`}>{r.classe}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium dark:text-gray-200">{r.produit.nom}</div>
                      <div className="text-[11px] text-gray-400 dark:text-gray-500">
                        {r.qteRecommandee} u. → {r.casiersRecommandes} casiers · {r.urgence}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-600 dark:text-brand-400">{r.casiersRecommandes} casiers</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{r.coutEstime?.toLocaleString('fr-FR')} FCFA</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ CLIENTS ═══════ */}
      {tab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {customerSegments.map((seg, i) => {
              const icons = { VIP: Star, Fidèle: Users, Régulier: ShoppingCart, Occasionnel: Clock, Inactif: Eye }
              const colors = { VIP: 'purple', Fidèle: 'green', Régulier: 'brand', Occasionnel: 'orange', Inactif: 'gray' }
              const SegIcon = icons[seg.segment] || Users
              return (
                <div key={i} className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-100 dark:border-dark-700 text-center">
                  <SegIcon className={`w-5 h-5 mx-auto mb-2 text-${colors[seg.segment]}-500`} />
                  <div className="text-lg font-bold dark:text-white">{seg.count}</div>
                  <div className="text-xs font-medium dark:text-gray-300">{seg.segment}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{seg.pourcentage}% · {seg.caShare}% CA</div>
                </div>
              )
            })}
          </div>

          {/* Churn Risks */}
          {segmentedCustomers.filter(c => predictChurn(c).churnScore >= 60).length > 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <UserX className="w-4 h-4 text-red-500" /> Clients à Risque de Départ
              </h3>
              <div className="space-y-2">
                {segmentedCustomers.filter(c => predictChurn(c).churnScore >= 60).slice(0, 8).map((c, i) => {
                  const churn = predictChurn(c)
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        churn.churnScore >= 70 ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      }`}>{churn.churnScore}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate dark:text-gray-200">{c.nom}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                          {churn.factors[0] || 'Analyse basée sur l\'activité'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium dark:text-gray-300">{c.totalDepense.toLocaleString('fr-FR')} FCFA</div>
                        <div className="text-[10px] text-gray-400">{c.nbAchats} achats</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Users className="w-4 h-4 text-brand-500" /> Segmentation (RFM + CLV + Churn)
            </h3>
            {segmentedCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Aucun client enregistré</p>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white dark:bg-dark-800">
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Segment</th>
                      <th className="pb-2 font-medium">Achats</th>
                      <th className="pb-2 font-medium">Total</th>
                      <th className="pb-2 font-medium">Panier</th>
                      <th className="pb-2 font-medium">Churn</th>
                      <th className="pb-2 font-medium">RFM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentedCustomers.map((c, i) => {
                      const churn = predictChurn(c)
                      return (
                        <tr key={i} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                          <td className="py-2 font-medium dark:text-gray-200">{c.nom}</td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              c.segment === 'VIP' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                              c.segment === 'Fidèle' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                              c.segment === 'Régulier' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                              c.segment === 'Occasionnel' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                              'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
                            }`}>{c.segment}</span>
                          </td>
                          <td className="py-2 dark:text-gray-300">{c.nbAchats}</td>
                          <td className="py-2 font-medium dark:text-gray-200">{c.totalDepense.toLocaleString('fr-FR')} FCFA</td>
                          <td className="py-2 dark:text-gray-300">{c.panierMoyen.toLocaleString('fr-FR')} FCFA</td>
                          <td className="py-2">
                            <div className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              churn.churnScore >= 70 ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                              churn.churnScore >= 40 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                              'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            }`}>{churn.churnScore}/100</div>
                          </td>
                          <td className="py-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map(n => (
                                <div key={n} className={`w-3 h-3 rounded-sm ${n <= c.rfm.r ? 'bg-brand-500' : 'bg-gray-200 dark:bg-dark-600'}`} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ SÉCURITÉ ═══════ */}
      {tab === 'securite' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${
                security.score >= 90 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                security.score >= 70 ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                security.score >= 50 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>{security.score}</div>
              <div>
                <div className="text-lg font-bold dark:text-white">Score de Sécurité</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {security.rating} — {security.anomalies} anomalie(s)
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-red-700 dark:text-red-400">{security.critique}</div>
                <div className="text-[11px] text-red-600 dark:text-red-400">Critique(s)</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-orange-700 dark:text-orange-400">{security.attention}</div>
                <div className="text-[11px] text-orange-600 dark:text-orange-400">Attention</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{security.info}</div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400">Info</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Activity className="w-4 h-4 text-red-500" /> Anomalies
            </h3>
            {anomalies.length === 0 ? (
              <div className="text-center py-6 text-green-600 dark:text-green-400">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Aucune anomalie</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {anomalies.map((a, i) => (
                  <div key={i} className="py-3 px-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-100 dark:border-dark-600">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400 font-medium">{a.type}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{new Date(a.date).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300">{a.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ PRIX ═══════ */}
      {tab === 'prix' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <DollarSign className="w-4 h-4 text-gold-500" /> Optimisation des Prix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                    <th className="pb-2 font-medium">Produit</th>
                    <th className="pb-2 font-medium">Prix Actuel</th>
                    <th className="pb-2 font-medium">Coût</th>
                    <th className="pb-2 font-medium">Marge</th>
                    <th className="pb-2 font-medium">Élasticité</th>
                    <th className="pb-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {priceOptim.map((o, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                      <td className="py-2 font-medium dark:text-gray-200">{o.produit.nom}</td>
                      <td className="py-2 dark:text-gray-300">{o.prixActuel?.toLocaleString('fr-FR')} FCFA</td>
                      <td className="py-2 dark:text-gray-300">{o.prixCout?.toLocaleString('fr-FR')} FCFA</td>
                      <td className="py-2">
                        <span className={`font-medium ${+o.margeActuelle > 30 ? 'text-green-600 dark:text-green-400' : +o.margeActuelle > 15 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                          {o.margeActuelle}%
                        </span>
                      </td>
                      <td className="py-2 dark:text-gray-300">{o.elasticite}</td>
                      <td className="py-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 max-w-[200px]">{o.suggestion}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${
                          o.action === 'augmenter' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          o.action === 'promotion' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                          'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}>{o.action}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ALERTES ═══════ */}
      {tab === 'alertes' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
            <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
              <Bell className="w-4 h-4 text-red-500" /> Alertes Proactives ({proactiveAlerts.length})
            </h3>
            {proactiveAlerts.length === 0 ? (
              <div className="text-center py-6 text-green-600 dark:text-green-400">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Aucune alerte — tout est OK</p>
              </div>
            ) : (
              <div className="space-y-3">
                {proactiveAlerts.map((a, i) => (
                  <div key={i} className="py-4 px-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-100 dark:border-dark-600">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-xs font-semibold dark:text-gray-200">{a.title}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
