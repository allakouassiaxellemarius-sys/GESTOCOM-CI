const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-B3biuG_G.js","./pdf-D_apager.js","./index-DNzFMgCo.js"])))=>i.map(i=>d[i]);
import{_ as A}from"./pdf-D_apager.js";const f=`
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
`;let o=null,a=!1,m=null;const X="gestocom";function O(){return o!==null&&a}function v(){return o}async function D(){return m||(m=(async()=>{try{const{Capacitor:n}=await A(async()=>{const{Capacitor:t}=await import("./index-DNzFMgCo.js");return{Capacitor:t}},[],import.meta.url),e=n.getPlatform();if(e==="electron"||e==="web"){const{SQLite:t}=await A(async()=>{const{SQLite:s}=await import("./index-B3biuG_G.js");return{SQLite:s}},__vite__mapDeps([0,1,2]),import.meta.url),{JeepSqlite:E}=await A(async()=>{const{JeepSqlite:s}=await Promise.resolve().then(()=>U);return{JeepSqlite:s}},void 0,import.meta.url);customElements.define("jeep-sqlite",E);const r=document.createElement("jeep-sqlite");document.body.appendChild(r),await customElements.whenDefined("jeep-sqlite"),await t.initWebStore(),o=await t.createConnection({database:X,version:1,encrypted:!1,mode:"no-encryption"})}else{const{SQLite:t}=await A(async()=>{const{SQLite:r}=await import("./index-B3biuG_G.js");return{SQLite:r}},__vite__mapDeps([0,1,2]),import.meta.url);o=await t.createConnection({database:X,version:1,encrypted:!1,mode:"no-encryption"})}return await o.open(),await N(),a=!0,!0}catch(n){return console.error("[SQL] initSQLite failed:",n),o=null,a=!1,!1}})(),m)}async function N(){const n=f.split(";").map(e=>e.trim()).filter(e=>e.length>0);for(const e of n)try{await o.execute(e)}catch{}}async function y(n){if(!a)return[];try{return(await o.query(`SELECT * FROM ${n}`)).values||[]}catch{return[]}}async function G(n,e){var t;if(!a)return null;try{return((t=(await o.query(`SELECT * FROM ${n} WHERE id = ?`,[e])).values)==null?void 0:t[0])||null}catch{return null}}async function I(n,e){if(!a)return null;const t=Object.keys(e),E=t.map(()=>"?").join(","),r=t.map(T=>{const s=e[T];return typeof s=="object"&&s!==null?JSON.stringify(s):s});try{const T=await o.run(`INSERT INTO ${n} (${t.join(",")}) VALUES (${E})`,r);return{...e,id:T.changes?T.lastId:e.id}}catch(T){return console.error(`[SQL] insert ${n}:`,T.message),null}}async function C(n,e,t){if(!a)return;const E=Object.keys(t).filter(s=>s!=="id"),r=E.map(s=>`${s} = ?`).join(", "),T=E.map(s=>{const i=t[s];return typeof i=="object"&&i!==null?JSON.stringify(i):i});try{await o.run(`UPDATE ${n} SET ${r} WHERE id = ?`,[...T,e])}catch(s){console.error(`[SQL] update ${n}:`,s.message)}}async function M(n,e){if(a)try{await o.run(`DELETE FROM ${n} WHERE id = ?`,[e])}catch(t){console.error(`[SQL] delete ${n}:`,t.message)}}async function g(n,e=[]){if(!a)return null;try{return await o.run(n,e)}catch(t){return console.error("[SQL] run error:",t.message),null}}async function S(n,e=[]){if(!a)return[];try{return(await o.query(n,e)).values||[]}catch(t){return console.error("[SQL] query error:",t.message),[]}}async function L(n){const e=await S("SELECT value FROM settings WHERE key = ?",[n]);if(e.length===0)return null;try{return JSON.parse(e[0].value)}catch{return e[0].value}}async function d(n,e){const t=typeof e=="object"?JSON.stringify(e):String(e);await g("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",[n,t])}async function w(){if(!a||await L("_migrated_v1"))return!1;const e={users:"users",products:"products",products_v2:"products_v2",ventes:"ventes",depenses:"depenses",fournisseurs:"fournisseurs",commandes:"commandes",retours:"retours",receipts:"receipts",logs:"logs",stock_mouvements:"stock_mouvements",stock_entrepots:"stock_entrepots",stock_lots:"stock_lots",stock_inventaires:"stock_inventaires"},t={company:"company",stock_settings:"stock_settings",ventes_settings:"ventes_settings",clients_settings:"clients_settings",rapports_settings:"rapports_settings",login_attempts:"login_attempts"};let E=0;for(const[r,T]of Object.entries(e))try{const s=localStorage.getItem(`gestocom_${r}`);if(!s)continue;const i=JSON.parse(s);if(!Array.isArray(i)||i.length===0||(await y(T)).length>0)continue;for(const p of i){const c={};for(const[_,l]of Object.entries(p)){const R=_.replace(/([A-Z])/g,"_$1").toLowerCase();typeof l=="object"&&l!==null?c[R]=JSON.stringify(l):typeof l=="boolean"?c[R]=l?1:0:c[R]=l}await I(T,c),E++}}catch{}for(const[r,T]of Object.entries(t))try{const s=localStorage.getItem(`gestocom_${r}`);if(!s)continue;const i=JSON.parse(s);if(await L(T)!==null)continue;await d(T,i),E++}catch{}return E>0&&await d("_migrated_v1",!0),E}async function k(){if(!a)return 0;const n={users:"users",products:"products",products_v2:"products_v2",ventes:"ventes",depenses:"depenses",fournisseurs:"fournisseurs",commandes:"commandes",retours:"retours",receipts:"receipts",logs:"logs",stock_mouvements:"stock_mouvements",stock_entrepots:"stock_entrepots",stock_lots:"stock_lots",stock_inventaires:"stock_inventaires"},e={company:"company",stock_settings:"stock_settings",ventes_settings:"ventes_settings",clients_settings:"clients_settings",rapports_settings:"rapports_settings",login_attempts:"login_attempts"};let t=0;for(const[E,r]of Object.entries(n))try{const T=localStorage.getItem(`gestocom_${E}`);if(!T)continue;const s=JSON.parse(T);if(!Array.isArray(s)||s.length===0)continue;for(const i of s){const u={};for(const[p,c]of Object.entries(i)){const _=p.replace(/([A-Z])/g,"_$1").toLowerCase();typeof c=="object"&&c!==null?u[_]=JSON.stringify(c):typeof c=="boolean"?u[_]=c?1:0:u[_]=c}await I(r,u),t++}}catch{}for(const[E,r]of Object.entries(e))try{const T=localStorage.getItem(`gestocom_${E}`);if(!T)continue;const s=JSON.parse(T);await d(r,s),t++}catch{}return t}const U=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));export{k as forceMigrateFromLocalStorage,v as getDb,D as initSQLite,O as isSQLiteAvailable,w as migrateLocalStorage,M as sqlDelete,y as sqlGetAll,G as sqlGetById,L as sqlGetSetting,I as sqlInsert,S as sqlQuery,g as sqlRun,d as sqlSetSetting,C as sqlUpdate};
