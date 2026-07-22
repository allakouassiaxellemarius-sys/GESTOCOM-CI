import { useState, useEffect } from 'react'
import { addLicence, updateLicence, generateCleLicence } from '../lib/logicielsDb'
import { X, Save, Key, RefreshCw } from 'lucide-react'

export default function LicenceModal({ isOpen, licence, logicielId, onClose, onSaved }) {
  const [form, setForm] = useState({ cle: '', client_nom: '', client_email: '', date_activation: '', date_expiration: '', max_installations: '1', notes: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (licence) setForm({
      cle: licence.cle || '', client_nom: licence.client_nom || '', client_email: licence.client_email || '',
      date_activation: licence.date_activation ? licence.date_activation.slice(0, 10) : '',
      date_expiration: licence.date_expiration ? licence.date_expiration.slice(0, 10) : '',
      max_installations: String(licence.max_installations || 1), notes: licence.notes || '',
    })
    else setForm({ cle: generateCleLicence(), client_nom: '', client_email: '', date_activation: new Date().toISOString().slice(0, 10), date_expiration: '', max_installations: '1', notes: '' })
  }, [licence, isOpen])

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!form.client_nom.trim()) { setError('Le nom du client est requis.'); return }
      const data = { ...form, max_installations: Number(form.max_installations) || 1, date_activation: form.date_activation ? new Date(form.date_activation).toISOString() : null, date_expiration: form.date_expiration ? new Date(form.date_expiration).toISOString() : null }
      if (licence) updateLicence(licence.id, data)
      else addLicence({ logicielId, ...data })
      onSaved?.(); onClose()
    } catch { setError('Erreur.') }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70" onClick={onClose}>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2"><Key className="w-5 h-5 text-brand-600" /><h2 className="text-lg font-semibold dark:text-white">{licence ? 'Modifier' : 'Créer'} une licence</h2></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clé de licence</label>
            <div className="flex gap-1">
              <input type="text" value={form.cle} onChange={e => update('cle', e.target.value)}
                className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-mono bg-white dark:bg-dark-700 dark:text-white" />
              <button type="button" onClick={() => update('cle', generateCleLicence())}
                className="px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom du client *</label>
            <input type="text" value={form.client_nom} onChange={e => update('client_nom', e.target.value)} placeholder="Nom de l'entreprise ou du client"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email client</label>
            <input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} placeholder="client@email.com"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Activation</label>
              <input type="date" value={form.date_activation} onChange={e => update('date_activation', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration</label>
              <input type="date" value={form.date_expiration} onChange={e => update('date_expiration', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max installations</label>
            <input type="number" value={form.max_installations} onChange={e => update('max_installations', e.target.value)} min="1"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Annuler</button>
            <button type="submit" disabled={loading || !form.client_nom.trim()}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {licence ? 'Modifier' : 'Créer'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
