import { useState, useMemo } from 'react'
import {
  getLogiciels, searchLogiciels, getAllVersions, getAllLicences, getAllDeploiements, getCategories,
  deleteLogiciel, deleteVersion, deleteLicence, deleteDeploiement, revokeLicence,
  getLogicielsStats, STATUTS_LOGICIEL, STATUTS_LICENCE, STATUTS_DEPLOIEMENT, getCategoryInfo,
  addCategory, updateCategory, deleteCategory,
} from '../lib/logicielsDb'
import LogicielCard from '../components/LogicielCard'
import LogicielFormModal from '../components/LogicielFormModal'
import VersionModal from '../components/VersionModal'
import LicenceModal from '../components/LicenceModal'
import DeploiementModal from '../components/DeploiementModal'
import { Monitor, Tag, Key, HardDrive, FolderOpen, Search, Plus, X, Trash2, Edit, Copy, Ban, CheckCircle, AlertTriangle } from 'lucide-react'

const TABS = [
  { key: 'logiciels', label: 'Logiciels', icon: Monitor },
  { key: 'versions', label: 'Versions', icon: Tag },
  { key: 'licences', label: 'Licences', icon: Key },
  { key: 'deploiements', label: 'Déploiements', icon: HardDrive },
  { key: 'categories', label: 'Catégories', icon: FolderOpen },
]

