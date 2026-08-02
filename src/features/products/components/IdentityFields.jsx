// Composant : section identification (image, nom, référence, code-barres).

import { Sparkles, ScanBarcode } from 'lucide-react'
import { BarcodeValue } from '../../../components/BarcodeLabel'
import BarcodeScanner from '../../../components/BarcodeScanner'
import ImageField from './ImageField'
import NameSuggestions from './NameSuggestions'
import { getSecteurById, SECTEUR_PREFIX_REFERENCE } from '../config/sectorCatalog'

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white'
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

export default function IdentityFields({ form, setField, errors, hook }) {
  const { isEdit } = hook
  const secteur = form.secteur || 'detail'
  const secteurInfo = getSecteurById(secteur)

  return (
    <>
      <div>
        <label className={LABEL_CLASS}>Image</label>
        <ImageField value={form.image} onChange={(img) => setField('image', img)} />
      </div>

      {/* Code-barres existant en édition */}
      {isEdit && form.barcode && (
        <div className="col-span-2 p-3 bg-gray-50 dark:bg-dark-700 rounded-xl flex items-center gap-4">
          <BarcodeValue value={form.barcode} width={1} height={35} fontSize={10} />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="font-medium text-gray-700 dark:text-gray-300">Code-barres auto-généré</div>
            <div>{form.barcode}</div>
          </div>
        </div>
      )}

      {/* Nom avec suggestions */}
      <div className="col-span-2 relative">
        <label className={LABEL_CLASS}>Nom * {isEdit && <span className="text-gray-400">(automatique)</span>}</label>
        <div className="relative">
          <input ref={hook.nameRef} value={form.nom} onChange={e => setField('nom', e.target.value)}
            className={`${INPUT_CLASS} ${errors.nom ? 'border-red-400' : ''}`} />
          {!isEdit && form.nom && <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />}
        </div>
        {errors.nom && <p className="text-[10px] text-red-500 mt-0.5">{errors.nom}</p>}
        <NameSuggestions
          suggestions={hook.nameSuggestions}
          visible={hook.showSuggestions}
          inputRef={hook.nameRef}
          suggestionsRef={hook.suggestionsRef}
          onPick={hook.handleQuickFill}
        />
      </div>

      {/* Référence */}
      <div>
        <label className={LABEL_CLASS}>
          Référence {!isEdit && <span className="text-green-500">(auto)</span>}
        </label>
        <input value={form.reference} onChange={e => setField('reference', e.target.value)}
          className={`${INPUT_CLASS} ${errors.reference ? 'border-red-400' : ''}`}
          placeholder={isEdit ? '' : 'Générée automatiquement'} />
        {!isEdit && !form.reference && (
          <p className="text-[10px] text-green-500 mt-0.5">
            Sera générée: {secteurInfo ? secteurInfo.icon : ''} {SECTEUR_PREFIX_REFERENCE[secteur] || 'PRD'}-XXXX
          </p>
        )}
        {errors.reference && <p className="text-[10px] text-red-500 mt-0.5">{errors.reference}</p>}
      </div>

      {/* Code-barres avec scanner */}
      <div>
        <label className={LABEL_CLASS}>
          Code-barres {!isEdit && <span className="text-green-500">(auto)</span>}
        </label>
        <div className="flex gap-1.5">
          <input value={form.barcode} onChange={e => setField('barcode', e.target.value)}
            className={`${INPUT_CLASS} flex-1 font-mono ${errors.barcode ? 'border-red-400' : ''}`}
            placeholder={isEdit ? '' : 'GCI000001'} />
          <button type="button" onClick={() => hook.setShowScanner(true)}
            className="px-3 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors touch-target"
            title="Scanner un code-barres">
            <ScanBarcode className="w-4 h-4" />
          </button>
        </div>
        {!isEdit && !form.barcode && (
          <p className="text-[10px] text-green-500 mt-0.5">Sera généré automatiquement à la sauvegarde</p>
        )}
        {errors.barcode && <p className="text-[10px] text-red-500 mt-0.5">{errors.barcode}</p>}
      </div>

      {hook.showScanner && <BarcodeScanner onScan={hook.handleScan} onClose={() => hook.setShowScanner(false)} />}
    </>
  )
}
