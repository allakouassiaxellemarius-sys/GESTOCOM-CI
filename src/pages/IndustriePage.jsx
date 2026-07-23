import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, X, Download, Factory, Package, CheckCircle, DollarSign } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import Pagination from '../components/Pagination'
import { exportCSV } from '../lib/exportCSV'
import { getAll, setAll, nextId } from '../lib/db'

const TABS = [
  { key: 'matieres', label: 'Matières premières', icon: Package },
  { key: 'production', label: 'Production', icon: Factory },
  { key: 'tracabilite', label: 'Traçabilité', icon: CheckCircle },
  { key: 'couts', label: 'Coûts & Marges', icon: DollarSign },
]

const categories = ['Céréale', 'Fruit', 'Légume', 'Épice', 'Boisson', 'Produit laitier', 'Viande', 'Poisson', 'Autre']
const unites = ['kg', 'L', 'unité', 'sac', 'fût', 'caisse']
const statutsProd = [
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'terminée', label: 'Terminée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'annulée', label: 'Annulée', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
]
const statutsLot = [
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'perdu', label: 'Perdu', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'vendu', label: 'Vendu', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
]

const emptyMatiere = { nom: '', categorie: 'Céréale', unite: 'kg', stock: 0, seuilReappro: 10, coutUnitaire: 0, fournisseur: '' }
const emptyProduction = { produitFinier: '', matierePremiereId: '', quantiteProduite: 0, date: new Date().toISOString().slice(0, 10), coutTotal: 0, statut: 'en_cours' }
const emptyLot = { numero: '', produit: '', dateProduction: '', datePeremption: '', statut: 'actif' }

