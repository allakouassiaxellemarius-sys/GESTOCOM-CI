// Domain : validation du formulaire produit.

import { getProductsV2 } from '../../../lib/stockDb'
import { toNumber } from './productBuilder'

// Vérifie si un code-barres est déjà utilisé par un autre produit.
export function isBarcodeTaken(barcode, excludeId) {
  const q = String(barcode || '').trim().toLowerCase()
  if (!q) return false
  return getProductsV2().some(p =>
    p.id !== excludeId && String(p.barcode || '').trim().toLowerCase() === q
  )
}

// Vérifie si une référence est déjà utilisée par un autre produit.
export function isReferenceTaken(reference, excludeId) {
  const q = String(reference || '').trim().toLowerCase()
  if (!q) return false
  return getProductsV2().some(p =>
    p.id !== excludeId && String(p.reference || '').trim().toLowerCase() === q
  )
}

// Valide le formulaire et retourne un objet d'erreurs { champ: message }.
// Un objet vide signifie que le formulaire est valide.
export function validateProduct(form) {
  const errors = {}

  if (!form.nom || !String(form.nom).trim()) {
    errors.nom = 'Le nom du produit est requis'
  }

  const prixAchat = toNumber(form.prixAchat)
  const prixVente = toNumber(form.prixVente)
  if (prixAchat < 0) errors.prixAchat = 'Prix d' + "'" + 'achat invalide'
  if (prixVente < 0) errors.prixVente = 'Prix de vente invalide'

  if (toNumber(form.stockActuel) < 0) errors.stockActuel = 'Stock invalide'
  if (toNumber(form.stockMinimal) < 0) errors.stockMinimal = 'Stock min invalide'
  if (toNumber(form.seuilAlerte) < 0) errors.seuilAlerte = 'Seuil d' + "'" + 'alerte invalide'

  if (isBarcodeTaken(form.barcode, form.id)) {
    errors.barcode = 'Ce code-barres existe déjà'
  }
  if (isReferenceTaken(form.reference, form.id)) {
    errors.reference = 'Cette référence existe déjà'
  }

  return errors
}