export default function LogicielsPage() {
  const [tab, setTab] = useState('logiciels')
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editLogiciel, setEditLogiciel] = useState(null)
  const [showVersion, setShowVersion] = useState(false)
  const [editVersion, setEditVersion] = useState(null)
  const [versionLogicielId, setVersionLogicielId] = useState(null)
  const [showLicence, setShowLicence] = useState(false)
  const [editLicence, setEditLicence] = useState(null)
  const [licenceLogicielId, setLicenceLogicielId] = useState(null)
  const [showDeploiement, setShowDeploiement] = useState(false)
  const [depLogicielId, setDepLogicielId] = useState(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')

  const refresh = () => setRefreshKey(k => k + 1)
  const stats = useMemo(() => getLogicielsStats(), [refreshKey])
  const logiciels = useMemo(() => search ? searchLogiciels(search) : getLogiciels(), [search, refreshKey])
  const allVersions = useMemo(() => getAllVersions(), [refreshKey])
  const allLicences = useMemo(() => getAllLicences(), [refreshKey])
  const allDeploiements = useMemo(() => getAllDeploiements(), [refreshKey])
  const categories = useMemo(() => getCategories(), [refreshKey])

  const statCards = [
    { label: 'Logiciels', value: stats.totalLogiciels, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-dark-700' },
    { label: 'Actifs', value: stats.actifs, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Versions', value: stats.totalVersions, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Licences', value: stats.totalLicences, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Actives', value: stats.licencesActives, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Déploiements', value: stats.totalDeploiements, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ]

  const openEditLogiciel = (l) => { setEditLogiciel(l); setShowForm(true) }
  const openAddVersion = (logicielId) => { setEditVersion(null); setVersionLogicielId(logicielId); setShowVersion(true) }
  const openEditVersion = (v) => { setEditVersion(v); setVersionLogicielId(v.logiciel_id); setShowVersion(true) }
  const openAddLicence = (logicielId) => { setEditLicence(null); setLicenceLogicielId(logicielId); setShowLicence(true) }
  const openEditLicence = (l) => { setEditLicence(l); setLicenceLogicielId(l.logiciel_id); setShowLicence(true) }
  const openDeploiement = (logicielId) => { setDepLogicielId(logicielId); setShowDeploiement(true) }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    addCategory({ nom: newCatName.trim(), desc: newCatDesc.trim() })
    setNewCatName(''); setNewCatDesc(''); refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Monitor className="w-6 h-6 text-brand-600" /> Gestion des Logiciels</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gérez vos produits logiciels, versions, licences et déploiements</p>
        </div>
        <button onClick={() => { setEditLogiciel(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-all">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {statCards.map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-gray-400" /></button>}
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-white dark:bg-dark-600 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: LOGICIELS ═══ */}
      {tab === 'logiciels' && (
        logiciels.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-12 text-center">
            <Monitor className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Aucun logiciel</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">Commencez par ajouter votre premier logiciel.</p>
            <button onClick={() => { setEditLogiciel(null); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold"><Plus className="w-4 h-4" /> Ajouter</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {logiciels.map(l => (
              <div key={l.id} className="relative group">
                <LogicielCard logiciel={l} onClick={openEditLogiciel} versions={allVersions} licences={allLicences} />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openAddVersion(l.id) }} className="p-1 bg-white/90 dark:bg-dark-700/90 rounded-lg shadow" title="Ajouter version"><Tag className="w-3 h-3 text-blue-500" /></button>
                  <button onClick={(e) => { e.stopPropagation(); openAddLicence(l.id) }} className="p-1 bg-white/90 dark:bg-dark-700/90 rounded-lg shadow" title="Ajouter licence"><Key className="w-3 h-3 text-purple-500" /></button>
                  <button onClick={(e) => { e.stopPropagation(); openDeploiement(l.id) }} className="p-1 bg-white/90 dark:bg-dark-700/90 rounded-lg shadow" title="Déploiement"><HardDrive className="w-3 h-3 text-amber-500" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteLogiciel(l.id); refresh() }} className="p-1 bg-white/90 dark:bg-dark-700/90 rounded-lg shadow" title="Supprimer"><Trash2 className="w-3 h-3 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ═══ TAB: VERSIONS ═══ */}
      {tab === 'versions' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          {allVersions.length === 0 ? (
            <div className="p-12 text-center"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune version enregistrée.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Logiciel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Version</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Stable</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody>{allVersions.sort((a, b) => new Date(b.date_release) - new Date(a.date_release)).map(v => {
                  const logiciel = logiciels.find(l => l.id === v.logiciel_id)
                  return (
                    <tr key={v.id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{logiciel?.nom || `#${v.logiciel_id}`}</td>
                      <td className="px-4 py-3"><span className="font-mono text-brand-600 dark:text-brand-400">v{v.numero}</span></td>
                      <td className="px-4 py-3 text-gray-500">{new Date(v.date_release).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">{v.est_stable ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-xs text-amber-500">Beta</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditVersion(v)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><Edit className="w-3.5 h-3.5 text-gray-400" /></button>
                          <button onClick={() => { deleteVersion(v.id); refresh() }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: LICENCES ═══ */}
      {tab === 'licences' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          {allLicences.length === 0 ? (
            <div className="p-12 text-center"><Key className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucune licence enregistrée.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Clé</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Logiciel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Expire</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody>{allLicences.map(l => {
                  const logiciel = logiciels.find(lo => lo.id === l.logiciel_id)
                  const statut = STATUTS_LICENCE[l.statut] || STATUTS_LICENCE.active
                  return (
                    <tr key={l.id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{l.cle}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{l.client_nom}</td>
                      <td className="px-4 py-3 text-gray-500">{logiciel?.nom || `#${l.logiciel_id}`}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statut.color}`}>{statut.label}</span></td>
                      <td className="px-4 py-3 text-gray-500">{l.date_expiration ? new Date(l.date_expiration).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {l.statut === 'active' && <button onClick={() => { revokeLicence(l.id); refresh() }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600" title="Révoquer"><Ban className="w-3.5 h-3.5 text-red-400" /></button>}
                          <button onClick={() => openEditLicence(l)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><Edit className="w-3.5 h-3.5 text-gray-400" /></button>
                          <button onClick={() => { deleteLicence(l.id); refresh() }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: DÉPLOIEMENTS ═══ */}
      {tab === 'deploiements' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
          {allDeploiements.length === 0 ? (
            <div className="p-12 text-center"><HardDrive className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun déploiement enregistré.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Logiciel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Machine</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody>{allDeploiements.map(d => {
                  const logiciel = logiciels.find(l => l.id === d.logiciel_id)
                  const statut = STATUTS_DEPLOIEMENT[d.statut] || STATUTS_DEPLOIEMENT.actif
                  return (
                    <tr key={d.id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{logiciel?.nom || `#${d.logiciel_id}`}</td>
                      <td className="px-4 py-3 text-gray-500">{d.machine_info || '—'}{d.ip && <span className="text-xs text-gray-400 ml-1">({d.ip})</span>}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(d.date_installation).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statut.color}`}>{statut.label}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { deleteDeploiement(d.id); refresh() }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: CATÉGORIES ═══ */}
      {tab === 'categories' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ajouter une catégorie</h3>
            <div className="flex gap-2">
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nom de la catégorie"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              <input type="text" value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Description"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              <button onClick={handleAddCategory} disabled={!newCatName.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody>{categories.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.nom}</td>
                    <td className="px-4 py-3 text-gray-500">{c.desc || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { deleteCategory(c.id); refresh() }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <LogicielFormModal isOpen={showForm} logiciel={editLogiciel} onClose={() => { setShowForm(false); setEditLogiciel(null) }} onSaved={refresh} />
      <VersionModal isOpen={showVersion} version={editVersion} logicielId={versionLogicielId} onClose={() => { setShowVersion(false); setEditVersion(null) }} onSaved={refresh} />
      <LicenceModal isOpen={showLicence} licence={editLicence} logicielId={licenceLogicielId} onClose={() => { setShowLicence(false); setEditLicence(null) }} onSaved={refresh} />
      <DeploiementModal isOpen={showDeploiement} logicielId={depLogicielId} licences={allLicences} versions={allVersions} onClose={() => { setShowDeploiement(false); setDepLogicielId(null) }} onSaved={refresh} />
    </div>
  )
}
