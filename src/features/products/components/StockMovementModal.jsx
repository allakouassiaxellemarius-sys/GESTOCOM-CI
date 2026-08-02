// Composant : modal d'entrée / sortie de stock d'un produit.
// Gère les spécificités secteur (variantes mode, n° série high-tech/pharma).

import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { entreeStock, sortieStock } from '../../../lib/stockDb'

const INPUT_CLASS = 'w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white'
const LABEL_CLASS = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1'
const SUBLABEL_CLASS = 'block text-xs text-gray-500 dark:text-gray-400 mb-1'

export default function StockMovementModal({ type, produit, onConfirm, onCancel }) {
  const isEntree = type === 'entree'
  const [qty, setQty] = useState(1)
  const [motif, setMotif] = useState(isEntree ? 'Réapprovisionnement' : 'Vente')
  const [reference, setReference] = useState('')
  const [fournisseur, setFournisseur] = useState('')
  const [client, setClient] = useState('')
  const [lot, setLot] = useState('')
  const [datePeremption, setDatePeremption] = useState('')
  const [prixUnitaire, setPrixUnitaire] = useState(isEntree ? (produit.prixAchat || 0) : (produit.prixVente || 0))
  const [numeroSerie, setNumeroSerie] = useState('')
  const [variantTaille, setVariantTaille] = useState('')
  const [variantCouleur, setVariantCouleur] = useState('')

  const handleConfirm = () => {
    if (qty <= 0) return
    const opts = { motif, reference, prixUnitaire, lot, datePeremption: datePeremption || null, numeroSerie, variantTaille, variantCouleur }
    if (isEntree) {
      opts.fournisseur = fournisseur
      entreeStock(produit.id, qty, opts)
    } else {
      if (qty > produit.stockActuel) { alert('Stock insuffisant !'); return }
      opts.client = client
      sortieStock(produit.id, qty, opts)
    }
    onConfirm()
  }

  const tailles = (produit.specifications?.tailles || '').split(',').filter(Boolean)
  const couleurs = (produit.specifications?.couleurs || '').split(',').filter(Boolean)
  const isMode = produit.secteur === 'mode' && (tailles.length > 0 || couleurs.length > 0)
  const isHighTech = produit.secteur === 'high_tech'
  const isPharma = produit.secteur === 'pharmaceutique'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isEntree ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
            {isEntree ? <ArrowDownCircle className="w-5 h-5 text-green-500" /> : <ArrowUpCircle className="w-5 h-5 text-red-500" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white">{isEntree ? 'Entrée' : 'Sortie'} de stock</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{produit.nom} — Stock: {produit.stockActuel} {produit.unite}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className={LABEL_CLASS}>Quantité *</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(+e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Motif</label>
            <select value={motif} onChange={e => setMotif(e.target.value)} className={INPUT_CLASS}>
              {isEntree ? (<><option>Réapprovisionnement</option><option>Retour client</option><option>Don</option><option>Production</option><option>Autre</option></>) :
                (<><option>Vente</option><option>Consommation interne</option><option>Perte</option><option>Don</option><option>Autre</option></>)}
            </select>
          </div>

          {isMode && (
            <div className="grid grid-cols-2 gap-3">
              {tailles.length > 0 && (
                <div><label className={SUBLABEL_CLASS}>Taille</label>
                  <select value={variantTaille} onChange={e => setVariantTaille(e.target.value)} className={INPUT_CLASS}>
                    <option value="">--</option>{tailles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
              )}
              {couleurs.length > 0 && (
                <div><label className={SUBLABEL_CLASS}>Couleur</label>
                  <select value={variantCouleur} onChange={e => setVariantCouleur(e.target.value)} className={INPUT_CLASS}>
                    <option value="">--</option>{couleurs.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              )}
            </div>
          )}

          {(isHighTech || isPharma) && (
            <div><label className={LABEL_CLASS}>N° de série</label>
              <input value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} className={INPUT_CLASS} placeholder="SN-XXXX" /></div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div><label className={SUBLABEL_CLASS}>Réf. commande</label>
              <input value={reference} onChange={e => setReference(e.target.value)} className={INPUT_CLASS} /></div>
            <div><label className={SUBLABEL_CLASS}>Prix unitaire</label>
              <input type="number" value={prixUnitaire} onChange={e => setPrixUnitaire(+e.target.value)} className={INPUT_CLASS} /></div>
          </div>

          {isEntree && <div className="grid grid-cols-2 gap-3">
            <div><label className={SUBLABEL_CLASS}>Fournisseur</label>
              <input value={fournisseur} onChange={e => setFournisseur(e.target.value)} className={INPUT_CLASS} /></div>
            <div><label className={SUBLABEL_CLASS}>N° Lot</label>
              <input value={lot} onChange={e => setLot(e.target.value)} className={INPUT_CLASS} /></div>
          </div>}

          {!isEntree && <div><label className={SUBLABEL_CLASS}>Client</label>
            <input value={client} onChange={e => setClient(e.target.value)} className={INPUT_CLASS} /></div>}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={handleConfirm} className={`text-sm py-2 px-4 ${isEntree ? 'btn-primary' : 'bg-red-500 text-white rounded-lg hover:bg-red-600'}`} disabled={qty <= 0}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}
