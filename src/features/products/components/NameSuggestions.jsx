// Composant : suggestions de produits similaires pour pré-remplissage rapide.

import { Package } from 'lucide-react'

export default function NameSuggestions({ suggestions, visible, inputRef, suggestionsRef, onPick }) {
  if (!visible || suggestions.length === 0) return null
  return (
    <div ref={suggestionsRef} className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
      <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-700">
        Produits similaires — cliquer pour pré-remplir
      </div>
      {suggestions.map(p => (
        <button key={p.id} type="button" onClick={() => onPick(p)}
          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2 text-sm transition-colors">
          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-medium dark:text-white truncate">{p.nom}</div>
            <div className="text-[11px] text-gray-400">{p.categorie} · {p.prixVente?.toLocaleString('fr-FR')} FCFA</div>
          </div>
        </button>
      ))}
    </div>
  )
}
