import { addLog, getStockSettings, isSqliteReady, getSqlCache } from './db'

const DB_PREFIX = 'gestocom_'
function getAll(name) {
  if (isSqliteReady()) {
    const cache = getSqlCache(name)
    if (cache) return cache
  }
  try { return JSON.parse(localStorage.getItem(DB_PREFIX + name) || '[]') } catch { return [] }
}
function setAll(name, data) {
  try { localStorage.setItem(DB_PREFIX + name, JSON.stringify(data)) } catch {}
}
function nextId(items) { return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1 }
function sanitize(str) { if (typeof str !== 'string') return str; return str.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]) }

// ══════════════════════════════════════════════════════════════
// AUTO-GENERATION: BARCODE & REFERENCE
// ══════════════════════════════════════════════════════════════
function generateBarcodeV2(productId) {
  const settings = getStockSettings()
  const prefix = settings.prefixeCodeBarres || 'GCI'
  return `${prefix}${String(productId).padStart(6, '0')}`
}

function generateReference(secteur, categorie, existingItems) {
  const secteurPrefix = {
    detail: 'DET', alimentaire: 'ALI', industriel: 'IND', pharmaceutique: 'PHAR',
    mode: 'MOD', high_tech: 'TECH', logistique: 'LOG', educatif: 'EDU',
  }
  const prefix = secteurPrefix[secteur] || 'PRD'
  const catPrefix = categorie ? categorie.slice(0, 3).toUpperCase() : ''
  const seq = existingItems.length + 1
  return `${prefix}-${catPrefix}${String(seq).padStart(4, '0')}`
}

// ══════════════════════════════════════════════════════════════
// SECTEURS DE COMMERCE EN CÔTE D'IVOIRE
// ══════════════════════════════════════════════════════════════
export const SECTEURS_COMMERCE = [
  { id: 'detail', nom: 'Commerce de détail', icon: '🛒', desc: 'Supermarchés, boutiques, kiosques', color: 'brand' },
  { id: 'alimentaire', nom: 'Commerce alimentaire', icon: '🍽️', desc: 'Restaurants, bars, boulangeries', color: 'amber' },
  { id: 'industriel', nom: 'Commerce industriel', icon: '🏭', desc: 'Matériaux, pièces, machines', color: 'slate' },
  { id: 'pharmaceutique', nom: 'Commerce pharmaceutique', icon: '💊', desc: 'Pharmacies, parapharmacies', color: 'rose' },
  { id: 'mode', nom: 'Commerce de mode', icon: '👗', desc: 'Vêtements, chaussures, accessoires', color: 'violet' },
  { id: 'high_tech', nom: 'Commerce High-Tech', icon: '📱', desc: 'Téléphones, ordinateurs, électronique', color: 'sky' },
  { id: 'logistique', nom: 'Commerce logistique', icon: '📦', desc: 'Transport, livraison, grossistes', color: 'teal' },
  { id: 'educatif', nom: 'Commerce éducatif', icon: '📚', desc: 'Librairies, fournitures scolaires', color: 'emerald' },
]

export const UNITES = {
  detail: ['pièce', 'casier', 'carton', 'lot'],
  alimentaire: ['kg', 'g', 'L', 'mL', 'pièce', 'portion'],
  industriel: ['pièce', 'mètre', 'kg', 'barre', 'boîte', 'palette'],
  pharmaceutique: ['boîte', 'tube', 'flacon', 'pièce', 'plaquette'],
  mode: ['pièce'],
  high_tech: ['pièce'],
  logistique: ['colis', 'palette', 'carton', 'kg', 'm³'],
  educatif: ['pièce', 'lot', 'palette'],
}

export const CATEGORIES_SECTOR = {
  detail: ['Alimentaire', 'Boisson', 'Hygiène', 'Entretien', 'Électronique', 'Vêtement', 'Autre'],
  alimentaire: ['Ingrédient', 'Épice', 'Boisson', 'Matière première', 'Consommable', 'Emballage'],
  industriel: ['Pièce mécanique', 'Électrique', 'Hydraulique', 'Consommable', 'Outillage', 'Matière première'],
  pharmaceutique: ['Médicament', 'Parapharmacie', 'Matériel médical', 'Consommable médical'],
  mode: ['Vêtement', 'Chaussure', 'Accessoire', 'Bijoux', 'Sacs'],
  high_tech: ['Téléphone', 'Ordinateur', 'Tablette', 'Accessoire', 'Câble', 'Composant'],
  logistique: ['Alimentaire', 'Industriel', 'Fragile', 'Sensible', 'Gros volume'],
  educatif: ['Livre', 'Cahier', 'Stylos', 'Cartable', 'Matériel artistique', 'Papeterie'],
}

