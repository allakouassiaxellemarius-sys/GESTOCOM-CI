import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, X, Download, Truck, User, MapPin, DollarSign } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import Pagination from '../components/Pagination'
import { exportCSV } from '../lib/exportCSV'

const DB_PREFIX = 'gestocom_'
function getAll(name) { try { return JSON.parse(localStorage.getItem(DB_PREFIX + name) || '[]') } catch { return [] } }
function setAll(name, data) { localStorage.setItem(DB_PREFIX + name, JSON.stringify(data)) }
function nextId(items) { return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1 }

const TABS = [
  { key: 'vehicules', label: 'Véhicules', icon: Truck },
  { key: 'chauffeurs', label: 'Chauffeurs', icon: User },
  { key: 'livraisons', label: 'Livraisons', icon: MapPin },
  { key: 'couts', label: 'Coûts logistiques', icon: DollarSign },
]

const typesVehicule = ['Camion', 'Fourgon', 'Utilitaire', 'Moto', 'Tricycle', 'Autre']
const statutsVehicule = [
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'en_panne', label: 'En panne', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'en_maintenance', label: 'En maintenance', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
]
const statutsChauffeur = [
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'inactif', label: 'Inactif', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' },
  { value: 'suspendu', label: 'Suspendu', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]
const statutsLivraison = [
  { value: 'en_attente', label: 'En attente', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'livrée', label: 'Livrée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'retournée', label: 'Retournée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]

const emptyVehicule = { immatriculation: '', marque: '', modele: '', type: 'Camion', capacite: 0, statut: 'actif', kmParcourus: 0 }
const emptyChauffeur = { nom: '', telephone: '', permis: '', vehiculeId: '', statut: 'actif' }
const emptyLivraison = { client: '', adresse: '', vehiculeId: '', chauffeurId: '', colis: '', statut: 'en_attente', datePrevue: '', dateEffective: '', cout: 0 }

export default function TransportPage() {
  const [tab, setTab] = useState('vehicules')
  const [vehicules, setVehicules] = useState(() => getAll('tr_vehicules'))
  const [chauffeurs, setChauffeurs] = useState(() => getAll('tr_chauffeurs'))
  const [livraisons, setLivraisons] = useState(() => getAll('tr_livraisons'))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formVeh, setFormVeh] = useState(null)
  const [formChauf, setFormChauf] = useState(null)
  const [formLiv, setFormLiv] = useState(null)
  const perPage = 20

  const refresh = () => {
    setVehicules(getAll('tr_vehicules'))
    setChauffeurs(getAll('tr_chauffeurs'))
    setLivraisons(getAll('tr_livraisons'))
  }

  const saveVehicules = (d) => { setAll('tr_vehicules', d); refresh() }
  const saveChauffeurs = (d) => { setAll('tr_chauffeurs', d); refresh() }
  const saveLivraisons = (d) => { setAll('tr_livraisons', d); refresh() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-brand-500" /> Transport & Logistique
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-gray-100 dark:bg-dark-800 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setPage(1) }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-white dark:bg-dark-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:bg-white/50'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'vehicules' && (
        <VehiculesTab vehicules={vehicules} search={search} setSearch={setSearch} page={page} setPage={setPage} perPage={perPage}
          onAdd={() => setFormVeh({ ...emptyVehicule })} onEdit={(v) => setFormVeh({ ...v })}
          onDelete={(id) => { if (confirm('Supprimer ce véhicule ?')) { saveVehicules(vehicules.filter(v => v.id !== id)) } }}
          onExport={() => exportCSV('vehicules', ['ID', 'Immatriculation', 'Marque', 'Modèle', 'Type', 'Capacité', 'Statut', 'Km parcourus'],
            vehicules.map(v => [v.id, v.immatriculation, v.marque, v.modele, v.type, v.capacite, v.statut, v.kmParcourus]))}
        />
      )}

      {tab === 'chauffeurs' && (
        <ChauffeursTab chauffeurs={chauffeurs} vehicules={vehicules} search={search} setSearch={setSearch} page={page} setPage={setPage} perPage={perPage}
          onAdd={() => setFormChauf({ ...emptyChauffeur })} onEdit={(c) => setFormChauf({ ...c })}
          onDelete={(id) => { if (confirm('Supprimer ce chauffeur ?')) { saveChauffeurs(chauffeurs.filter(c => c.id !== id)) } }}
          onExport={() => exportCSV('chauffeurs', ['ID', 'Nom', 'Téléphone', 'Permis', 'Véhicule', 'Statut'],
            chauffeurs.map(c => [c.id, c.nom, c.telephone, c.permis, vehicules.find(v => v.id === +c.vehiculeId)?.immatriculation || '', c.statut]))}
        />
      )}

      {tab === 'livraisons' && (
        <LivraisonsTab livraisons={livraisons} vehicules={vehicules} chauffeurs={chauffeurs} search={search} setSearch={setSearch} page={page} setPage={setPage} perPage={perPage}
          onAdd={() => setFormLiv({ ...emptyLivraison })} onEdit={(l) => setFormLiv({ ...l })}
          onDelete={(id) => { if (confirm('Supprimer cette livraison ?')) { saveLivraisons(livraisons.filter(l => l.id !== id)) } }}
          onExport={() => exportCSV('livraisons', ['ID', 'Client', 'Adresse', 'Véhicule', 'Chauffeur', 'Colis', 'Statut', 'Date prévue', 'Date effective', 'Coût'],
            livraisons.map(l => [l.id, l.client, l.adresse, vehicules.find(v => v.id === +l.vehiculeId)?.immatriculation || '', chauffeurs.find(c => c.id === +l.chauffeurId)?.nom || '', l.colis, l.statut, l.datePrevue, l.dateEffective, l.cout]))}
        />
      )}

      {tab === 'couts' && <CoutsLogistiquesTab livraisons={livraisons} vehicules={vehicules} />}

      {/* Modal Véhicule */}
      {formVeh && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{formVeh.id ? 'Modifier' : 'Ajouter'} un véhicule</h3>
              <button onClick={() => setFormVeh(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Immatriculation</label>
                <input value={formVeh.immatriculation} onChange={e => setFormVeh({ ...formVeh, immatriculation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Marque</label>
                <input value={formVeh.marque} onChange={e => setFormVeh({ ...formVeh, marque: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modèle</label>
                <input value={formVeh.modele} onChange={e => setFormVeh({ ...formVeh, modele: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select value={formVeh.type} onChange={e => setFormVeh({ ...formVeh, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  {typesVehicule.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Capacité (kg)</label>
                <input type="number" value={formVeh.capacite} onChange={e => setFormVeh({ ...formVeh, capacite: +e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Km parcourus</label>
                <input type="number" value={formVeh.kmParcourus} onChange={e => setFormVeh({ ...formVeh, kmParcourus: +e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
                <select value={formVeh.statut} onChange={e => setFormVeh({ ...formVeh, statut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  {statutsVehicule.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setFormVeh(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => {
                if (formVeh.id) {
                  saveVehicules(vehicules.map(v => v.id === formVeh.id ? { ...formVeh } : v))
                } else {
                  saveVehicules([...vehicules, { ...formVeh, id: nextId(vehicules) }])
                }
                setFormVeh(null)
              }} className="btn-primary text-sm py-2 px-4" disabled={!formVeh.immatriculation}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chauffeur */}
      {formChauf && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{formChauf.id ? 'Modifier' : 'Ajouter'} un chauffeur</h3>
              <button onClick={() => setFormChauf(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom complet</label>
                <input value={formChauf.nom} onChange={e => setFormChauf({ ...formChauf, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Téléphone</label>
                <input value={formChauf.telephone} onChange={e => setFormChauf({ ...formChauf, telephone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Permis</label>
                <input value={formChauf.permis} onChange={e => setFormChauf({ ...formChauf, permis: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Véhicule affecté</label>
                <select value={formChauf.vehiculeId} onChange={e => setFormChauf({ ...formChauf, vehiculeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="">Aucun véhicule</option>
                  {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
                <select value={formChauf.statut} onChange={e => setFormChauf({ ...formChauf, statut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  {statutsChauffeur.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setFormChauf(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => {
                if (formChauf.id) {
                  saveChauffeurs(chauffeurs.map(c => c.id === formChauf.id ? { ...formChauf } : c))
                } else {
                  saveChauffeurs([...chauffeurs, { ...formChauf, id: nextId(chauffeurs) }])
                }
                setFormChauf(null)
              }} className="btn-primary text-sm py-2 px-4" disabled={!formChauf.nom}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Livraison */}
      {formLiv && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{formLiv.id ? 'Modifier' : 'Ajouter'} une livraison</h3>
              <button onClick={() => setFormLiv(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Client</label>
                  <input value={formLiv.client} onChange={e => setFormLiv({ ...formLiv, client: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Colis</label>
                  <input value={formLiv.colis} onChange={e => setFormLiv({ ...formLiv, colis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label>
                <input value={formLiv.adresse} onChange={e => setFormLiv({ ...formLiv, adresse: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Véhicule</label>
                  <select value={formLiv.vehiculeId} onChange={e => setFormLiv({ ...formLiv, vehiculeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    <option value="">Sélectionner</option>
                    {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Chauffeur</label>
                  <select value={formLiv.chauffeurId} onChange={e => setFormLiv({ ...formLiv, chauffeurId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    <option value="">Sélectionner</option>
                    {chauffeurs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date prévue</label>
                  <input type="date" value={formLiv.datePrevue} onChange={e => setFormLiv({ ...formLiv, datePrevue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date effective</label>
                  <input type="date" value={formLiv.dateEffective} onChange={e => setFormLiv({ ...formLiv, dateEffective: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Coût (FCFA)</label>
                  <input type="number" value={formLiv.cout} onChange={e => setFormLiv({ ...formLiv, cout: +e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
                  <select value={formLiv.statut} onChange={e => setFormLiv({ ...formLiv, statut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    {statutsLivraison.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setFormLiv(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => {
                if (formLiv.id) {
                  saveLivraisons(livraisons.map(l => l.id === formLiv.id ? { ...formLiv } : l))
                } else {
                  saveLivraisons([...livraisons, { ...formLiv, id: nextId(livraisons) }])
                }
                setFormLiv(null)
              }} className="btn-primary text-sm py-2 px-4" disabled={!formLiv.client || !formLiv.adresse}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VehiculesTab({ vehicules, search, setSearch, page, setPage, perPage, onAdd, onEdit, onDelete, onExport }) {
  const filtered = useMemo(() => {
    if (!search) return vehicules
    const q = search.toLowerCase()
    return vehicules.filter(v => v.immatriculation.toLowerCase().includes(q) || v.marque.toLowerCase().includes(q) || v.modele.toLowerCase().includes(q))
  }, [vehicules, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const getStatut = (s) => statutsVehicule.find(st => st.value === s) || statutsVehicule[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un véhicule..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} véhicule{filtered.length !== 1 ? 's' : ''}</span>
        <div className="ml-auto">
          <button onClick={onAdd} className="btn-primary text-sm py-2"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-4 py-3 font-medium">Immatriculation</th>
                <th className="px-4 py-3 font-medium">Marque</th>
                <th className="px-4 py-3 font-medium">Modèle</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Capacité</th>
                <th className="px-4 py-3 font-medium">Km parcourus</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(v => {
                const s = getStatut(v.statut)
                return (
                  <tr key={v.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 font-medium font-mono text-brand-600 dark:text-brand-400">{v.immatriculation}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{v.marque}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{v.modele}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{v.type}</span></td>
                    <td className="px-4 py-3 dark:text-gray-300">{(v.capacite || 0).toLocaleString('fr-FR')} kg</td>
                    <td className="px-4 py-3 dark:text-gray-300">{(v.kmParcourus || 0).toLocaleString('fr-FR')} km</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(v)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(v.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search ? 'Aucun véhicule ne correspond à la recherche' : 'Aucun véhicule'}</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function ChauffeursTab({ chauffeurs, vehicules, search, setSearch, page, setPage, perPage, onAdd, onEdit, onDelete, onExport }) {
  const filtered = useMemo(() => {
    if (!search) return chauffeurs
    const q = search.toLowerCase()
    return chauffeurs.filter(c => c.nom.toLowerCase().includes(q) || c.telephone.includes(q) || c.permis.toLowerCase().includes(q))
  }, [chauffeurs, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const getStatut = (s) => statutsChauffeur.find(st => st.value === s) || statutsChauffeur[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un chauffeur..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} chauffeur{filtered.length !== 1 ? 's' : ''}</span>
        <div className="ml-auto">
          <button onClick={onAdd} className="btn-primary text-sm py-2"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-4 py-3 font-medium">Nom</th>
                <th className="px-4 py-3 font-medium">Téléphone</th>
                <th className="px-4 py-3 font-medium">Permis</th>
                <th className="px-4 py-3 font-medium">Véhicule</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => {
                const s = getStatut(c.statut)
                const veh = vehicules.find(v => v.id === +c.vehiculeId)
                return (
                  <tr key={c.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 font-medium dark:text-white">{c.nom}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{c.telephone}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{c.permis}</td>
                    <td className="px-4 py-3">
                      {veh ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{veh.immatriculation}</span>
                      ) : <span className="text-gray-400 dark:text-gray-500">—</span>}
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(c)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(c.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search ? 'Aucun chauffeur ne correspond à la recherche' : 'Aucun chauffeur'}</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function LivraisonsTab({ livraisons, vehicules, chauffeurs, search, setSearch, page, setPage, perPage, onAdd, onEdit, onDelete, onExport }) {
  const filtered = useMemo(() => {
    if (!search) return livraisons
    const q = search.toLowerCase()
    return livraisons.filter(l => l.client.toLowerCase().includes(q) || l.adresse.toLowerCase().includes(q) || l.colis.toLowerCase().includes(q))
  }, [livraisons, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const getStatut = (s) => statutsLivraison.find(st => st.value === s) || statutsLivraison[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une livraison..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} livraison{filtered.length !== 1 ? 's' : ''}</span>
        <div className="ml-auto">
          <button onClick={onAdd} className="btn-primary text-sm py-2"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Adresse</th>
                <th className="px-4 py-3 font-medium">Véhicule</th>
                <th className="px-4 py-3 font-medium">Chauffeur</th>
                <th className="px-4 py-3 font-medium">Colis</th>
                <th className="px-4 py-3 font-medium">Date prévue</th>
                <th className="px-4 py-3 font-medium">Date effective</th>
                <th className="px-4 py-3 font-medium">Coût</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(l => {
                const s = getStatut(l.statut)
                const veh = vehicules.find(v => v.id === +l.vehiculeId)
                const chf = chauffeurs.find(c => c.id === +l.chauffeurId)
                return (
                  <tr key={l.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 font-medium dark:text-white">{l.client}</td>
                    <td className="px-4 py-3 dark:text-gray-300 max-w-[150px] truncate">{l.adresse}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{veh?.immatriculation || '—'}</span></td>
                    <td className="px-4 py-3 dark:text-gray-300">{chf?.nom || '—'}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{l.colis}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{l.datePrevue ? new Date(l.datePrevue).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{l.dateEffective ? new Date(l.dateEffective).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{(l.cout || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(l)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(l.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search ? 'Aucune livraison ne correspond à la recherche' : 'Aucune livraison'}</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function CoutsLogistiquesTab({ livraisons, vehicules }) {
  const stats = useMemo(() => {
    const byVehicle = {}
    vehicules.forEach(v => { byVehicle[v.id] = { vehicule: v, total: 0, nbLivraisons: 0 } })
    livraisons.forEach(l => {
      const vid = +l.vehiculeId
      if (byVehicle[vid]) {
        byVehicle[vid].total += (l.cout || 0)
        byVehicle[vid].nbLivraisons++
      }
    })
    return Object.values(byVehicle).sort((a, b) => b.total - a.total)
  }, [livraisons, vehicules])

  const totalGeneral = stats.reduce((s, v) => s + v.total, 0)
  const totalLivraisons = livraisons.length
  const totalLivrees = livraisons.filter(l => l.statut === 'livrée').length
  const totalRetournees = livraisons.filter(l => l.statut === 'retournée').length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coût total logistique</p>
          <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{totalGeneral.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total livraisons</p>
          <p className="text-xl font-bold dark:text-white">{totalLivraisons}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Livrées</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalLivrees}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Retournées</p>
          <p className="text-xl font-bold text-red-500 dark:text-red-400">{totalRetournees}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700">
          <h3 className="font-semibold dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-500" /> Coûts par véhicule
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-4 py-3 font-medium">Immatriculation</th>
                <th className="px-4 py-3 font-medium">Marque / Modèle</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Km parcourus</th>
                <th className="px-4 py-3 font-medium">Nb livraisons</th>
                <th className="px-4 py-3 font-medium">Coût total</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.vehicule.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                  <td className="px-4 py-3 font-medium font-mono text-brand-600 dark:text-brand-400">{s.vehicule.immatriculation}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{s.vehicule.marque} {s.vehicule.modele}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{s.vehicule.type}</span></td>
                  <td className="px-4 py-3 dark:text-gray-300">{(s.vehicule.kmParcourus || 0).toLocaleString('fr-FR')} km</td>
                  <td className="px-4 py-3 dark:text-gray-300">{s.nbLivraisons}</td>
                  <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">{s.total.toLocaleString('fr-FR')} FCFA</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stats.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucun véhicule enregistré</p>}
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold dark:text-white mb-4">Récapitulatif des coûts</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Carburant estimé</span>
            <span className="font-mono font-semibold dark:text-white">{Math.round(totalGeneral * 0.4).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Péages & taxes</span>
            <span className="font-mono font-semibold dark:text-white">{Math.round(totalGeneral * 0.15).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Maintenance</span>
            <span className="font-mono font-semibold dark:text-white">{Math.round(totalGeneral * 0.25).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400">Assurance</span>
            <span className="font-mono font-semibold dark:text-white">{Math.round(totalGeneral * 0.2).toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
            <span className="text-sm font-bold text-brand-700 dark:text-brand-300">Total général</span>
            <span className="font-mono font-bold text-brand-700 dark:text-brand-300 text-lg">{totalGeneral.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      </div>
    </div>
  )
}
