// Config : schéma déclaratif des champs spécifiques (secteur + catégorie).
// Chaque champ : { key, label, type: text|number|date|select|checkbox, options?, default?, placeholder? }

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

export function getSectorFields(secteur) {
  return SECTOR_FIELDS[secteur] || []
}

export function getCategoryFields(categorie) {
  return CATEGORY_FIELDS[categorie] || []
}
