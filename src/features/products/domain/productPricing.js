// Domain : calculs de prix et de marge.

const MARGE_DEFAUT_POURCENTAGE = 30

// Calcule la marge et le bénéfice d'un prix de vente par rapport au prix d'achat.
// Retourne null si les prix sont manquants ou invalides.
export function computeMargin(prixAchat, prixVente, margeMinimum = 0) {
  if (!prixAchat || !prixVente || prixAchat <= 0 || prixVente <= 0) return null
  const marge = ((prixVente - prixAchat) / prixAchat) * 100
  return {
    marge: +marge.toFixed(1),
    benefice: prixVente - prixAchat,
    isValid: marge >= margeMinimum,
  }
}

// Prix de vente suggéré à partir du prix d'achat et d'une marge cible.
export function suggestedSellingPrice(prixAchat, margePourcentage = MARGE_DEFAUT_POURCENTAGE) {
  if (!prixAchat || prixAchat <= 0) return 0
  return Math.round(prixAchat * (1 + margePourcentage / 100))
}
