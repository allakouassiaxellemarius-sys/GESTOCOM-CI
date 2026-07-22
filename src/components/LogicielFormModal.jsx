import { useState, useEffect } from 'react'
import { CATEGORIES_LOGICIELS, addLogiciel, updateLogiciel } from '../lib/logicielsDb'
import { X, Save, Package } from 'lucide-react'

export default function LogicielFormModal({ isOpen, logiciel, onClose, onSaved }) {
  const [form, setForm] = useState({ nom: '', description: '', categorie: 'gestion', prix: '', devise: 'XOF', icone: '📦', couleur: 'brand' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (logiciel) setForm({ nom: logiciel.nom || '', description: logiciel.description || '', categorie: logiciel.categorie || 'gestion', prix: logiciel.prix || '', devise: logiciel.devise || 'XOF', icone: logiciel.icone || '📦', couleur: logiciel.couleur || 'brand' })
    else setForm({ nom: '', description: '', categorie: 'gestion', prix: '', devise: 'XOF', icone: '📦', couleur: 'brand' })
  }, [logiciel, isOpen])

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!form.nom.trim()) { setError('Le nom est requis.'); return }
      if (logiciel) updateLogiciel(logiciel.id, form)
      else addLogiciel(form)
      onSaved?.(); onClose()
    } catch { setError('Erreur lors de l\'enregistrement.') }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70" onClick={onClose}>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2"><Package className="w-5 h-5 text-brand-600" /><h2 className="text-lg font-semibold dark:text-white">{logiciel ? 'Modifier' : 'Ajouter'} un logiciel</h2></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input type="text" value={form.nom} onChange={e => update('nom', e.target.value)} placeholder="Ex: Mon Logiciel"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
              <select value={form.categorie} onChange={e => update('categorie', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                {CATEGORIES_LOGICIELS.map(c => <option key={c.key} value={c.key}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prix</label>
              <div className="flex gap-1">
                <input type="number" value={form.prix} onChange={e => update('prix', e.target.value)} placeholder="0"
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
                <select value={form.devise} onChange={e => update('devise', e.target.value)}
                  className="w-20 px-2 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icône (emoji)</label>
            <input type="text" value={form.icone} onChange={e => update('icone', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Annuler</button>
            <button type="submit" disabled={loading || !form.nom.trim()}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {logiciel ? 'Modifier' : 'Créer'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
