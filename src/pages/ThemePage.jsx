import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { changerMotDePasse } from '../lib/db'
import { useState } from 'react'
import { Palette, Sun, Moon, Minus, Plus, Lock } from 'lucide-react'

export default function ThemePage() {
  const { fontScale, setFontScale, darkMode, setDarkMode } = useTheme()
  const { user } = useAuth()
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [msg, setMsg] = useState('')

  const handlePassword = () => {
    setMsg('')
    if (!ancien || !nouveau) { setMsg('Remplissez les deux champs'); return }
    const ok = changerMotDePasse(user.id, ancien, nouveau)
    if (ok) { setMsg('Mot de passe modifié avec succès'); setAncien(''); setNouveau('') }
    else setMsg('Ancien mot de passe incorrect')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Paramètres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thème */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Palette className="w-5 h-5 text-brand-500" /> Affichage
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Taille de la police</label>
            <div className="flex items-center gap-4">
              <button onClick={() => setFontScale(Math.max(0.7, fontScale - 0.1))} className="w-8 h-8 rounded-lg border dark:border-dark-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700">
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <input type="range" min={0.7} max={1.5} step={0.1} value={fontScale} onChange={e => setFontScale(+e.target.value)} className="w-full" />
              </div>
              <button onClick={() => setFontScale(Math.min(1.5, fontScale + 0.1))} className="w-8 h-8 rounded-lg border dark:border-dark-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700">
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium w-12 text-center dark:text-gray-300">{Math.round(fontScale * 100)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Thème</label>
            <div className="flex gap-3">
              <button
                onClick={() => setDarkMode(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  !darkMode ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
                }`}
              >
                <Sun className="w-4 h-4" /> Jour
              </button>
              <button
                onClick={() => setDarkMode(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  darkMode ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500 dark:bg-dark-700 dark:text-gray-300 dark:border-dark-600'
                }`}
              >
                <Moon className="w-4 h-4" /> Nuit
              </button>
            </div>
          </div>
        </div>

        {/* Mot de passe */}
        <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Lock className="w-5 h-5 text-gold-500" /> Changer le mot de passe
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mot de passe actuel</label>
              <input type="password" value={ancien} onChange={e => setAncien(e.target.value)} className="w-full px-3 py-2 border dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nouveau mot de passe</label>
              <input type="password" value={nouveau} onChange={e => setNouveau(e.target.value)} className="w-full px-3 py-2 border dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            </div>
            {msg && <p className={`text-sm ${msg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
            <button onClick={handlePassword} className="btn-primary text-sm py-2 px-4">Modifier</button>
          </div>
        </div>
      </div>
    </div>
  )
}
