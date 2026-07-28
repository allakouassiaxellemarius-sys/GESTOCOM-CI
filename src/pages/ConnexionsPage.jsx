import { useState, useEffect } from 'react'
import { getLogs, clearLogs, exportLogs } from '../lib/db'
import { useAuth } from '../context/AuthContext'
import { LogIn, LogOut, AlertTriangle, Clock, Trash2, Download, X, RefreshCw } from 'lucide-react'

const CONNEXION_ACTIONS = [
  'Connexion réussie',
  'Connexion réussie (cloud sync)',
  'Connexion 2FA réussie',
  'Connexion OTP réussie',
  'Déconnexion',
  'Session expirée',
  'Tentative échouée',
  'Inscription',
  'Mot de passe modifié',
]

const ACTION_ICONS = {
  'Connexion réussie': { icon: LogIn, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  'Connexion réussie (cloud sync)': { icon: LogIn, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
  'Connexion 2FA réussie': { icon: LogIn, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  'Connexion OTP réussie': { icon: LogIn, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  'Déconnexion': { icon: LogOut, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  'Session expirée': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'Tentative échouée': { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  'Inscription': { icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'Mot de passe modifié': { icon: RefreshCw, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
}

function formatDate(iso) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return { date, time }
}

export default function ConnexionsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')

  const refresh = () => {
    const all = getLogs()
    setLogs(all.filter(l => CONNEXION_ACTIONS.includes(l.action)).reverse())
  }

  useEffect(() => { refresh() }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Historique des connexions</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={() => { if (confirm('Effacer tout l\'historique ?')) { clearLogs(); refresh() } }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-dark-600 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Effacer
              </button>
              <button onClick={() => exportLogs()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                <Download className="w-3.5 h-3.5" /> Exporter
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Connexions', count: logs.filter(l => l.action.includes('Connexion réussie') || l.action.includes('Connexion 2FA') || l.action.includes('Connexion OTP')).length, icon: LogIn, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Déconnexions', count: logs.filter(l => l.action === 'Déconnexion' || l.action === 'Session expirée').length, icon: LogOut, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Tentatives échouées', count: logs.filter(l => l.action === 'Tentative échouée').length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Inscriptions', count: logs.filter(l => l.action === 'Inscription').length, icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-dark-800 rounded-xl p-3.5 border border-gray-100 dark:border-dark-700 flex items-center gap-3">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center`}><s.icon className={`w-4.5 h-4.5 ${s.color}`} /></div>
            <div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-base font-bold dark:text-white">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'}`}>
          Tous
        </button>
        {CONNEXION_ACTIONS.map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === a ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'}`}>
            {a}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-700">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Heure</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Utilisateur</th>
                <th className="px-4 py-3 font-medium">Détail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">Aucune connexion enregistrée</td></tr>
              ) : filtered.map(l => {
                const { date, time } = formatDate(l.timestamp)
                const meta = ACTION_ICONS[l.action] || { icon: LogIn, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-dark-700' }
                const Icon = meta.icon
                return (
                  <tr key={l.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{date}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">{time}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 ${meta.bg} rounded-lg flex items-center justify-center`}><Icon className={`w-3.5 h-3.5 ${meta.color}`} /></div>
                        <span className="dark:text-gray-200">{l.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium dark:text-white">{l.userNom || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{l.detail || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
