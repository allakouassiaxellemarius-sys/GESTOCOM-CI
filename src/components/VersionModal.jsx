import { useState, useEffect } from 'react'
import { addVersion, updateVersion } from '../lib/logicielsDb'
import { X, Save, Tag } from 'lucide-react'

export default function VersionModal({ isOpen, version, logicielId, onClose, onSaved }) {
  const [form, setForm] = useState({ numero: '', changelog: '', url_telechargement: '', taille: '', est_stable: true })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (version) setForm({ numero: version.numero || '', changelog: version.changelog || '', url_telechargement: version.url_telechargement || '', taille: version.taille || '', est_stable: version.est_stable !== false })
    else setForm({ numero: '', changelog: '', url_telechargement: '', taille: '', est_stable: true })
  }, [version, isOpen])

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!form.numero.trim()) { setError('Le numéro de version est requis.'); return }
      if (version) updateVersion(version.id, form)
      else addVersion({ logicielId, ...form })
      onSaved?.(); onClose()
    } catch { setError('Erreur.') }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70" onClick={onClose}>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2"><Tag className="w-5 h-5 text-brand-600" /><h2 className="text-lg font-semibold dark:text-white">{version ? 'Modifier' : 'Ajouter'} une version</h2></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro de version *</label>
            <input type="text" value={form.numero} onChange={e => update('numero', e.target.value)} placeholder="Ex: 1.0.0" autoFocus
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Changelog</label>
            <textarea value={form.changelog} onChange={e => update('changelog', e.target.value)} rows={3} placeholder="Nouveautés, corrections..."
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de téléchargement</label>
            <input type="url" value={form.url_telechargement} onChange={e => update('url_telechargement', e.target.value)} placeholder="https://..."
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Taille</label>
              <input type="text" value={form.taille} onChange={e => update('taille', e.target.value)} placeholder="Ex: 45 Mo"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700 w-full">
                <input type="checkbox" checked={form.est_stable} onChange={e => update('est_stable', e.target.checked)} className="rounded" />
                <span className="text-gray-700 dark:text-gray-300">Version stable</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Annuler</button>
            <button type="submit" disabled={loading || !form.numero.trim()}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {version ? 'Modifier' : 'Créer'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