// ══════════════════════════════════════════════════════════════
// CHAMPS SPÉCIFIQUES PAR CATÉGORIE (secteur detail)
// ══════════════════════════════════════════════════════════════
export const CATEGORY_FIELDS = {
  Alimentaire: [
    { key: 'datePeremption', label: 'Date de péremption', type: 'date', default: '' },
    { key: 'dureeConservation', label: 'Durée conservation (jours)', type: 'number', default: 0 },
    { key: 'temperatureStockage', label: 'Temp. stockage', type: 'text', default: '', placeholder: 'ex: 2-8°C' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
    { key: 'estIngredientCle', label: 'Ingrédient clé', type: 'checkbox', default: false },
  ],
  Boisson: [
    { key: 'typeBoisson', label: 'Type', type: 'select', options: ['Bière', 'Vin', 'Soda', 'Jus', 'Eau', 'Alcool', 'Autre'], default: '' },
    { key: 'formatContenant', label: 'Format', type: 'select', options: ['Bouteille', 'Casier', 'Pack', 'Canette', 'Bidon', 'Fût', 'Autre'], default: '' },
    { key: 'nbUnitesParFormat', label: 'Unités par format', type: 'number', default: 1 },
    { key: 'estConsigne', label: 'Consigné', type: 'checkbox', default: false },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
  ],
  Hygiène: [
    { key: 'fournisseur', label: 'Fournisseur principal', type: 'text', default: '' },
    { key: 'estProduitEssentiel', label: 'Produit essentiel', type: 'checkbox', default: false },
    { key: 'categorieUsage', label: 'Usage', type: 'select', options: ['Corps', 'Visage', 'Cheveux', 'Dentaire', 'Ménager', 'Autre'], default: '' },
  ],
  Entretien: [
    { key: 'categorieMénager', label: 'Catégorie', type: 'select', options: ['Sol', 'Linge', 'Vaisselle', 'Salle de bain', 'Cuisine', 'Multi-usage', 'Autre'], default: '' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
    { key: 'estProduitMénagerBase', label: 'Produit de base', type: 'checkbox', default: false },
  ],
  Électronique: [
    { key: 'marque', label: 'Marque', type: 'text', default: '' },
    { key: 'modele', label: 'Modèle', type: 'text', default: '' },
    { key: 'numeroSerie', label: 'N° de série', type: 'text', default: '' },
    { key: 'imei', label: 'IMEI', type: 'text', default: '' },
    { key: 'garantieMois', label: 'Garantie (mois)', type: 'number', default: 12 },
    { key: 'dateAchat', label: "Date d'achat", type: 'date', default: '' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
  ],
  Vêtement: [
    { key: 'taille', label: 'Taille', type: 'text', default: '', placeholder: 'ex: S, M, L, XL' },
    { key: 'couleur', label: 'Couleur', type: 'text', default: '' },
    { key: 'collection', label: 'Collection', type: 'text', default: '' },
    { key: 'genre', label: 'Genre', type: 'select', options: ['Homme', 'Femme', 'Unisexe', 'Enfant'], default: 'Unisexe' },
    { key: 'estBestSeller', label: 'Best-seller', type: 'checkbox', default: false },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
  ],
}

// Champs spécifiques par secteur (pour le formulaire)
export const SECTOR_FIELDS = {
  detail: [
    { key: 'nbUnitesParCasier', label: 'Unités par casier', type: 'number', default: 24 },
    { key: 'prixCasier', label: 'Prix par casier (FCFA)', type: 'number', default: 0 },
    { key: 'fournisseur', label: 'Fournisseur habituel', type: 'text', default: '' },
  ],
  alimentaire: [
    { key: 'poidsUnite', label: "Poids/Volume unitaire", type: 'text', default: '', placeholder: 'ex: 250g, 1L' },
    { key: 'allergenes', label: 'Allergènes', type: 'text', default: '' },
    { key: 'temperatureStockage', label: 'Temp. stockage', type: 'text', default: '', placeholder: 'ex: 2-8°C' },
    { key: 'dureeConservation', label: 'Durée conservation (jours)', type: 'number', default: 0 },
    { key: 'recetteLiee', label: 'Recette associée', type: 'text', default: '' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
  ],
  industriel: [
    { key: 'matiere', label: 'Matière', type: 'text', default: '' },
    { key: 'dimensions', label: 'Dimensions', type: 'text', default: '', placeholder: 'ex: 120x80x50 mm' },
    { key: 'poidsNet', label: 'Poids net (kg)', type: 'number', default: 0 },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
    { key: 'certification', label: 'Certification', type: 'text', default: '' },
    { key: 'delaiAppro', label: 'Délai appro. (jours)', type: 'number', default: 0 },
  ],
  pharmaceutique: [
    { key: 'dcI', label: 'DCI (Dénomination Commune)', type: 'text', default: '' },
    { key: 'dosage', label: 'Dosage', type: 'text', default: '', placeholder: 'ex: 500mg' },
    { key: 'formePharmaceutique', label: 'Forme', type: 'select', options: ['Comprimé', 'Gélule', 'Sirop', 'Injection', 'Crème', 'Pommade', 'Spray', 'Autre'], default: '' },
    { key: 'classeTherapeutique', label: 'Classe thérapeutique', type: 'text', default: '' },
    { key: 'controlable', label: 'Médicament contrôlé', type: 'checkbox', default: false },
    { key: 'prescriptionRequise', label: 'Prescription requise', type: 'checkbox', default: false },
    { key: 'laboratoire', label: 'Laboratoire', type: 'text', default: '' },
    { key: 'numAMM', label: 'N° AMM', type: 'text', default: '' },
  ],
  mode: [
    { key: 'saison', label: 'Saison', type: 'select', options: ['Printemps', 'Été', 'Automne', 'Hiver', 'Toute saison', 'Cruise', 'Resort'], default: 'Toute saison' },
    { key: 'collection', label: 'Collection', type: 'text', default: '' },
    { key: 'marque', label: 'Marque', type: 'text', default: '' },
    { key: 'materiau', label: 'Matière', type: 'text', default: '' },
    { key: 'genre', label: 'Genre', type: 'select', options: ['Homme', 'Femme', 'Unisexe', 'Enfant'], default: 'Unisexe' },
    { key: 'tailles', label: 'Tailles disponibles', type: 'text', default: '', placeholder: 'ex: S,M,L,XL' },
    { key: 'couleurs', label: 'Couleurs disponibles', type: 'text', default: '', placeholder: 'ex: Noir,Blanc,Rouge' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
  ],
  high_tech: [
    { key: 'marque', label: 'Marque', type: 'text', default: '' },
    { key: 'modele', label: 'Modèle', type: 'text', default: '' },
    { key: 'numeroSerie', label: 'N° de série', type: 'text', default: '' },
    { key: 'imei', label: 'IMEI', type: 'text', default: '' },
    { key: 'garantieMois', label: 'Garantie (mois)', type: 'number', default: 12 },
    { key: 'dateAchat', label: "Date d'achat", type: 'date', default: '' },
    { key: 'etat', label: 'État', type: 'select', options: ['Neuf', 'Comme neuf', 'Bon état', 'Usé', 'Reconditionné'], default: 'Neuf' },
    { key: 'connectivite', label: 'Connectivité', type: 'text', default: '', placeholder: 'WiFi, 4G, 5G...' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
  ],
  logistique: [
    { key: 'poidsColis', label: 'Poids (kg)', type: 'number', default: 0 },
    { key: 'dimensionsColis', label: 'Dimensions (LxlxH)', type: 'text', default: '' },
    { key: 'typeColis', label: 'Type de colis', type: 'select', options: ['Standard', 'Fragile', 'Sensible', 'Périssable', 'Surchargé'], default: 'Standard' },
    { key: 'zoneLivraison', label: 'Zone de livraison', type: 'text', default: '' },
    { key: 'transporteur', label: 'Transporteur', type: 'text', default: '' },
    { key: 'delaiLivraison', label: 'Délai livraison (h)', type: 'number', default: 24 },
  ],
  educatif: [
    { key: 'niveauScolaire', label: 'Niveau scolaire', type: 'select', options: ['Maternelle', 'Primaire', 'Collège', 'Lycée', 'Université', 'Formation'], default: '' },
    { key: 'matiere', label: 'Matière', type: 'text', default: '' },
    { key: 'auteur', label: 'Auteur', type: 'text', default: '' },
    { key: 'editeur', label: 'Éditeur', type: 'text', default: '' },
    { key: 'isbn', label: 'ISBN', type: 'text', default: '' },
    { key: 'anneeScolaire', label: 'Année scolaire', type: 'text', default: '', placeholder: 'ex: 2025-2026' },
    { key: 'fournisseur', label: 'Fournisseur', type: 'text', default: '' },
  ],
}

// ══════════════════════════════════════════════════════════════
// PRODUITS V2 — SCHÉMA UNIVERSEL AVEC CHAMPS SECTORIELS
// ══════════════════════════════════════════════════════════════
export function getProductsV2() { return getAll('products_v2') }
export function getProductV2(id) { return getAll('products_v2').find(p => p.id === id) || null }

export function duplicateProductV2(id) {
  const items = getAll('products_v2')
  const src = items.find(p => p.id === id)
  if (!src) return null
  const newId = nextId(items)
  const dup = {
    ...src,
    id: newId,
    reference: generateReference(src.secteur, src.categorie, items),
    barcode: generateBarcodeV2(newId),
    nom: src.nom + ' (copie)',
    stockActuel: 0,
    actif: true,
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
  }
  items.push(dup)
  setAll('products_v2', items)
  addLog('Produit dupliqué', `${dup.nom} (${dup.reference})`, dup.id)
  return dup
}

export function addProductV2(p) {
  const items = getAll('products_v2')
  const id = nextId(items)
  const product = {
    id,
    reference: sanitize(p.reference || generateReference(p.secteur || 'detail', p.categorie, items)),
    nom: sanitize(p.nom || ''),
    description: sanitize(p.description || ''),
    secteur: p.secteur || 'detail',
    categorie: sanitize(p.categorie || ''),
    barcode: p.barcode || generateBarcodeV2(id),
    unite: p.unite || 'pièce',
    prixAchat: Number(p.prixAchat) || 0,
    prixVente: Number(p.prixVente) || 0,
    margeMinimum: Number(p.margeMinimum) || 10,
    stockActuel: Number(p.stockActuel) || 0,
    stockMinimal: Number(p.stockMinimal) || 0,
    stockMaximal: Number(p.stockMaximal) || 99999,
    seuilAlerte: Number(p.seuilAlerte) || 5,
    emplacement: sanitize(p.emplacement || ''),
    entrepot: sanitize(p.entrepot || ''),
    image: p.image || '',
    specifications: p.specifications || {},
    variants: p.variants || [],
    serialNumbers: p.serialNumbers || [],
    recettes: p.recettes || [],
    actif: true,
    dateCreation: new Date().toISOString(),
    dateModification: new Date().toISOString(),
  }
  items.push(product)
  setAll('products_v2', items)
  addLog('Produit créé', `${product.nom} (${product.reference || product.barcode || product.id})`, product.id)
  return product
}

export function updateProductV2(p) {
  const items = getAll('products_v2')
  const idx = items.findIndex(i => i.id === p.id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...p, dateModification: new Date().toISOString() }
  setAll('products_v2', items)
  addLog('Produit modifié', `${p.nom || items[idx].nom}`, p.id)
  return items[idx]
}

export function deleteProductV2(id) {
  const p = getProductV2(id)
  setAll('products_v2', getAll('products_v2').filter(i => i.id !== id))
  if (p) addLog('Produit supprimé', `${p.nom}`, id)
}

export function getProductsBySecteur(secteur) {
  return getAll('products_v2').filter(p => p.secteur === secteur && p.actif)
}

export function searchProductsV2(query) {
  const q = query.toLowerCase()
  return getAll('products_v2').filter(p =>
    p.actif && (
      p.nom.toLowerCase().includes(q) ||
      (p.reference || '').toLowerCase().includes(q) ||
      (p.barcode || '').toLowerCase().includes(q) ||
      (p.categorie || '').toLowerCase().includes(q) ||
      (p.specifications?.marque || '').toLowerCase().includes(q) ||
      (p.specifications?.modele || '').toLowerCase().includes(q) ||
      (p.specifications?.numeroSerie || '').toLowerCase().includes(q) ||
      (p.specifications?.imei || '').toLowerCase().includes(q) ||
      (p.specifications?.collection || '').toLowerCase().includes(q) ||
      (p.specifications?.dcI || '').toLowerCase().includes(q)
    )
  )
}

// ══════════════════════════════════════════════════════════════
// VARIANTES (MODE: taille + couleur)
// ══════════════════════════════════════════════════════════════
export function addVariant(produitId, variant) {
  const p = getProductV2(produitId)
  if (!p) return null
  const v = {
    id: nextId(p.variants || []),
    taille: sanitize(variant.taille || ''),
    couleur: sanitize(variant.couleur || ''),
    stock: Number(variant.stock) || 0,
    prixSupplement: Number(variant.prixSupplement) || 0,
    barcode: variant.barcode || '',
    actif: true,
  }
  const variants = [...(p.variants || []), v]
  updateProductV2({ id: produitId, variants })
  return v
}

export function updateVariant(produitId, variantId, data) {
  const p = getProductV2(produitId)
  if (!p) return null
  const variants = (p.variants || []).map(v => v.id === variantId ? { ...v, ...data } : v)
  updateProductV2({ id: produitId, variants })
}

export function deleteVariant(produitId, variantId) {
  const p = getProductV2(produitId)
  if (!p) return
  const variants = (p.variants || []).filter(v => v.id !== variantId)
  updateProductV2({ id: produitId, variants })
}

export function getStockVariant(produitId, taille, couleur) {
  const p = getProductV2(produitId)
  if (!p || !p.variants) return 0
  const v = p.variants.find(v => v.taille === taille && v.couleur === couleur)
  return v ? v.stock : 0
}

// ══════════════════════════════════════════════════════════════
// NUMÉROS DE SÉRIE (HIGH-TECH / PHARMA)
// ══════════════════════════════════════════════════════════════
export function addSerialNumber(produitId, sn) {
  const p = getProductV2(produitId)
  if (!p) return null
  const entry = {
    id: nextId(p.serialNumbers || []),
    numero: sanitize(sn.numero || ''),
    statut: sn.statut || 'en_stock', // en_stock, vendu, retourné, garanti, defectueux
    dateEntree: sn.dateEntree || new Date().toISOString(),
    dateVente: sn.dateVente || null,
    client: sanitize(sn.client || ''),
    garantieFin: sn.garantieFin || null,
    notes: sanitize(sn.notes || ''),
  }
  const serialNumbers = [...(p.serialNumbers || []), entry]
  updateProductV2({ id: produitId, serialNumbers })
  return entry
}

export function updateSerialNumber(produitId, snId, data) {
  const p = getProductV2(produitId)
  if (!p) return null
  const serialNumbers = (p.serialNumbers || []).map(s => s.id === snId ? { ...s, ...data } : s)
  updateProductV2({ id: produitId, serialNumbers })
}

export function getSerialNumbersByStatut(produitId, statut) {
  const p = getProductV2(produitId)
  if (!p) return []
  return (p.serialNumbers || []).filter(s => s.statut === statut)
}

// ══════════════════════════════════════════════════════════════
// RECETTES (ALIMENTAIRE)
// ══════════════════════════════════════════════════════════════
export function addRecette(produitId, recette) {
  const p = getProductV2(produitId)
  if (!p) return null
  const r = {
    id: nextId(p.recettes || []),
    nom: sanitize(recette.nom || ''),
    ingredients: (recette.ingredients || []).map(i => ({
      produitId: i.produitId,
      quantite: Number(i.quantite) || 0,
      unite: i.unite || 'g',
    })),
    rendement: Number(recette.rendement) || 1,
    uniteRendement: recette.uniteRendette || 'portion',
    coutTotal: Number(recette.coutTotal) || 0,
    prixVente: Number(recette.prixVente) || 0,
    notes: sanitize(recette.notes || ''),
  }
  const recettes = [...(p.recettes || []), r]
  updateProductV2({ id: produitId, recettes })
  return r
}

export function updateRecette(produitId, recetteId, data) {
  const p = getProductV2(produitId)
  if (!p) return null
  const recettes = (p.recettes || []).map(r => r.id === recetteId ? { ...r, ...data } : r)
  updateProductV2({ id: produitId, recettes })
}

export function deleteRecette(produitId, recetteId) {
  const p = getProductV2(produitId)
  if (!p) return
  const recettes = (p.recettes || []).filter(r => r.id !== recetteId)
  updateProductV2({ id: produitId, recettes })
}

// ══════════════════════════════════════════════════════════════
// MOUVEMENTS DE STOCK
// ══════════════════════════════════════════════════════════════
export function getMouvements() { return getAll('stock_mouvements') }

export function addMouvement(m) {
  const items = getAll('stock_mouvements')
  const mouvement = {
    id: nextId(items),
    produitId: m.produitId,
    produitNom: sanitize(m.produitNom || ''),
    produitSecteur: m.produitSecteur || '',
    type: m.type,
    quantite: Number(m.quantite) || 0,
    quantiteAvant: Number(m.quantiteAvant) || 0,
    quantiteApres: Number(m.quantiteApres) || 0,
    motif: sanitize(m.motif || ''),
    reference: sanitize(m.reference || ''),
    fournisseur: sanitize(m.fournisseur || ''),
    client: sanitize(m.client || ''),
    entrepot: sanitize(m.entrepot || ''),
    entrepotDestination: sanitize(m.entrepotDestination || ''),
    prixUnitaire: Number(m.prixUnitaire) || 0,
    montantTotal: Number(m.quantite) * Number(m.prixUnitaire) || 0,
    lot: sanitize(m.lot || ''),
    numeroSerie: sanitize(m.numeroSerie || ''),
    datePeremption: m.datePeremption || null,
    // Mode: variante concernée
    variantTaille: sanitize(m.variantTaille || ''),
    variantCouleur: sanitize(m.variantCouleur || ''),
    // Logistique
    colisId: sanitize(m.colisId || ''),
    // Alimentaire
    recetteNom: sanitize(m.recetteNom || ''),
    creePar: sanitize(m.creePar || ''),
    dateMouvement: m.dateMouvement || new Date().toISOString(),
  }
  items.push(mouvement)
  setAll('stock_mouvements', items)
  return mouvement
}

export function getMouvementsByProduit(produitId) {
  return getAll('stock_mouvements').filter(m => m.produitId === produitId).sort((a, b) => new Date(b.dateMouvement) - new Date(a.dateMouvement))
}

export function getMouvementsByDate(dateDebut, dateFin) {
  return getAll('stock_mouvements').filter(m => {
    const d = m.dateMouvement.slice(0, 10)
    return d >= dateDebut && d <= dateFin
  }).sort((a, b) => new Date(b.dateMouvement) - new Date(a.dateMouvement))
}

export function getMouvementsByType(type) {
  return getAll('stock_mouvements').filter(m => m.type === type)
}

// ══════════════════════════════════════════════════════════════
// OPÉRATIONS SUR STOCK
// ══════════════════════════════════════════════════════════════
export function entreeStock(produitId, quantite, options = {}) {
  const p = getProductV2(produitId)
  if (!p) return null
  if (p.specifications?.controlable) {
    addLog('Blocage stock', `${p.nom}: Médicament contrôlé — entrée requise avec validation`, produitId)
  }
  const avant = p.stockActuel
  const apres = avant + quantite
  updateProductV2({ id: produitId, stockActuel: apres })
  addMouvement({
    produitId, produitNom: p.nom, produitSecteur: p.secteur, type: 'entree', quantite,
    quantiteAvant: avant, quantiteApres: apres,
    motif: options.motif || 'Réapprovisionnement',
    reference: options.reference || '', fournisseur: options.fournisseur || '',
    prixUnitaire: options.prixUnitaire || p.prixAchat,
    lot: options.lot || '', datePeremption: options.datePeremption || null,
    numeroSerie: options.numeroSerie || '',
    variantTaille: options.variantTaille || '', variantCouleur: options.variantCouleur || '',
    creePar: options.creePar || '',
  })
  addLog('Entrée stock', `${p.nom} +${quantite} (${avant} → ${apres})`, produitId)
  return { avant, apres }
}

export function sortieStock(produitId, quantite, options = {}) {
  const p = getProductV2(produitId)
  if (!p) return null
  // BLOCAGE STOCK NÉGATIF
  if (p.stockActuel < quantite) {
    addLog('Blocage sortie', `${p.nom}: stock insuffisant (${p.stockActuel} < ${quantite})`, produitId)
    return null
  }
  // MÉDICAMENTS CONTRÔLÉS
  if (p.specifications?.controlable) {
    addLog('Alerte contrôle', `${p.nom}: Médicament contrôlé — sortie traçée`, produitId)
  }
  const avant = p.stockActuel
  const apres = avant - quantite
  updateProductV2({ id: produitId, stockActuel: apres })
  addMouvement({
    produitId, produitNom: p.nom, produitSecteur: p.secteur, type: 'sortie', quantite,
    quantiteAvant: avant, quantiteApres: apres,
    motif: options.motif || 'Vente',
    reference: options.reference || '', client: options.client || '',
    prixUnitaire: options.prixUnitaire || p.prixVente,
    numeroSerie: options.numeroSerie || '',
    variantTaille: options.variantTaille || '', variantCouleur: options.variantCouleur || '',
    recetteNom: options.recetteNom || '',
    creePar: options.creePar || '',
  })
  addLog('Sortie stock', `${p.nom} -${quantite} (${avant} → ${apres})`, produitId)
  // Numéro de série → vendu
  if (options.numeroSerie && p.serialNumbers) {
    const sn = p.serialNumbers.find(s => s.numero === options.numeroSerie)
    if (sn) {
      updateSerialNumber(produitId, sn.id, { statut: 'vendu', dateVente: new Date().toISOString(), client: options.client || '' })
    }
  }
  // ALERTE SORTIE
  if (apres <= p.seuilAlerte) {
    addLog('Alerte stock', `${p.nom}: ${apres} restant(s) (seuil: ${p.seuilAlerte})`, produitId)
  }
  // ALERTE MARGE CRITIQUE
  const marge = p.prixAchat > 0 ? ((p.prixVente - p.prixAchat) / p.prixAchat) * 100 : 0
  if (marge < p.margeMinimum && p.prixAchat > 0) {
    addLog('Alerte marge', `${p.nom}: marge ${marge.toFixed(1)}% < seuil ${p.margeMinimum}%`, produitId)
  }
  return { avant, apres }
}

export function ajusterStock(produitId, nouveauStock, motif, creePar = '') {
  const p = getProductV2(produitId)
  if (!p) return null
  // BLOCAGE STOCK NÉGATIF
  if (nouveauStock < 0) {
    addLog('Blocage ajustement', `${p.nom}: stock ne peut pas être négatif`, produitId)
    return null
  }
  const avant = p.stockActuel
  const diff = nouveauStock - avant
  updateProductV2({ id: produitId, stockActuel: nouveauStock })
  addMouvement({
    produitId, produitNom: p.nom, produitSecteur: p.secteur, type: 'ajustement', quantite: Math.abs(diff),
    quantiteAvant: avant, quantiteApres: nouveauStock,
    motif: motif || 'Ajustement inventaire', creePar,
  })
  addLog('Ajustement stock', `${p.nom}: ${avant} → ${nouveauStock} (${diff > 0 ? '+' : ''}${diff})`, produitId)
  return { avant, apres: nouveauStock, diff }
}

export function transfertStock(produitId, quantite, entrepotSource, entrepotDest, creePar = '') {
  const p = getProductV2(produitId)
  if (!p || p.stockActuel < quantite) return null
  sortieStock(produitId, quantite, { motif: `Transfert vers ${entrepotDest}`, creePar })
  addMouvement({
    produitId, produitNom: p.nom, produitSecteur: p.secteur, type: 'transfert', quantite,
    quantiteAvant: p.stockActuel, quantiteApres: p.stockActuel - quantite,
    entrepot: entrepotSource, entrepotDestination: entrepotDest,
    motif: `Transfert ${entrepotSource} → ${entrepotDest}`, creePar,
  })
  return true
}

// ══════════════════════════════════════════════════════════════
// RETOURS CONSIGNÉS (BOISSONS)
// ══════════════════════════════════════════════════════════════
export function getRetoursConsignes() { return getAll('retours_consignes') }

export function addRetourConsigne(r) {
  const items = getAll('retours_consignes')
  const retour = {
    id: nextId(items), produitId: r.produitId, produitNom: sanitize(r.produitNom || ''),
    typeContenant: sanitize(r.typeContenant || 'Bouteille'), quantite: Number(r.quantite) || 0,
    montantConsigne: Number(r.montantConsigne) || 0, client: sanitize(r.client || ''),
    statut: r.statut || 'en_attente', // en_attente, valide, rembourse
    dateRetour: r.dateRetour || new Date().toISOString(),
    dateTraitement: null, notes: sanitize(r.notes || ''),
  }
  items.push(retour)
  setAll('retours_consignes', items)
  addLog('Retour consigné', `${retour.produitNom} ×${retour.quantite} (${retour.typeContenant})`, retour.id)
  return retour
}

export function updateRetourConsigne(r) {
  const items = getAll('retours_consignes')
  const idx = items.findIndex(i => i.id === r.id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...r, dateTraitement: r.statut !== 'en_attente' ? new Date().toISOString() : items[idx].dateTraitement }
  setAll('retours_consignes', items)
  return items[idx]
}

export function getRetoursByStatut(statut) {
  return getAll('retours_consignes').filter(r => r.statut === statut)
}

export function getStatsRetoursConsignes() {
  const retours = getAll('retours_consignes')
  return {
    total: retours.length,
    enAttente: retours.filter(r => r.statut === 'en_attente').length,
    valide: retours.filter(r => r.statut === 'valide').length,
    rembourse: retours.filter(r => r.statut === 'rembourse').length,
    montantTotal: retours.filter(r => r.statut !== 'rembourse').reduce((s, r) => s + r.montantConsigne * r.quantite, 0),
  }
}

// ══════════════════════════════════════════════════════════════
// ALERTES AVANCÉES
// ══════════════════════════════════════════════════════════════
export function getAlertesStock() {
  const produits = getAll('products_v2').filter(p => p.actif)
  const alertes = []
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  const entrepots = getEntrepots()
  const produitsParEntrepot = {}
  for (const p of produits) {
    const e = p.entrepot || 'Principal'
    if (!produitsParEntrepot[e]) produitsParEntrepot[e] = []
    produitsParEntrepot[e].push(p)
  }

  for (const p of produits) {
    // 1. STOCK BAS
    if (p.stockActuel <= p.seuilAlerte) {
      alertes.push({
        type: 'stock_bas', produit: p, secteur: p.secteur,
        message: `${p.nom}: ${p.stockActuel} ${p.unite}(s) restante(s) (seuil: ${p.seuilAlerte})`,
        gravite: p.stockActuel === 0 ? 'critique' : 'warning',
      })
    }

    // 2. PÉREMPTION — Produits via lots
    const lots = getLotsByProduit(p.id)
    for (const lot of lots) {
      if (lot.statut !== 'actif' || !lot.datePeremption) continue
      const joursRestants = Math.ceil((new Date(lot.datePeremption) - now) / 86400000)
      if (joursRestants <= 0) {
        alertes.push({ type: 'perime', produit: p, lot, secteur: p.secteur, gravite: 'critique',
          message: `${p.nom} — Lot ${lot.numeroLot}: EXPIRÉ le ${lot.datePeremption}` })
      } else if (joursRestants <= 30) {
        alertes.push({ type: 'peremption_proche', produit: p, lot, secteur: p.secteur, gravite: 'warning',
          message: `${p.nom} — Lot ${lot.numeroLot}: expire dans ${joursRestants} jours` })
      }
    }
    // Péremption via specifications
    if (p.specifications?.datePeremption) {
      const joursRestants = Math.ceil((new Date(p.specifications.datePeremption) - now) / 86400000)
      if (joursRestants <= 0) {
        alertes.push({ type: 'perime', produit: p, secteur: p.secteur, gravite: 'critique',
          message: `${p.nom}: EXPIRÉ le ${p.specifications.datePeremption}` })
      } else if (joursRestants <= 30) {
        alertes.push({ type: 'peremption_proche', produit: p, secteur: p.secteur, gravite: 'warning',
          message: `${p.nom}: expire dans ${joursRestants} jours` })
      }
    }

    // 3. STOCK MAXIMAL
    if (p.stockActuel > p.stockMaximal) {
      alertes.push({ type: 'stock_max', produit: p, secteur: p.secteur, gravite: 'info',
        message: `${p.nom}: stock supérieur au maximum (${p.stockActuel}/${p.stockMaximal})` })
    }

    // 4. MARGE CRITIQUE
    if (p.prixAchat > 0) {
      const marge = ((p.prixVente - p.prixAchat) / p.prixAchat) * 100
      if (marge < p.margeMinimum) {
        alertes.push({ type: 'marge_critique', produit: p, secteur: p.secteur, gravite: 'warning',
          message: `${p.nom}: marge ${marge.toFixed(1)}% < seuil ${p.margeMinimum}%` })
      }
    }

    // 5. GARANTIE EXPIRÉE (High-Tech)
    if (p.specifications?.garantieMois && p.specifications?.dateAchat) {
      const finGarantie = new Date(p.specifications.dateAchat)
      finGarantie.setMonth(finGarantie.getMonth() + p.specifications.garantieMois)
      if (finGarantie < now) {
        alertes.push({ type: 'garantie_expiree', produit: p, secteur: p.secteur, gravite: 'info',
          message: `${p.nom}: garantie expirée le ${finGarantie.toLocaleDateString('fr-FR')}` })
      }
    }

    // 6. MÉDICAMENTS EXPIRÉS (Pharma) — via serialNumbers
    if (p.secteur === 'pharmaceutique' && p.serialNumbers) {
      for (const sn of p.serialNumbers) {
        if (sn.garantieFin && sn.garantieFin <= today) {
          alertes.push({ type: 'pharma_perime', produit: p, secteur: p.secteur, gravite: 'critique',
            message: `${p.nom} — S/N ${sn.numero}: EXPIRÉ` })
        }
      }
    }

    // 7. PRODUITS INVENDUS (> 90 jours sans mouvement de sortie)
    const mouvementsP = getMouvementsByProduit(p.id)
    const dernieresSorties = mouvementsP.filter(m => m.type === 'sortie')
    if (dernieresSorties.length === 0 && p.stockActuel > 0) {
      alertes.push({ type: 'invendu', produit: p, secteur: p.secteur, gravite: 'info',
        message: `${p.nom}: aucun mouvement de vente enregistré` })
    } else if (dernieresSorties.length > 0) {
      const dernier = new Date(dernieresSorties[0].dateMouvement)
      const joursSansVente = Math.ceil((now - dernier) / 86400000)
      if (joursSansVente > 90) {
        alertes.push({ type: 'invendu', produit: p, secteur: p.secteur, gravite: 'info',
          message: `${p.nom}: ${joursSansVente} jours sans vente` })
      }
    }

    // 8. TRANSFERTS AUTO — Produits en rupture dans un site mais dispo dans un autre
    if (entrepots.length > 1) {
      for (const [eNom, eProduits] of Object.entries(produitsParEntrepot)) {
        if (eNom === (p.entrepot || 'Principal')) continue
        const dispo = eProduits.find(ap => ap.reference && ap.reference === p.reference && ap.stockActuel > ap.seuilAlerte)
        if (dispo) {
          alertes.push({ type: 'transfert_suggere', produit: p, produitDispo: dispo, secteur: p.secteur, gravite: 'warning',
            message: `${p.nom}: rupture à "${eNom}" — dispo à "${dispo.entrepot || 'Principal'}" (${dispo.stockActuel} u.)` })
        }
      }
    }

    // 9. CATÉGORIE ALIMENTAIRE — Ingrédient clé en rupture
    if (p.categorie === 'Alimentaire' && p.specifications?.estIngredientCle && p.stockActuel === 0) {
      alertes.push({ type: 'ingredient_cle_rupture', produit: p, secteur: p.secteur, gravite: 'critique',
        message: `${p.nom}: INGRÉDIENT CLÉ en rupture de stock !` })
    }

    // 10. CATÉGORIE BOISSON — Produits consignés en attente de retour
    if (p.categorie === 'Boisson' && p.specifications?.estConsigne) {
      const retoursEnAttente = getRetoursByStatut('en_attente').filter(r => r.produitId === p.id)
      if (retoursEnAttente.length > 0) {
        alertes.push({ type: 'consigne_en_attente', produit: p, secteur: p.secteur, gravite: 'info',
          message: `${p.nom}: ${retoursEnAttente.length} retour(s) consigné(s) en attente` })
      }
    }

    // 11. CATÉGORIE HYGIÈNE — Produit essentiel en rupture
    if (p.categorie === 'Hygiène' && p.specifications?.estProduitEssentiel && p.stockActuel === 0) {
      alertes.push({ type: 'hygiene_essentiel_rupture', produit: p, secteur: p.secteur, gravite: 'critique',
        message: `${p.nom}: produit essentiel en rupture !` })
    }

    // 12. CATÉGORIE ENTRETIEN — Produit de base critique
    if (p.categorie === 'Entretien' && p.specifications?.estProduitMénagerBase && p.stockActuel <= p.seuilAlerte) {
      alertes.push({ type: 'entretien_base_critique', produit: p, secteur: p.secteur, gravite: 'warning',
        message: `${p.nom}: produit ménager de base — stock critique (${p.stockActuel} restant)` })
    }

    // 13. CATÉGORIE VÊTEMENT — Best-seller à réapprovisionner
    if (p.categorie === 'Vêtement' && p.specifications?.estBestSeller && p.stockActuel <= p.seuilAlerte) {
      alertes.push({ type: 'vetement_bestseller', produit: p, secteur: p.secteur, gravite: 'warning',
        message: `${p.nom}: best-seller à réapprovisionner (${p.stockActuel} restant)` })
    }
  }

  // 14. RETOURS CONSIGNÉS GLOBAUX EN ATTENTE
  const tousRetoursEnAttente = getRetoursByStatut('en_attente')
  if (tousRetoursEnAttente.length > 5) {
    alertes.push({ type: 'retours_consignes_globaux', produit: null, secteur: 'detail', gravite: 'warning',
      message: `${tousRetoursEnAttente.length} retours consignés en attente de traitement` })
  }

  return alertes
}

// ══════════════════════════════════════════════════════════════
// RAPPORTS SECTORIELS
// ══════════════════════════════════════════════════════════════
export function getRapportBestSellers(dateDebut, dateFin, limit = 10) {
  const mouvements = getMouvementsByDate(dateDebut, dateFin)
  const sorties = mouvements.filter(m => m.type === 'sortie')
  const map = {}
  sorties.forEach(m => {
    if (!map[m.produitId]) map[m.produitId] = { produitId: m.produitId, nom: m.produitNom, secteur: m.produitSecteur, quantiteVendue: 0, ca: 0 }
    map[m.produitId].quantiteVendue += m.quantite
    map[m.produitId].ca += m.montantTotal
  })
  return Object.values(map).sort((a, b) => b.quantiteVendue - a.quantiteVendue).slice(0, limit)
}

export function getRapportInvendus(jours = 90) {
  const produits = getAll('products_v2').filter(p => p.actif && p.stockActuel > 0)
  const limite = new Date()
  limite.setDate(limite.getDate() - jours)
  const limiteStr = limite.toISOString()
  const mouvements = getAll('stock_mouvements')
  return produits.filter(p => {
    const sorties = mouvements.filter(m => m.produitId === p.id && m.type === 'sortie' && m.dateMouvement >= limiteStr)
    return sorties.length === 0
  })
}

export function getRapportMarges(secteur = null) {
  const produits = secteur ? getProductsBySecteur(secteur) : getAll('products_v2').filter(p => p.actif)
  return produits.filter(p => p.prixAchat > 0).map(p => {
    const marge = ((p.prixVente - p.prixAchat) / p.prixAchat) * 100
    return { ...p, marge, valeurStock: p.stockActuel * p.prixAchat, caPotentiel: p.stockActuel * p.prixVente }
  }).sort((a, b) => a.marge - b.marge)
}

export function getRapportSaisonnier() {
  const mouvements = getAll('stock_mouvements')
  const parMois = {}
  mouvements.filter(m => m.type === 'sortie').forEach(m => {
    const mois = m.dateMouvement.slice(0, 7)
    if (!parMois[mois]) parMois[mois] = { mois, quantite: 0, ca: 0, nbVentes: 0 }
    parMois[mois].quantite += m.quantite
    parMois[mois].ca += m.montantTotal
    parMois[mois].nbVentes++
  })
  return Object.values(parMois).sort((a, b) => a.mois.localeCompare(b.mois))
}

export function getRapportConsommationPharma(dateDebut, dateFin) {
  const produits = getProductsBySecteur('pharmaceutique')
  const mouvements = getMouvementsByDate(dateDebut, dateFin)
  const sorties = mouvements.filter(m => m.type === 'sortie')
  return produits.map(p => {
    const s = sorties.filter(m => m.produitId === p.id)
    return { ...p, totalSorti: s.reduce((acc, m) => acc + m.quantite, 0), nbVentes: s.length, ca: s.reduce((acc, m) => acc + m.montantTotal, 0) }
  }).filter(p => p.totalSorti > 0).sort((a, b) => b.totalSorti - a.totalSorti)
}

// ══════════════════════════════════════════════════════════════
// STATISTIQUES
// ══════════════════════════════════════════════════════════════
export function getStatsStock(secteur = null) {
  const produits = secteur ? getProductsBySecteur(secteur) : getAll('products_v2').filter(p => p.actif)
  const mouvements = getAll('stock_mouvements')

  const totalProduits = produits.length
  const valeurStock = produits.reduce((s, p) => s + (p.stockActuel * p.prixAchat), 0)
  const valeurVente = produits.reduce((s, p) => s + (p.stockActuel * p.prixVente), 0)
  const stockBas = produits.filter(p => p.stockActuel <= p.seuilAlerte).length
  const stockEpuise = produits.filter(p => p.stockActuel === 0).length

  const now = new Date()
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const mouvementsMois = mouvements.filter(m => m.dateMouvement >= debutMois)
  const entreesMois = mouvementsMois.filter(m => m.type === 'entree').reduce((s, m) => s + m.quantite, 0)
  const sortiesMois = mouvementsMois.filter(m => m.type === 'sortie').reduce((s, m) => s + m.quantite, 0)

  const stockMoyen = produits.reduce((s, p) => s + p.stockActuel, 0) / Math.max(produits.length, 1)
  const rotationStock = stockMoyen > 0 ? (sortiesMois / stockMoyen).toFixed(1) : 0

  const produitsMap = {}
  mouvementsMois.forEach(m => {
    if (!produitsMap[m.produitId]) produitsMap[m.produitId] = { nom: m.produitNom, secteur: m.produitSecteur, entrees: 0, sorties: 0 }
    if (m.type === 'entree') produitsMap[m.produitId].entrees += m.quantite
    if (m.type === 'sortie') produitsMap[m.produitId].sorties += m.quantite
  })

  // Marges
  const produitsAvecMarge = produits.filter(p => p.prixAchat > 0)
  const margeMoyenne = produitsAvecMarge.length > 0
    ? produitsAvecMarge.reduce((s, p) => s + ((p.prixVente - p.prixAchat) / p.prixAchat * 100), 0) / produitsAvecMarge.length
    : 0

  // Par secteur
  const parSecteur = {}
  for (const s of SECTEURS_COMMERCE) {
    const pSect = produits.filter(p => p.secteur === s.id)
    if (pSect.length > 0) {
      parSecteur[s.id] = {
        ...s,
        nbProduits: pSect.length,
        valeurStock: pSect.reduce((s2, p) => s2 + p.stockActuel * p.prixAchat, 0),
        stockBas: pSect.filter(p => p.stockActuel <= p.seuilAlerte).length,
      }
    }
  }

  return {
    totalProduits, valeurStock, valeurVente, margeStock: valeurVente - valeurStock,
    stockBas, stockEpuise, entreesMois, sortiesMois, rotationStock,
    produitsActifs: produits.length, margeMoyenne: margeMoyenne.toFixed(1),
    topProduits: Object.values(produitsMap).sort((a, b) => b.sorties - a.sorties).slice(0, 10),
    parSecteur,
  }
}

// ══════════════════════════════════════════════════════════════
// INVENTAIRE PHYSIQUE
// ══════════════════════════════════════════════════════════════
export function getInventaires() { return getAll('stock_inventaires') }

export function demarrerInventaire(nom, secteur = null, creePar = '') {
  const items = getAll('stock_inventaires')
  let produits = getAll('products_v2').filter(p => p.actif)
  if (secteur) produits = produits.filter(p => p.secteur === secteur)
  const inventaire = {
    id: nextId(items),
    nom: sanitize(nom || `Inventaire ${new Date().toLocaleDateString('fr-FR')}`),
    secteur: secteur || 'all',
    statut: 'en_cours',
    creePar: sanitize(creePar),
    dateDebut: new Date().toISOString(),
    dateFin: null,
    lignes: produits.map(p => ({
      produitId: p.id, produitNom: p.nom, reference: p.reference || '', secteur: p.secteur,
      stockSysteme: p.stockActuel, stockCompte: null, ecart: null, commentaire: '',
    })),
    resume: { totalProduits: produits.length, comptes: 0, ecarts: 0 },
  }
  items.push(inventaire)
  setAll('stock_inventaires', items)
  addLog('Inventaire démarré', inventaire.nom, inventaire.id)
  return inventaire
}

export function compterInventaire(inventaireId, produitId, quantite, commentaire = '') {
  const items = getAll('stock_inventaires')
  const idx = items.findIndex(i => i.id === inventaireId)
  if (idx === -1) return null
  const inv = items[idx]
  const lIdx = inv.lignes.findIndex(l => l.produitId === produitId)
  if (lIdx === -1) return null
  inv.lignes[lIdx].stockCompte = quantite
  inv.lignes[lIdx].ecart = quantite - inv.lignes[lIdx].stockSysteme
  inv.lignes[lIdx].commentaire = sanitize(commentaire)
  inv.resume.comptes = inv.lignes.filter(l => l.stockCompte !== null).length
  inv.resume.ecarts = inv.lignes.filter(l => l.ecart !== null && l.ecart !== 0).length
  items[idx] = inv
  setAll('stock_inventaires', items)
  return inv
}

export function terminerInventaire(inventaireId, appliquerAjustements = false, creePar = '') {
  const items = getAll('stock_inventaires')
  const idx = items.findIndex(i => i.id === inventaireId)
  if (idx === -1) return null
  const inv = items[idx]
  inv.statut = 'terminé'
  inv.dateFin = new Date().toISOString()
  if (appliquerAjustements) {
    for (const ligne of inv.lignes) {
      if (ligne.stockCompte !== null && ligne.ecart !== 0) {
        ajusterStock(ligne.produitId, ligne.stockCompte, `Inventaire: ${inv.nom}`, creePar)
      }
    }
  }
  items[idx] = inv
  setAll('stock_inventaires', items)
  addLog('Inventaire terminé', `${inv.nom} — ${inv.resume.ecarts} écart(s)`, inv.id)
  return inv
}

// ══════════════════════════════════════════════════════════════
// ENTREPÔTS
// ══════════════════════════════════════════════════════════════
export function getEntrepots() { return getAll('stock_entrepots') }

export function addEntrepot(e) {
  const items = getAll('stock_entrepots')
  const entrepot = {
    id: nextId(items), nom: sanitize(e.nom || ''), adresse: sanitize(e.adresse || ''),
    responsable: sanitize(e.responsable || ''), telephone: sanitize(e.telephone || ''),
    capacite: Number(e.capacite) || 0, ville: sanitize(e.ville || ''),
    zone: sanitize(e.zone || ''), actif: true, dateCreation: new Date().toISOString(),
  }
  items.push(entrepot)
  setAll('stock_entrepots', items)
  addLog('Entrepôt créé', entrepot.nom, entrepot.id)
  return entrepot
}

export function updateEntrepot(e) {
  const items = getAll('stock_entrepots')
  const idx = items.findIndex(i => i.id === e.id)
  if (idx !== -1) items[idx] = { ...items[idx], ...e }
  setAll('stock_entrepots', items)
}

export function deleteEntrepot(id) {
  setAll('stock_entrepots', getAll('stock_entrepots').filter(i => i.id !== id))
  addLog('Entrepôt supprimé', String(id), id)
}

// ══════════════════════════════════════════════════════════════
// LOTS
// ══════════════════════════════════════════════════════════════
export function getLots() { return getAll('stock_lots') }

export function addLot(l) {
  const items = getAll('stock_lots')
  const lot = {
    id: nextId(items), produitId: l.produitId, numeroLot: sanitize(l.numeroLot || ''),
    quantite: Number(l.quantite) || 0, datePeremption: l.datePeremption || null,
    dateProduction: l.dateProduction || null, fournisseur: sanitize(l.fournisseur || ''),
    prixAchat: Number(l.prixAchat) || 0, statut: l.statut || 'actif',
    dateCreation: new Date().toISOString(),
  }
  items.push(lot)
  setAll('stock_lots', items)
  addLog('Lot créé', `${lot.numeroLot} — Produit #${lot.produitId}`, lot.id)
  return lot
}

export function updateLot(l) {
  const items = getAll('stock_lots')
  const idx = items.findIndex(i => i.id === l.id)
  if (idx !== -1) items[idx] = { ...items[idx], ...l }
  setAll('stock_lots', items)
}

export function getLotsByProduit(produitId) {
  return getAll('stock_lots').filter(l => l.produitId === produitId)
}

export function getLotsPerimes() {
  const now = new Date().toISOString().slice(0, 10)
  return getAll('stock_lots').filter(l => l.statut === 'actif' && l.datePeremption && l.datePeremption <= now)
}

export function getLotsProchesPeremption(jours = 30) {
  const limite = new Date()
  limite.setDate(limite.getDate() + jours)
  const limiteStr = limite.toISOString().slice(0, 10)
  const nowStr = new Date().toISOString().slice(0, 10)
  return getAll('stock_lots').filter(l => l.statut === 'actif' && l.datePeremption && l.datePeremption > nowStr && l.datePeremption <= limiteStr)
}

// ══════════════════════════════════════════════════════════════
// MIGRATION V1 → V2
// ══════════════════════════════════════════════════════════════
export function migrateFromV1() {
  const oldProducts = getAll('products')
  const newProducts = getAll('products_v2')
  if (newProducts.length > 0 || oldProducts.length === 0) return 0
  let migrated = 0
  for (const p of oldProducts) {
    const nouveau = {
      id: nextId(newProducts), reference: '', nom: p.nom || '', description: '',
      secteur: 'detail', categorie: p.type || 'Autre', barcode: p.barcode || '', unite: 'pièce',
      prixAchat: (p.prixCasier || 0) / (p.nbUnitesParCasier || 1), prixVente: p.prixUnite || 0,
      margeMinimum: 10, stockActuel: p.stockActuel || 0, stockMinimal: 0, stockMaximal: 99999,
      seuilAlerte: p.seuilAlerte || 5, emplacement: '', entrepot: 'Principal', image: p.image || '',
      specifications: { nombreCasiers: p.nombreCasiers || 0, prixCasier: p.prixCasier || 0, nbUnitesParCasier: p.nbUnitesParCasier || 24, ancienId: p.id },
      variants: [], serialNumbers: [], recettes: [], actif: true,
      dateCreation: p.dateCreation || new Date().toISOString(), dateModification: new Date().toISOString(),
    }
    newProducts.push(nouveau)
    migrated++
  }
  setAll('products_v2', newProducts)
  addLog('Migration V1→V2', `${migrated} produits migrés`)
  return migrated
}

export function getProductsCompat() {
  const v2 = getAll('products_v2')
  if (v2.length > 0) {
    return v2.map(p => ({
      id: p.id, nom: p.nom, type: p.categorie || 'Autre', barcode: p.barcode,
      nombreCasiers: p.specifications?.nombreCasiers || 0, prixCasier: p.specifications?.prixCasier || 0,
      nbUnitesParCasier: p.specifications?.nbUnitesParCasier || 24, prixUnite: p.prixVente,
      stockInitial: p.stockActuel, stockActuel: p.stockActuel, seuilAlerte: p.seuilAlerte, image: p.image,
    }))
  }
  return getAll('products')
}
