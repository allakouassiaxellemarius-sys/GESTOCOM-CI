// Composant : rendu dynamique des champs spécifiques (secteur + catégorie).
// Remplace les anciens composants SectorSpecificFields et CategorySpecificFields.

import FormField from './FormField'

export default function DynamicFieldsSection({ title, icon, fields, form, setForm, errorKey }) {
  if (!fields || fields.length === 0) return null
  const specs = form.specifications || {}

  const handleChange = (key, value) => {
    setForm({ ...form, specifications: { ...specs, [key]: value } })
  }

  return (
    <div className="col-span-2 mt-2 pt-3 border-t border-gray-100 dark:border-dark-600">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
        {icon && <span className="mr-1">{icon}</span>}{title}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => (
          <FormField
            key={f.key}
            field={f}
            value={specs[f.key] ?? f.default}
            onChange={handleChange}
            error={errorKey && errorKey(f.key)}
            fullWidth={f.type === 'checkbox'}
          />
        ))}
      </div>
    </div>
  )
}
