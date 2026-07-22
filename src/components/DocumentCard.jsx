import { getTypeInfo, STATUTS } from '../lib/documentsDb'
import { CreditCard, BookOpen, Home, Car, Building2, Hash, FileText, ScrollText, Award, File } from 'lucide-react'

const ICON_MAP = { CreditCard, BookOpen, Home, Car, Building2, Hash, FileText, ScrollText, Award }

export default function DocumentCard({ doc, onClick }) {
  const typeInfo = getTypeInfo(doc.typeDocument)
  const Icon = typeInfo ? (ICON_MAP[typeInfo.icon] || File) : File
  const statut = STATUTS[doc.statut] || STATUTS.en_attente
  const isImage = doc.fileType?.startsWith('image/')

  return (
    <button onClick={() => onClick?.(doc)}
      className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-600 transition-all text-left w-full">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-900/20">
          {isImage && doc.thumbnailData ? (
            <img src={doc.thumbnailData} alt="" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <Icon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{doc.typeDocumentLabel}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statut.color}`}>{statut.label}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{doc.nomFichier}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
              doc.categorie === 'kyc' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>{doc.categorie.toUpperCase()}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {new Date(doc.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            {doc.fileSize && <span className="text-[10px] text-gray-400">{(doc.fileSize / 1024).toFixed(0)} Ko</span>}
          </div>
        </div>
      </div>
    </button>
  )
}
