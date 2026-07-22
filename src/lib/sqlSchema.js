export const SCHEMA_SQL = `
-- ══════════════════════════════════════════════════════════════
-- GESTOCOM CI — Schéma SQLite
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE,
  mot_de_passe TEXT NOT NULL,
  salt TEXT,
  role TEXT NOT NULL DEFAULT 'vendeur',
  email TEXT,
  telephone TEXT,
  date_creation TEXT,
  is_default INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT,
  type TEXT,
  barcode TEXT,
  nombre_casiers INTEGER DEFAULT 0,
  prix_casier REAL DEFAULT 0,
  nb_unites_par_casier INTEGER DEFAULT 24,
  prix_unite REAL DEFAULT 0,
  stock_initial INTEGER DEFAULT 0,
  stock_actuel INTEGER DEFAULT 0,
  seuil_alerte INTEGER DEFAULT 50,
  image TEXT,
  date_creation TEXT
);

CREATE TABLE IF NOT EXISTS products_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT,
  nom TEXT,
  description TEXT,
  secteur TEXT DEFAULT 'detail',
  categorie TEXT,
  barcode TEXT,
  unite TEXT DEFAULT 'pièce',
  prix_achat REAL DEFAULT 0,
  prix_vente REAL DEFAULT 0,
  marge_minimum REAL DEFAULT 10,
  stock_actuel INTEGER DEFAULT 0,
  stock_minimal INTEGER DEFAULT 0,
  stock_maximal INTEGER DEFAULT 99999,
  seuil_alerte INTEGER DEFAULT 5,
  emplacement TEXT,
  entrepot TEXT DEFAULT 'Principal',
  image TEXT,
  specifications TEXT DEFAULT '{}',
  variants TEXT DEFAULT '[]',
  serial_numbers TEXT DEFAULT '[]',
  recettes TEXT DEFAULT '[]',
  actif INTEGER DEFAULT 1,
  date_creation TEXT,
  date_modification TEXT
);

CREATE TABLE IF NOT EXISTS ventes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER,
  nom_produit TEXT,
  type_produit TEXT,
  quantite INTEGER,
  prix_unitaire REAL,
  cout_achat REAL,
  sous_total REAL,
  remise REAL DEFAULT 0,
  total REAL,
  mode_paiement TEXT DEFAULT 'especes',
  caissier TEXT,
  date_vente TEXT
);

CREATE TABLE IF NOT EXISTS depenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  libelle TEXT,
  montant REAL,
  categorie TEXT,
  date TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS fournisseurs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT,
  telephone TEXT,
  email TEXT,
  adresse TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS commandes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER,
  produit_nom TEXT,
  fournisseur_id INTEGER,
  fournisseur_nom TEXT,
  quantite INTEGER,
  prix_unitaire REAL,
  montant_total REAL,
  statut TEXT DEFAULT 'en_attente',
  date_commande TEXT,
  date_livraison TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS retours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vente_id INTEGER,
  nom_produit TEXT,
  quantite INTEGER,
  motif TEXT,
  montant REAL,
  caissier TEXT,
  date_retour TEXT,
  statut TEXT DEFAULT 'remboursé'
);

CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE,
  date TEXT,
  client TEXT,
  telephone TEXT,
  fidelity TEXT,
  ventes TEXT DEFAULT '[]',
  sous_total REAL DEFAULT 0,
  remise REAL DEFAULT 0,
  remise_type TEXT DEFAULT 'montant',
  taxes REAL DEFAULT 0,
  total REAL DEFAULT 0,
  mode_paiement TEXT DEFAULT 'Espèces',
  reference_paiement TEXT,
  caissier TEXT DEFAULT 'Inconnu',
  pied TEXT DEFAULT '{}',
  hash TEXT
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT,
  action TEXT,
  detail TEXT,
  user_id INTEGER,
  user_nom TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS stock_mouvements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER,
  produit_nom TEXT,
  produit_secteur TEXT,
  type TEXT,
  quantite INTEGER DEFAULT 0,
  quantite_avant INTEGER DEFAULT 0,
  quantite_apres INTEGER DEFAULT 0,
  motif TEXT,
  reference TEXT,
  fournisseur TEXT,
  client TEXT,
  entrepot TEXT,
  entrepot_destination TEXT,
  prix_unitaire REAL DEFAULT 0,
  montant_total REAL DEFAULT 0,
  lot TEXT,
  numero_serie TEXT,
  date_peremption TEXT,
  variant_taille TEXT,
  variant_couleur TEXT,
  colis_id TEXT,
  recette_nom TEXT,
  cree_par TEXT,
  date_mouvement TEXT
);

CREATE TABLE IF NOT EXISTS stock_entrepots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT,
  adresse TEXT,
  responsable TEXT,
  telephone TEXT,
  capacite INTEGER DEFAULT 0,
  ville TEXT,
  zone TEXT,
  actif INTEGER DEFAULT 1,
  date_creation TEXT
);

CREATE TABLE IF NOT EXISTS stock_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER,
  numero_lot TEXT,
  quantite INTEGER DEFAULT 0,
  date_peremption TEXT,
  date_production TEXT,
  fournisseur TEXT,
  prix_achat REAL DEFAULT 0,
  statut TEXT DEFAULT 'actif',
  date_creation TEXT
);

CREATE TABLE IF NOT EXISTS stock_inventaires (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT,
  secteur TEXT DEFAULT 'all',
  statut TEXT DEFAULT 'en_cours',
  cree_par TEXT,
  date_debut TEXT,
  date_fin TEXT,
  lignes TEXT DEFAULT '[]',
  resume TEXT DEFAULT '{}'
);
`
