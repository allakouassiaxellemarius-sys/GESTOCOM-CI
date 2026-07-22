import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments, searchDocuments, getDocumentsStats } from '../lib/documentsDb'
import DocumentCard from '../components/DocumentCard'
import DocumentUploadModal from '../components/DocumentUploadModal'
import DocumentDetailModal from '../components/DocumentDetailModal'
import { Search, Plus, ShieldCheck, Filter, FileText, Clock, CheckCircle, XCircle, X } from 'lucide-react'

const TABS = [
  { key: 'all', label: 'Tous', icon: FileText },
  { key: 'kyc', label: 'KYC', icon: ShieldCheck },
  { key: 'kyb', label: 'KYB', icon: ShieldCheck },
  { key: 'en_attente', label: 'En attente', icon: Clock },
]

export default function DocumentsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey(k => k + 1)
  const stats = useMemo(() => getDocumentsStats(), [refreshKey])
  const documents = useMemo(() => {
    let docs = search ? searchDocuments(search) : getDocuments()
    if (tab === 'kyc') docs = docs.filter(d => d.categorie === 'kyc')
    else if (tab === 'kyb') docs = docs.filter(d => d.categorie === 'kyb')
    else if (tab === 'en_attente') docs = docs.filter(d => d.statut === 'en_attente')
    if (filterStatut !== 'all') docs = docs.filter(d => d.statut === filterStatut)
    return docs.sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
  }, [tab, search, filterStatut, refreshKey])

  const statCards = [
    { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-100 dark:bg-dark-700' },
    { label: 'KYC', value: stats.kyc, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'KYB', value: stats.kyb, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'En attente', value: stats.en_attente, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Approuvés', value: stats.approuve, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Rejetés', value: stats.rejete, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-600" /> Documents KYC/KYB
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gérez vos documents d'identification et d'entreprise</p>
        </div>
        <button onClick={() => setShowUpload(true)}
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

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un document..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-gray-400" /></button>}
        </div>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
          <option value="all">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="approuve">Approuvé</option>
          <option value="rejete">Rejeté</option>
        </select>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white dark:bg-dark-600 text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
            {t.key === 'en_attente' && stats.en_attente > 0 && (
              <span className="ml-1 w-5 h-5 bg-amber-500 text-white text-[10px] rounded-full flex items-center justify-center">{stats.en_attente}</span>
            )}
          </button>
        ))}
      </div>

      {documents.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Aucun document</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
            {search ? 'Aucun résultat pour votre recherche.' : 'Commencez par ajouter un document KYC ou KYB.'}
          </p>
          {!search && (
            <button onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" /> Ajouter un document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map(doc => (
            <DocumentCard key={doc.id} doc={doc} onClick={setSelectedDoc} />
          ))}
        </div>
      )}

      <DocumentUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onUploaded={refresh} />
      <DocumentDetailModal isOpen={!!selectedDoc} doc={selectedDoc} onClose={() => setSelectedDoc(null)} onUpdated={refresh} user={user} />
    </div>
  )
}
