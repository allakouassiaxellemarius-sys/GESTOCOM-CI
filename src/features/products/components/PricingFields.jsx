// Composant : section prix (achat, vente, marge min) avec indicateur de marge en direct.

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white'
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'

export default function PricingFields({ form, setField, marginInfo, handleCostPriceChange, errors }) {
  return (
    <>
      <div>
        <label className={LABEL_CLASS}>Prix d'achat (FCFA)</label>
        <input type="number" value={form.prixAchat} onChange={e => handleCostPriceChange(e.target.value)}
          className={`${INPUT_CLASS} ${errors.prixAchat ? 'border-red-400' : ''}`} />
        {errors.prixAchat && <p className="text-[10px] text-red-500 mt-0.5">{errors.prixAchat}</p>}
      </div>
      <div>
        <label className={LABEL_CLASS}>Prix de vente (FCFA)</label>
        <input type="number" value={form.prixVente} onChange={e => setField('prixVente', +e.target.value)}
          className={`${INPUT_CLASS} ${errors.prixVente ? 'border-red-400' : ''}`} />
        {errors.prixVente && <p className="text-[10px] text-red-500 mt-0.5">{errors.prixVente}</p>}
        {marginInfo && (
          <div className={`flex items-center gap-2 mt-1 text-[11px] ${marginInfo.isValid ? 'text-green-500' : 'text-amber-500'}`}>
            <span>Marge: {marginInfo.marge}%</span>
            <span>·</span>
            <span>Bénéfice: {marginInfo.benefice.toLocaleString('fr-FR')} FCFA</span>
            {!marginInfo.isValid && <span>· <b>Min: {form.margeMinimum}%</b></span>}
          </div>
        )}
      </div>
      <div>
        <label className={LABEL_CLASS}>Marge min (%)</label>
        <input type="number" value={form.margeMinimum} onChange={e => setField('margeMinimum', +e.target.value)} className={INPUT_CLASS} />
      </div>
    </>
  )
}
