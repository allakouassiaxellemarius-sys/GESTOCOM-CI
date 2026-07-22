import { X, Receipt, ArrowRight } from 'lucide-react'

const PAIEMENTS = [
  { key: 'especes', label: 'Espèces', icon: '💵' },
  { key: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { key: 'carte', label: 'Carte Bancaire', icon: '💳' },
  { key: 'credit', label: 'Crédit', icon: '📝' },
]

export default function ReceiptPreview({
  cart, getLineTotal,
  sousTotal, remiseLignes, remiseGlobale, tvaMontant, total, monnaie,
  tvaActive, tvaRate,
  modePaiement, clientNom, clientTel, notes, montantRecu,
  onClose, onValider, user,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-600">
          <h3 className="font-semibold flex items-center gap-2 dark:text-white">
            <Receipt className="w-5 h-5 text-brand-500" /> Aperçu du reçu
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
            <X className="w-5 h-5 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-5">
          <div className="text-center mb-4 pb-3 border-b dark:border-dark-600">
            <div className="font-bold text-lg dark:text-white">GESTOCOM CI</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">LES RETROUVAILLES CEZ LUICI</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">Reçu de vente</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{new Date().toLocaleDateString('fr-FR')} {new Date().toLocaleTimeString('fr-FR')}</div>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Panier vide</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {cart.map(c => {
                  const lineTotal = c.quantite * c.prixUnitaire
                  const lineDiscount = c.remiseType === 'pourcentage' ? Math.round(lineTotal * c.remise / 100) : c.remise
                  return (
                    <div key={c.produitId} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-medium dark:text-gray-200">{c.nom}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{c.quantite} × {c.prixUnitaire.toLocaleString('fr-FR')}{lineDiscount > 0 ? ` (-${lineDiscount.toLocaleString('fr-FR')})` : ''}</div>
                      </div>
                      <span className="font-medium dark:text-gray-200">{getLineTotal(c).toLocaleString('fr-FR')} F</span>
                    </div>
                  )
                })}
              </div>

              <div className="border-t dark:border-dark-600 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Sous-total</span>
                  <span>{sousTotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
                {remiseLignes > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Remises lignes</span><span>-{remiseLignes.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {remiseGlobale > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Remise globale</span><span>-{remiseGlobale.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {tvaActive && tvaMontant > 0 && (
                  <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                    <span>TVA ({tvaRate}%)</span><span>+{tvaMontant.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t dark:border-dark-600 pt-2 dark:text-white">
                  <span>TOTAL</span>
                  <span className="text-brand-600 dark:text-brand-400">{total.toLocaleString('fr-FR')} FCFA</span>
                </div>
                {modePaiement === 'especes' && montantRecu && +montantRecu >= total && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Reçu</span><span>{Number(montantRecu).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {modePaiement === 'especes' && montantRecu && +montantRecu >= total && (
                  <div className="flex justify-between text-sm font-bold text-green-700 dark:text-green-300">
                    <span>Monnaie</span><span>{monnaie.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t dark:border-dark-600 text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
                <div>Paiement: {PAIEMENTS.find(p => p.key === modePaiement)?.icon} {PAIEMENTS.find(p => p.key === modePaiement)?.label}</div>
                {clientNom && <div>Client: {clientNom}{clientTel ? ` (${clientTel})` : ''}</div>}
                <div>Caissier: {user?.nom || 'Inconnu'}</div>
                {notes && <div className="italic mt-1">"{notes}"</div>}
              </div>
            </>
          )}

          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-600 transition-all">
              Fermer
            </button>
            <button onClick={() => { onClose(); document.getElementById('valider')?.click() }} disabled={cart.length === 0}
              className="flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowRight className="w-4 h-4" /> Valider la vente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
