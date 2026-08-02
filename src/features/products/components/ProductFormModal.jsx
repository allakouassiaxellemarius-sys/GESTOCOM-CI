// Composant : modal d'ajout / modification d'un produit.
// Compose les sections du formulaire et gère la validation.

import { X } from 'lucide-react'
import { useProductForm } from '../hooks/useProductForm'
import { validateProduct } from '../domain/productValidation'
import { getSectorFields, getCategoryFields } from '../config/fieldSchema'
import { getSecteurById } from '../config/sectorCatalog'
import { CATEGORY_ICONS } from '../config/categories'
import IdentityFields from './IdentityFields'
import ClassificationFields from './ClassificationFields'
import PricingFields from './PricingFields'
import StockFields from './StockFields'
import DynamicFieldsSection from './DynamicFieldsSection'

export default function ProductFormModal({ product, onSave, onClose }) {
  const hook = useProductForm(product)
  const { form, setForm, setField, errors, setErrorsAll, isEdit, marginInfo, handleCostPriceChange } = hook

  const secteur = form.secteur || 'detail'
  const secteurInfo = getSecteurById(secteur)
  const categorie = form.categorie

  const handleSave = () => {
    const errs = validateProduct(form)
    setErrorsAll(errs)
    if (Object.keys(errs).length > 0) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">{isEdit ? 'Modifier' : 'Ajouter'} un produit</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 touch-target"><X className="w-5 h-5 dark:text-gray-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <IdentityFields form={form} setField={setField} errors={errors} hook={hook} />
          <ClassificationFields form={form} setField={setField} setForm={setForm} />
          <PricingFields form={form} setField={setField} marginInfo={marginInfo} handleCostPriceChange={handleCostPriceChange} errors={errors} />
          <StockFields form={form} setField={setField} errors={errors} />

          <DynamicFieldsSection
            title={secteurInfo ? `Champs spécifiques — ${secteurInfo.icon} ${secteurInfo.nom}` : 'Champs spécifiques'}
            fields={getSectorFields(secteur)}
            form={form}
            setForm={setForm}
          />
          {secteur === 'detail' && categorie && categorie !== 'Autre' && (
            <DynamicFieldsSection
              title={`${CATEGORY_ICONS[categorie] || '📦'} Champs spécifiques — ${categorie}`}
              fields={getCategoryFields(categorie)}
              form={form}
              setForm={setForm}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={handleSave} className="btn-primary text-sm py-2 px-4" disabled={!form.nom?.trim()}>
            {isEdit ? 'Modifier' : 'Créer le produit'}
          </button>
        </div>
      </div>
    </div>
  )
}
