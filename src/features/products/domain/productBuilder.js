// Domain : construction et normalisation du formulaire produit.

export const DEFAULT_MARGE_MIN = 10
export const DEFAULT_STOCK_MAX = 99999
export const DEFAULT_SEUIL_ALERTE = 5

export function emptyProductForm() {
  return {
    nom: '',
    reference: '',
    description: '',
    secteur: 'detail',
    categorie: '',
    barcode: '',
    unite: 'pièce',
    prixAchat: 0,
    prixVente: 0,
    margeMinimum: DEFAULT_MARGE_MIN,
    stockActuel: 0,
    stockMinimal: 0,
    stockMaximal: DEFAULT_STOCK_MAX,
    seuilAlerte: DEFAULT_SEUIL_ALERTE,
    emplacement: '',
    entrepot: 'Principal',
    image: '',
    specifications: {},
    variants: [],
    serialNumbers: [],
    recettes: [],
  }
}

// Convertit un produit (création ou édition) en formulaire exploitable.
export function productToForm(product) {
  if (!product) return emptyProductForm()
  return { ...emptyProductForm(), ...product, specifications: product.specifications || {} }
}

// Assainit un booléen/nombre issu du formulaire avant enregistrement.
export function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}
