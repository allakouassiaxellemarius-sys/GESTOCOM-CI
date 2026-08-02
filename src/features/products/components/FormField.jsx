// Composant : champ de formulaire générique (text, number, date, select, checkbox, textarea).

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white'
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

export default function FormField({ field, value, onChange, error, fullWidth = false }) {
  const base = { ...field, label: field.label }
  const showError = !!error

  if (field.type === 'checkbox') {
    return (
      <label className={`${fullWidth ? 'col-span-2' : ''} flex items-center gap-2 cursor-pointer`}>
        <input type="checkbox" checked={!!value} onChange={e => onChange(field.key, e.target.checked)}
          className="rounded border-gray-300 dark:border-dark-600 text-brand-500" />
        <span className="text-sm dark:text-gray-300">{base.label}</span>
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <div className={fullWidth ? 'col-span-2' : ''}>
        <label className={LABEL_CLASS}>{base.label}</label>
        <select value={value ?? ''} onChange={e => onChange(field.key, e.target.value)} className={INPUT_CLASS}>
          <option value="">--</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {showError && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className={fullWidth ? 'col-span-2' : ''}>
        <label className={LABEL_CLASS}>{base.label}</label>
        <textarea value={value ?? ''} rows={field.rows || 2} placeholder={field.placeholder || ''}
          onChange={e => onChange(field.key, e.target.value)} className={INPUT_CLASS} />
        {showError && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
      </div>
    )
  }

  const isNumber = field.type === 'number'
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <label className={LABEL_CLASS}>{base.label}</label>
      <input
        type={isNumber ? 'number' : field.type || 'text'}
        value={value ?? ''}
        placeholder={field.placeholder || ''}
        onChange={e => onChange(field.key, isNumber ? +e.target.value : e.target.value)}
        className={`${INPUT_CLASS} ${showError ? 'border-red-400' : ''}`}
      />
      {showError && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
