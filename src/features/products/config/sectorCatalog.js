// Config : catalogue des sous-secteurs du commerce en Côte d'Ivoire
// Module déclaratif pur — aucun import pour éviter les dépendances circulaires.

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

export function getSecteurById(id) {
  return SECTEURS_COMMERCE.find(s => s.id === id) || null
}

export const SECTEUR_PREFIX_REFERENCE = {
  detail: 'DET', alimentaire: 'ALI', industriel: 'IND', pharmaceutique: 'PHAR',
  mode: 'MOD', high_tech: 'TECH', logistique: 'LOG', educatif: 'EDU',
}
