import { useState } from 'react'
import { addDeploiement } from '../lib/logicielsDb'
import { X, Save, HardDrive } from 'lucide-react'

export default function DeploiementModal({ isOpen, logicielId, licences = [], versions = [], onClose, onSaved }) {
  const [form, setForm] = useState({ licence_id: '', version_id: '', machine_info: '', ip: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!form.licence_id) { setError('Sélectionnez une licence.'); return }
      addDeploiement({ licenceId: Number(form.licence_id), logicielId, versionId: form.version_id ? Number(form.version_id) : null, machine_info: form.machine_info, ip: form.ip })
      setForm({ licence_id: '', version_id: '', machine_info: '', ip: '' })
      onSaved?.(); onClose()
    } catch { setError('Erreur.') }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70" onClick={onClose}>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2"><HardDrive className="w-5 h-5 text-brand-600" /><h2 className="text-lg font-semibold dark:text-white">Enregistrer un déploiement</h2></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Licence *</label>
            <select value={form.licence_id} onChange={e => update('licence_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">Sélectionner une licence</option>
              {licences.filter(l => l.statut === 'active').map(l => (
                <option key={l.id} value={l.id}>{l.cle} — {l.client_nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
            <select value={form.version_id} onChange={e => update('version_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">Sélectionner une version</option>
              {versions.filter(v => v.logiciel_id === logicielId).map(v => (
                <option key={v.id} value={v.id}>v{v.numero}{v.est_stable ? ' (stable)' : ' (beta)'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Machine / OS</label>
            <input type="text" value={form.machine_info} onChange={e => update('machine_info', e.target.value)} placeholder="Ex: Windows 11, MacBook Pro..."
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP (optionnel)</label>
            <input type="text" value={form.ip} onChange={e => update('ip', e.target.value)} placeholder="192.168.1.x"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Annuler</button>
            <button type="submit" disabled={loading || !form.licence_id}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Enregistrer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
