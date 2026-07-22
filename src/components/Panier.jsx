import { ShoppingCart, Plus, Minus, Trash2, Percent, AlertTriangle, StickyNote, CircleDollarSign, FileText, Eye, X } from 'lucide-react'

const PAIEMENTS = [
  { key: 'especes', label: 'Espèces', icon: '💵' },
  { key: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { key: 'carte', label: 'Carte Bancaire', icon: '💳' },
  { key: 'credit', label: 'Crédit', icon: '📝' },
]

export default function Panier({
  open, onClose,
  cart, updateQty, setQtyDirect, removeFromCart, updateLineRemise, updateLineRemiseType, getLineTotal,
  remise, setRemise, remiseType, setRemiseType,
  modePaiement, setModePaiement,
  clientNom, setClientNom, clientTel, setClientTel, clientFidelite, setClientFidelite,
  refPaiement, setRefPaiement, montantRecu, setMontantRecu, notes, setNotes,
  sousTotal, remiseLignes, remiseGlobale, totalAfterDiscounts, tvaMontant, total, monnaie, hasExcessDiscount,
  tvaActive, tvaRate, remiseMaxTaux,
  dragOverCart, onDrop, onDragOver, onDragLeave,
  qtyFlash, onPreview, onValider, user,
}) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
      <div
        id="panier"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`fixed right-0 top-0 h-full w-full max-w-[360px] bg-gray-50 dark:bg-dark-900 border-l-2 p-4 overflow-y-auto z-50 shadow-[-4px_0_20px_rgba(0,0,0,0.1)] transition-all duration-300 ${
          dragOverCart ? 'border-brand-400 bg-brand-50/30 dark:bg-brand-900/10' : 'border-gray-200 dark:border-dark-600'
        }`}
      >
      <h3 className="font-semibold flex items-center justify-center gap-2 dark:text-white mb-4 pb-3 border-b dark:border-dark-600">
        <ShoppingCart className="w-5 h-5 text-brand-500" /> Panier
        {cart.length > 0 && (
          <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">{cart.length}</span>
        )}
        <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </h3>

      {cart.length === 0 ? (
        <div className={`text-center py-16 transition-colors ${dragOverCart ? 'text-brand-500' : 'text-gray-400 dark:text-gray-500'}`}>
          <ShoppingCart className={`w-12 h-12 mx-auto mb-3 ${dragOverCart ? 'text-brand-400 animate-bounce' : 'opacity-20'}`} />
          <p className="text-sm">{dragOverCart ? 'Déposez ici !' : 'Panier vide'}</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            {dragOverCart ? 'Ajoutez le produit au panier' : 'Glissez un produit ici ou cliquez pour ajouter'}
          </p>
        </div>
      ) : (
        <>
          {/* Remise globale */}
          <div className="border-b dark:border-dark-600 pb-3 mb-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <Percent className="w-3 h-3" /> Remise globale
            </label>
            <div className="flex gap-2">
              <select value={remiseType} onChange={e => setRemiseType(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-700 focus:outline-none dark:text-white">
                <option value="montant">FCFA</option>
                <option value="pourcentage">%</option>
              </select>
              <input type="number" min={0} value={remise} onChange={e => setRemise(Math.max(0, +e.target.value))}
                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white dark:bg-dark-700 dark:text-white" placeholder="0" />
            </div>
            {hasExcessDiscount && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Remise dépasse {remiseMaxTaux}% du total</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-3 mb-4 max-h-[calc(100vh-480px)] overflow-y-auto pr-1">
            {cart.map(c => {
              const presets = [1, 6, 12, 24, 30]
              const lineTotal = c.quantite * c.prixUnitaire
              const lineDiscount = c.remiseType === 'pourcentage' ? Math.round(lineTotal * c.remise / 100) : c.remise
              const isFlashing = qtyFlash === c.produitId
              return (
                <div key={c.produitId}
                  className={`py-2 border-b border-gray-200 dark:border-dark-600 last:border-0 transition-colors ${isFlashing ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate dark:text-gray-200">{c.nom}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{c.prixUnitaire.toLocaleString('fr-FR')} FCFA/u</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(c.produitId, -1)} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-dark-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-dark-500">
                        <Minus className="w-3 h-3" />
                      </button>
                      <input type="number" min={1} value={c.quantite} onChange={e => setQtyDirect(c.produitId, e.target.value)}
                        className={`w-12 text-center text-sm font-medium border-0 bg-transparent focus:outline-none dark:text-white ${isFlashing ? 'text-red-600 dark:text-red-400' : ''}`} />
                      <button onClick={() => updateQty(c.produitId, 1)} className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-dark-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-dark-500">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(c.produitId)} className="w-7 h-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center text-red-400 ml-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-wrap mb-1.5">
                    {presets.map(q => (
                      <button key={q} onClick={() => setQtyDirect(c.produitId, q)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          c.quantite === q ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-dark-500'
                        }`}>
                        {q}
                      </button>
                    ))}
                    {c.quantite > c.stockMax && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white animate-pulse">
                        STOCK DÉPASSÉ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Remise:</span>
                    <select value={c.remiseType} onChange={e => updateLineRemiseType(c.produitId, e.target.value)}
                      className="px-1 py-0.5 border border-gray-200 dark:border-dark-600 rounded text-[10px] bg-white dark:bg-dark-700 dark:text-white">
                      <option value="montant">FCFA</option>
                      <option value="pourcentage">%</option>
                    </select>
                    <input type="number" min={0} value={c.remise} onChange={e => updateLineRemise(c.produitId, +e.target.value)}
                      className="w-14 px-1 py-0.5 border border-gray-200 dark:border-dark-600 rounded text-[10px] text-right bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-300" placeholder="0" />
                    {lineDiscount > 0 && (
                      <span className="text-[10px] text-red-500 dark:text-red-400 font-medium">-{lineDiscount.toLocaleString('fr-FR')}</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{c.quantite} × {c.prixUnitaire.toLocaleString('fr-FR')}</span>
                    <span className="text-xs font-semibold dark:text-gray-200">{getLineTotal(c).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Client */}
          <div className="border-t dark:border-dark-600 pt-3 mb-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Client (optionnel)</label>
            <div className="space-y-2">
              <input type="text" value={clientNom} onChange={e => setClientNom(e.target.value)}
                placeholder="Nom du client"
                className="w-full px-2 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white dark:bg-dark-700 dark:text-white" />
              <div className="flex gap-2">
                <div className="flex-1 flex items-center">
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-gray-100 dark:bg-dark-600 border border-gray-300 dark:border-dark-600 border-r-0 rounded-l-lg px-1.5 py-1.5">+225</span>
                  <input type="tel" value={clientTel} onChange={e => setClientTel(e.target.value)}
                    placeholder="XX XX XX XX XX"
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-dark-600 rounded-r-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <input type="text" value={clientFidelite} onChange={e => setClientFidelite(e.target.value)}
                  placeholder="Fidélité"
                  className="w-20 px-2 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              {(modePaiement === 'mobile_money' || modePaiement === 'carte') && (
                <input type="text" value={refPaiement} onChange={e => setRefPaiement(e.target.value)}
                  placeholder="Réf. transaction"
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white dark:bg-dark-700 dark:text-white" />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="border-t dark:border-dark-600 pt-3 mb-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
              <StickyNote className="w-3 h-3" /> Notes (optionnel)
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ajouter une note à cette vente..."
              rows={2}
              className="w-full px-2 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white dark:bg-dark-700 dark:text-white resize-none" />
          </div>

          {/* Mode de paiement */}
          <div className="border-t dark:border-dark-600 pt-3 mb-3">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-2">
              {PAIEMENTS.map(pm => (
                <button key={pm.key} onClick={() => setModePaiement(pm.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    modePaiement === pm.key
                      ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-dark-500'
                  }`}>
                  <span>{pm.icon}</span> {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="border-t dark:border-dark-600 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Sous-total ({cart.reduce((s, c) => s + c.quantite, 0)} u.)</span>
              <span>{sousTotal.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {remiseLignes > 0 && (
              <div className="flex justify-between text-sm text-red-500 dark:text-red-400">
                <span>Remises lignes</span>
                <span>-{remiseLignes.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            {remiseGlobale > 0 && (
              <div className="flex justify-between text-sm text-red-500 dark:text-red-400">
                <span>Remise globale</span>
                <span>-{remiseGlobale.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            {tvaActive && tvaMontant > 0 && (
              <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                <span>TVA ({tvaRate}%)</span>
                <span>+{tvaMontant.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}

            <div className="flex justify-between text-2xl font-bold pt-2 dark:text-white border-t dark:border-dark-600">
              <span>Total</span>
              <span className="text-brand-600 dark:text-brand-400">{total.toLocaleString('fr-FR')} FCFA</span>
            </div>

            {modePaiement === 'especes' && (
              <div className="pt-2">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <CircleDollarSign className="w-3 h-3" /> Montant reçu
                </label>
                <div className="flex gap-2 items-center">
                  <input type="number" min={0} value={montantRecu} onChange={e => setMontantRecu(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white dark:bg-dark-700 dark:text-white font-semibold"
                    placeholder="Montant reçu du client..." />
                </div>
                {montantRecu && +montantRecu >= total && (
                  <div className="flex justify-between items-center mt-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Monnaie à rendre</span>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">{monnaie.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
                {montantRecu && +montantRecu < total && (
                  <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Montant insuffisant — reste {(total - +montantRecu).toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button onClick={onPreview} disabled={cart.length === 0}
                className="flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Eye className="w-4 h-4" /> Aperçu
              </button>
              <button id="valider" onClick={onValider} disabled={cart.length === 0}
                className="flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white transition-all shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed">
                <FileText className="w-4 h-4" /> Valider
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  )
}
