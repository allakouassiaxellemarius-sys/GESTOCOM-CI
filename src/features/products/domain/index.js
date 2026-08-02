// Barrel domain produits.

export { emptyProductForm, productToForm, toNumber, DEFAULT_MARGE_MIN, DEFAULT_STOCK_MAX, DEFAULT_SEUIL_ALERTE } from './productBuilder'
export { computeMargin, suggestedSellingPrice } from './productPricing'
export { validateProduct, isBarcodeTaken, isReferenceTaken } from './productValidation'
