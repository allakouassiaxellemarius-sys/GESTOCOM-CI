// Composant : section classification (secteur, catégorie, unité).

import { SECTEURS_COMMERCE } from '../config/sectorCatalog'
import { getCategories, getUnites } from '../config/categories'

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white'
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

export default function ClassificationFields({ form, setField, setForm }) {
  const secteur = form.secteur || 'detail'
  const categories = getCategories(secteur)
  const unites = getUnites(secteur)

  const handleSecteurChange = (value) => {
    setForm(prev => ({ ...prev, secteur: value, categorie: '', unite: (getUnites(value)[0] || 'pièce') }))
  }

  return (
    <>
      <div>
        <label className={LABEL_CLASS}>Secteur *</label>
        <select value={form.secteur} onChange={e => handleSecteurChange(e.target.value)} className={INPUT_CLASS}>
          {SECTEURS_COMMERCE.map(s => <option key={s.id} value={s.id}>{s.icon} {s.nom}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL_CLASS}>Catégorie</label>
        <select value={form.categorie} onChange={e => setField('categorie', e.target.value)} className={INPUT_CLASS}>
          <option value="">-- Choisir --</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className={LABEL_CLASS}>Unité</label>
        <select value={form.unite} onChange={e => setField('unite', e.target.value)} className={INPUT_CLASS}>
          {unites.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </>
  )
}
