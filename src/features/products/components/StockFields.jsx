// Composant : section stock (quantités, seuils, entrepôt, emplacement, description).

import FormField from './FormField'

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white'
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

export default function StockFields({ form, setField, errors }) {
  return (
    <>
      <div>
        <label className={LABEL_CLASS}>Stock actuel</label>
        <input type="number" value={form.stockActuel} onChange={e => setField('stockActuel', +e.target.value)}
          className={`${INPUT_CLASS} ${errors.stockActuel ? 'border-red-400' : ''}`} />
        {errors.stockActuel && <p className="text-[10px] text-red-500 mt-0.5">{errors.stockActuel}</p>}
      </div>
      <div>
        <label className={LABEL_CLASS}>Seuil alerte</label>
        <input type="number" value={form.seuilAlerte} onChange={e => setField('seuilAlerte', +e.target.value)}
          className={`${INPUT_CLASS} ${errors.seuilAlerte ? 'border-red-400' : ''}`} />
        {errors.seuilAlerte && <p className="text-[10px] text-red-500 mt-0.5">{errors.seuilAlerte}</p>}
      </div>
      <div>
        <label className={LABEL_CLASS}>Stock min</label>
        <input type="number" value={form.stockMinimal} onChange={e => setField('stockMinimal', +e.target.value)} className={INPUT_CLASS} />
      </div>
      <div>
        <label className={LABEL_CLASS}>Stock max</label>
        <input type="number" value={form.stockMaximal} onChange={e => setField('stockMaximal', +e.target.value)} className={INPUT_CLASS} />
      </div>
      <div>
        <label className={LABEL_CLASS}>Entrepôt</label>
        <input value={form.entrepot} onChange={e => setField('entrepot', e.target.value)} className={INPUT_CLASS} placeholder="Principal" />
      </div>
      <div>
        <label className={LABEL_CLASS}>Emplacement</label>
        <input value={form.emplacement} onChange={e => setField('emplacement', e.target.value)} className={INPUT_CLASS} placeholder="Rayon A3" />
      </div>
      <div className="col-span-2">
        <FormField
          field={{ key: 'description', label: 'Description', type: 'textarea', rows: 2 }}
          value={form.description}
          onChange={(_, v) => setField('description', v)}
          fullWidth
        />
      </div>
    </>
  )
}
