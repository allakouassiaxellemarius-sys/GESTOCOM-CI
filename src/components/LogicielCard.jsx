import { getCategoryInfo, STATUTS_LOGICIEL } from '../lib/logicielsDb'
import { BarChart3, Layers, Users, ShoppingCart, Smartphone, Globe, Wrench, Sparkles, Package } from 'lucide-react'

const ICON_MAP = { BarChart3, Layers, Users, ShoppingCart, Smartphone, Globe, Wrench, Sparkles, Package }

export default function LogicielCard({ logiciel, onClick, versions = [], licences = [] }) {
  const cat = getCategoryInfo(logiciel.categorie)
  const statut = STATUTS_LOGICIEL[logiciel.statut] || STATUTS_LOGICIEL.brouillon
  const latestVersion = versions.filter(v => v.logiciel_id === logiciel.id).sort((a, b) => b.numero.localeCompare(a.numero, undefined, { numeric: true }))[0]
  const licenceCount = licences.filter(l => l.logiciel_id === logiciel.id && l.statut === 'active').length
  const Icon = ICON_MAP[cat?.icone] || Package

  return (
    <button onClick={() => onClick?.(logiciel)}
      className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all text-left w-full">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-brand-50 dark:bg-brand-900/20">
          {logiciel.icone || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{logiciel.nom}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statut.color}`}>{statut.label}</span>
          </div>
          {logiciel.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{logiciel.description}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400">
              {cat?.nom || logiciel.categorie}
            </span>
            {latestVersion && <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">v{latestVersion.numero}</span>}
            {licenceCount > 0 && <span className="text-[10px] text-gray-400">{licenceCount} licence{licenceCount > 1 ? 's' : ''}</span>}
            {logiciel.prix > 0 && <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{logiciel.prix.toLocaleString('fr-FR')} {logiciel.devise}</span>}
          </div>
        </div>
      </div>
    </button>
  )
}