export default function IndustriePage() {
  const [tab, setTab] = useState('matieres')
  const [matieres, setMatieres] = useState(() => getAll('ind_matieres'))
  const [productions, setProductions] = useState(() => getAll('ind_productions'))
  const [lots, setLots] = useState(() => getAll('ind_lots'))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formMat, setFormMat] = useState(null)
  const [formProd, setFormProd] = useState(null)
  const [formLot, setFormLot] = useState(null)
  const perPage = 20

  const refresh = () => {
    setMatieres(getAll('ind_matieres'))
    setProductions(getAll('ind_productions'))
    setLots(getAll('ind_lots'))
  }

  const saveMatieres = (d) => { setAll('ind_matieres', d); refresh() }
  const saveProductions = (d) => { setAll('ind_productions', d); refresh() }
  const saveLots = (d) => { setAll('ind_lots', d); refresh() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Factory className="w-6 h-6 text-brand-500" /> Industrie & Artisanat
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

      {tab === 'matieres' && (
        <MatieresTab matieres={matieres} search={search} setSearch={setSearch} page={page} setPage={setPage} perPage={perPage}
          onAdd={() => setFormMat({ ...emptyMatiere })} onEdit={(m) => setFormMat({ ...m })}
          onDelete={(id) => { if (confirm('Supprimer cette matière première ?')) { saveMatieres(matieres.filter(m => m.id !== id)) } }}
          onExport={() => exportCSV('matieres_premieres', ['ID', 'Nom', 'Catégorie', 'Unité', 'Stock', 'Seuil réappro', 'Coût unitaire', 'Fournisseur'],
            matieres.map(m => [m.id, m.nom, m.categorie, m.unite, m.stock, m.seuilReappro, m.coutUnitaire, m.fournisseur]))}
        />
      )}

      {tab === 'production' && (
        <ProductionTab productions={productions} matieres={matieres} search={search} setSearch={setSearch} page={page} setPage={setPage} perPage={perPage}
          onAdd={() => setFormProd({ ...emptyProduction })} onEdit={(p) => setFormProd({ ...p })}
          onDelete={(id) => { if (confirm('Supprimer cette production ?')) { saveProductions(productions.filter(p => p.id !== id)) } }}
          onExport={() => exportCSV('productions', ['ID', 'Produit fini', 'Matière première', 'Qté produite', 'Date', 'Coût total', 'Statut'],
            productions.map(p => [p.id, p.produitFinier, p.matierePremiereNom || '', p.quantiteProduite, p.date, p.coutTotal, p.statut]))}
        />
      )}

      {tab === 'tracabilite' && (
        <TracabiliteTab lots={lots} search={search} setSearch={setSearch} page={page} setPage={setPage} perPage={perPage}
          onAdd={() => setFormLot({ ...emptyLot })} onEdit={(l) => setFormLot({ ...l })}
          onDelete={(id) => { if (confirm('Supprimer ce lot ?')) { saveLots(lots.filter(l => l.id !== id)) } }}
          onExport={() => exportCSV('tracabilite', ['ID', 'Numéro lot', 'Produit', 'Date production', 'Date péremption', 'Statut'],
            lots.map(l => [l.id, l.numero, l.produit, l.dateProduction, l.datePeremption, l.statut]))}
        />
      )}

      {tab === 'couts' && <CoutsMargesTab productions={productions} matieres={matieres} />}

      {/* Modal Matière première */}
      {formMat && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{formMat.id ? 'Modifier' : 'Ajouter'} une matière première</h3>
              <button onClick={() => setFormMat(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom</label>
                <input value={formMat.nom} onChange={e => setFormMat({ ...formMat, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Catégorie</label>
                <select value={formMat.categorie} onChange={e => setFormMat({ ...formMat, categorie: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Unité</label>
                <select value={formMat.unite} onChange={e => setFormMat({ ...formMat, unite: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  {unites.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stock</label>
                <input type="number" value={formMat.stock} onChange={e => setFormMat({ ...formMat, stock: +e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Seuil réappro.</label>
                <input type="number" value={formMat.seuilReappro} onChange={e => setFormMat({ ...formMat, seuilReappro: +e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Coût unitaire (FCFA)</label>
                <input type="number" value={formMat.coutUnitaire} onChange={e => setFormMat({ ...formMat, coutUnitaire: +e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label>
                <input value={formMat.fournisseur} onChange={e => setFormMat({ ...formMat, fournisseur: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setFormMat(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => {
                if (formMat.id) {
                  const items = matieres.map(m => m.id === formMat.id ? { ...formMat } : m)
                  saveMatieres(items)
                } else {
                  saveMatieres([...matieres, { ...formMat, id: nextId(matieres) }])
                }
                setFormMat(null)
              }} className="btn-primary text-sm py-2 px-4" disabled={!formMat.nom}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Production */}
      {formProd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{formProd.id ? 'Modifier' : 'Ajouter'} une production</h3>
              <button onClick={() => setFormProd(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Produit fini</label>
                <input value={formProd.produitFinier} onChange={e => setFormProd({ ...formProd, produitFinier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Matière première</label>
                <select value={formProd.matierePremiereId} onChange={e => {
                  const m = matieres.find(mp => mp.id === +e.target.value)
                  setFormProd({ ...formProd, matierePremiereId: e.target.value, matierePremiereNom: m?.nom || '' })
                }} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="">Sélectionner</option>
                  {matieres.map(m => <option key={m.id} value={m.id}>{m.nom} ({m.unite})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité produite</label>
                  <input type="number" value={formProd.quantiteProduite} onChange={e => setFormProd({ ...formProd, quantiteProduite: +e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
                  <input type="date" value={formProd.date} onChange={e => setFormProd({ ...formProd, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Coût total (FCFA)</label>
                  <input type="number" value={formProd.coutTotal} onChange={e => setFormProd({ ...formProd, coutTotal: +e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
                  <select value={formProd.statut} onChange={e => setFormProd({ ...formProd, statut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    {statutsProd.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setFormProd(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => {
                if (formProd.id) {
                  saveProductions(productions.map(p => p.id === formProd.id ? { ...formProd } : p))
                } else {
                  saveProductions([...productions, { ...formProd, id: nextId(productions) }])
                }
                setFormProd(null)
              }} className="btn-primary text-sm py-2 px-4" disabled={!formProd.produitFinier}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lot */}
      {formLot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold dark:text-white">{formLot.id ? 'Modifier' : 'Ajouter'} un lot</h3>
              <button onClick={() => setFormLot(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Numéro de lot</label>
                  <input value={formLot.numero} onChange={e => setFormLot({ ...formLot, numero: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Produit</label>
                  <input value={formLot.produit} onChange={e => setFormLot({ ...formLot, produit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date production</label>
                  <input type="date" value={formLot.dateProduction} onChange={e => setFormLot({ ...formLot, dateProduction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date péremption</label>
                  <input type="date" value={formLot.datePeremption} onChange={e => setFormLot({ ...formLot, datePeremption: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Statut</label>
                <select value={formLot.statut} onChange={e => setFormLot({ ...formLot, statut: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  {statutsLot.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setFormLot(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => {
                if (formLot.id) {
                  saveLots(lots.map(l => l.id === formLot.id ? { ...formLot } : l))
                } else {
                  saveLots([...lots, { ...formLot, id: nextId(lots) }])
                }
                setFormLot(null)
              }} className="btn-primary text-sm py-2 px-4" disabled={!formLot.numero || !formLot.produit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MatieresTab({ matieres, search, setSearch, page, setPage, perPage, onAdd, onEdit, onDelete, onExport }) {
  const filtered = useMemo(() => {
    if (!search) return matieres
    const q = search.toLowerCase()
    return matieres.filter(m => m.nom.toLowerCase().includes(q) || m.categorie.toLowerCase().includes(q) || m.fournisseur.toLowerCase().includes(q))
  }, [matieres, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une matière première..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} matière{filtered.length !== 1 ? 's' : ''}</span>
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
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Unité</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Seuil réappro.</th>
                <th className="px-4 py-3 font-medium">Coût unitaire</th>
                <th className="px-4 py-3 font-medium">Fournisseur</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(m => (
                <tr key={m.id} className={`border-b border-gray-50 dark:border-dark-700 ${m.stock <= m.seuilReappro ? 'bg-gold-50 dark:bg-gold-900/20' : ''}`}>
                  <td className="px-4 py-3 font-medium dark:text-gray-200">{m.nom}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{m.categorie}</span></td>
                  <td className="px-4 py-3 dark:text-gray-300">{m.unite}</td>
                  <td className="px-4 py-3">
                    <span className={m.stock <= m.seuilReappro ? 'text-red-600 dark:text-red-400 font-bold' : 'dark:text-gray-300'}>{m.stock}</span>
                  </td>
                  <td className="px-4 py-3 dark:text-gray-300">{m.seuilReappro}</td>
                  <td className="px-4 py-3 dark:text-gray-300">{(m.coutUnitaire || 0).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-4 py-3 dark:text-gray-300">{m.fournisseur}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(m)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(m.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search ? 'Aucune matière première ne correspond à la recherche' : 'Aucune matière première'}</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function ProductionTab({ productions, matieres, search, setSearch, page, setPage, perPage, onAdd, onEdit, onDelete, onExport }) {
  const filtered = useMemo(() => {
    if (!search) return productions
    const q = search.toLowerCase()
    return productions.filter(p => p.produitFinier.toLowerCase().includes(q) || (p.matierePremiereNom || '').toLowerCase().includes(q))
  }, [productions, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const getStatut = (s) => statutsProd.find(st => st.value === s) || statutsProd[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une production..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} production{filtered.length !== 1 ? 's' : ''}</span>
        <div className="ml-auto">
          <button onClick={onAdd} className="btn-primary text-sm py-2"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-4 py-3 font-medium">Produit fini</th>
                <th className="px-4 py-3 font-medium">Matière première</th>
                <th className="px-4 py-3 font-medium">Qté produite</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Coût total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(p => {
                const s = getStatut(p.statut)
                return (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 font-medium dark:text-white">{p.produitFinier}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{p.matierePremiereNom || '—'}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{p.quantiteProduite}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{(p.coutTotal || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onEdit(p)} className="p-1.5 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500 dark:text-brand-400" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search ? 'Aucune production ne correspond à la recherche' : 'Aucune production'}</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function TracabiliteTab({ lots, search, setSearch, page, setPage, perPage, onAdd, onEdit, onDelete, onExport }) {
  const filtered = useMemo(() => {
    if (!search) return lots
    const q = search.toLowerCase()
    return lots.filter(l => l.numero.toLowerCase().includes(q) || l.produit.toLowerCase().includes(q))
  }, [lots, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const getStatut = (s) => statutsLot.find(st => st.value === s) || statutsLot[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un lot..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{filtered.length} lot{filtered.length !== 1 ? 's' : ''}</span>
        <div className="ml-auto">
          <button onClick={onAdd} className="btn-primary text-sm py-2"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-4 py-3 font-medium">Numéro lot</th>
                <th className="px-4 py-3 font-medium">Produit</th>
                <th className="px-4 py-3 font-medium">Date production</th>
                <th className="px-4 py-3 font-medium">Date péremption</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(l => {
                const s = getStatut(l.statut)
                const isExpired = l.datePeremption && new Date(l.datePeremption) < new Date()
                return (
                  <tr key={l.id} className={`border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50 ${isExpired ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-4 py-3 font-medium font-mono text-brand-600 dark:text-brand-400">{l.numero}</td>
                    <td className="px-4 py-3 font-medium dark:text-white">{l.produit}</td>
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{l.dateProduction ? new Date(l.dateProduction).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400 dark:text-gray-500'}>
                        {l.datePeremption ? new Date(l.datePeremption).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </td>
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
        {filtered.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">{search ? 'Aucun lot ne correspond à la recherche' : 'Aucun lot de traçabilité'}</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}

function CoutsMargesTab({ productions, matieres }) {
  const stats = useMemo(() => {
    const completed = productions.filter(p => p.statut === 'terminée')
    const totalCoutMatiere = completed.reduce((s, p) => {
      const m = matieres.find(mp => mp.id === +p.matierePremiereId)
      return s + ((m?.coutUnitaire || 0) * (p.quantiteProduite || 0))
    }, 0)
    const totalCoutProduction = completed.reduce((s, p) => s + (p.coutTotal || 0), 0)
    const totalCoutGlobal = totalCoutMatiere + totalCoutProduction
    return { completedCount: completed.length, totalCount: productions.length, totalCoutMatiere, totalCoutProduction, totalCoutGlobal }
  }, [productions, matieres])

  const totalByStatus = (statut) => productions.filter(p => p.statut === statut).reduce((s, p) => s + (p.coutTotal || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Productions totales</p>
          <p className="text-xl font-bold dark:text-white">{stats.totalCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Terminées</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completedCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coût matières</p>
          <p className="text-xl font-bold text-brand-600 dark:text-brand-400">{stats.totalCoutMatiere.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coût production</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.totalCoutProduction.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-700">
          <h3 className="font-semibold dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-500" /> Détail des coûts par production
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-4 py-3 font-medium">Produit fini</th>
                <th className="px-4 py-3 font-medium">Matière première</th>
                <th className="px-4 py-3 font-medium">Qté</th>
                <th className="px-4 py-3 font-medium">Coût matière</th>
                <th className="px-4 py-3 font-medium">Coût production</th>
                <th className="px-4 py-3 font-medium">Coût total</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {productions.map(p => {
                const m = matieres.find(mp => mp.id === +p.matierePremiereId)
                const coutMatiere = (m?.coutUnitaire || 0) * (p.quantiteProduite || 0)
                const coutTotal = coutMatiere + (p.coutTotal || 0)
                const s = statutsProd.find(st => st.value === p.statut) || statutsProd[0]
                return (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 font-medium dark:text-white">{p.produitFinier}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{m?.nom || '—'}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{p.quantiteProduite}</td>
                    <td className="px-4 py-3 dark:text-gray-300">{coutMatiere.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 dark:text-gray-300">{(p.coutTotal || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 font-semibold text-brand-600 dark:text-brand-400">{coutTotal.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {productions.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucune production enregistrée</p>}
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold dark:text-white mb-4">Résumé par statut</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statutsProd.map(s => (
            <div key={s.value} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
              <span className="font-mono font-semibold dark:text-white">{totalByStatus(s.value).toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
