import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart,
  ChevronRight, Check, Zap,
} from 'lucide-react'
import { SECTORS, MODULE_LABELS } from '../lib/modules'
import { getCompanySettings, saveCompanySettings } from '../lib/db'
import { addLog } from '../lib/db'

const ICONS = { ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart }

const COLOR_CLASSES = {
  brand: 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600',
  emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
  amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  sky: 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600',
  rose: 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600',
  violet: 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600',
  teal: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600',
}

const ICON_BG = {
  brand: 'bg-brand-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
}

export default function ModuleSelectorPage() {
  const navigate = useNavigate()
  const [enabledSectors, setEnabledSectors] = useState(() => {
    const settings = getCompanySettings()
    return settings.enabledSectors || ['commerce']
  })
  const [showModules, setShowModules] = useState(null)

  const toggleSector = (sectorId) => {
    setEnabledSectors(prev =>
      prev.includes(sectorId)
        ? prev.filter(s => s !== sectorId)
        : [...prev, sectorId]
    )
  }

  const saveAndContinue = () => {
    const settings = getCompanySettings()
    saveCompanySettings({ ...settings, enabledSectors, modulesConfigured: true })
    addLog('Modules configurés', enabledSectors.join(', '))
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-2">Bienvenue sur GESTOCOM CI</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Configurez les modules adaptés à votre activité. Vous pouvez activer plusieurs secteurs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Object.values(SECTORS).map(sector => {
              const Icon = ICONS[sector.icon] || ShoppingCart
              const enabled = enabledSectors.includes(sector.id)
              return (
                <div key={sector.id}>
                  <button
                    onClick={() => toggleSector(sector.id)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      enabled
                        ? `${COLOR_CLASSES[sector.color]} border-current shadow-lg`
                        : 'border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-gray-300 dark:hover:border-dark-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        enabled ? 'bg-white/80 dark:bg-white/10' : 'bg-gray-100 dark:bg-dark-700'
                      }`}>
                        <Icon className={`w-5 h-5 ${enabled ? 'text-current' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      {enabled && (
                        <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className={`font-semibold mb-1 ${enabled ? '' : 'dark:text-white'}`}>{sector.nom}</h3>
                    <p className={`text-xs ${enabled ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {sector.description}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowModules(showModules === sector.id ? null : sector.id) }}
                      className="mt-3 text-xs font-medium flex items-center gap-1 opacity-70 hover:opacity-100"
                    >
                      {sector.modules.length} modules <ChevronRight className={`w-3 h-3 transition-transform ${showModules === sector.id ? 'rotate-90' : ''}`} />
                    </button>
                  </button>

                  {showModules === sector.id && (
                    <div className="mt-2 p-3 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700">
                      {sector.modules.map(mod => (
                        <div key={mod} className="flex items-center gap-2 py-1.5 text-sm text-gray-600 dark:text-gray-400">
                          <Check className="w-3.5 h-3.5 text-green-500" />
                          {MODULE_LABELS[mod]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={saveAndContinue}
              disabled={enabledSectors.length === 0}
              className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer avec {enabledSectors.length} secteur{enabledSectors.length > 1 ? 's' : ''}
            </button>
            <button onClick={() => navigate('/app')} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Passer cette étape
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
