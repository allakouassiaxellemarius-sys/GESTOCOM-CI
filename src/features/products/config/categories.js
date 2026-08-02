// Config : unités de mesure et catégories par sous-secteur commerce.

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

export const CATEGORY_ICONS = {
  Alimentaire: '🍽️', Boisson: '🍷', Hygiène: '🧼', Entretien: '🧹',
  Électronique: '📱', Vêtement: '👕', Autre: '📦',
}

export function getCategories(secteur) {
  return CATEGORIES_SECTOR[secteur] || []
}

export function getUnites(secteur) {
  return UNITES[secteur] || ['pièce']
}
