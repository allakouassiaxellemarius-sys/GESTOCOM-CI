import { useState } from 'react'
import { getTypeInfo, STATUTS, approveDocument, rejectDocument, deleteDocument } from '../lib/documentsDb'
import { X, CheckCircle, XCircle, Download, Trash2, FileText, AlertTriangle, CreditCard, BookOpen, Home, Car, Building2, Hash, ScrollText, Award } from 'lucide-react'

const ICON_MAP = { CreditCard, BookOpen, Home, Car, Building2, Hash, FileText, ScrollText, Award }

export default function DocumentDetailModal({ isOpen, doc, onClose, onUpdated, user }) {
  const [rejectMotif, setRejectMotif] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen || !doc) return null
  const typeInfo = getTypeInfo(doc.typeDocument)
  const Icon = typeInfo ? (ICON_MAP[typeInfo.icon] || FileText) : FileText
  const statut = STATUTS[doc.statut] || STATUTS.en_attente
  const isImage = doc.fileType?.startsWith('image/')
  const isAdmin = user?.role === 'admin'

  const handleApprove = () => { setLoading(true); approveDocument(doc.id); setLoading(false); onUpdated?.(); onClose() }
  const handleReject = () => { if (!rejectMotif.trim()) return; setLoading(true); rejectDocument(doc.id, rejectMotif.trim()); setLoading(false); setShowReject(false); setRejectMotif(''); onUpdated?.(); onClose() }
  const handleDelete = () => { setLoading(true); deleteDocument(doc.id); setLoading(false); setShowDeleteConfirm(false); onUpdated?.(); onClose() }
  const handleDownload = () => {
    const a = document.createElement('a'); a.href = doc.fileData; a.download = doc.nomFichier; document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70" onClick={onClose}>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold dark:text-white">{doc.typeDocumentLabel}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statut.color}`}>{statut.label}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              doc.categorie === 'kyc' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>{doc.categorie.toUpperCase()}</span>
          </div>

          <div className="bg-gray-50 dark:bg-dark-700 rounded-xl overflow-hidden">
            {isImage ? (
              <img src={doc.fileData} alt={doc.typeDocumentLabel} className="w-full max-h-64 object-contain" />
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-red-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{doc.nomFichier}</p>
                <p className="text-xs text-gray-400 mt-1">{(doc.fileSize / 1024).toFixed(0)} Ko</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Fichier :</span> <span className="text-gray-700 dark:text-gray-300 font-medium">{doc.nomFichier}</span></div>
            <div><span className="text-gray-400">Taille :</span> <span className="text-gray-700 dark:text-gray-300">{(doc.fileSize / 1024).toFixed(0)} Ko</span></div>
            <div><span className="text-gray-400">Ajouté le :</span> <span className="text-gray-700 dark:text-gray-300">{new Date(doc.dateCreation).toLocaleDateString('fr-FR')}</span></div>
            {doc.dateTraitement && <div><span className="text-gray-400">Traité le :</span> <span className="text-gray-700 dark:text-gray-300">{new Date(doc.dateTraitement).toLocaleDateString('fr-FR')}</span></div>}
          </div>

          {doc.notes && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Notes</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">{doc.notes}</p>
            </div>
          )}

          {doc.rejetMotif && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Motif du rejet</p>
              <p className="text-sm text-red-800 dark:text-red-300">{doc.rejetMotif}</p>
            </div>
          )}

          {showReject && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-2">
              <label className="text-sm font-medium text-red-700 dark:text-red-400">Motif du rejet *</label>
              <textarea value={rejectMotif} onChange={e => setRejectMotif(e.target.value)} rows={2} placeholder="Expliquez la raison du rejet..."
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-dark-700 dark:text-white resize-none" autoFocus />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowReject(false); setRejectMotif('') }} className="flex-1 py-1.5 border border-gray-300 rounded-lg text-sm">Annuler</button>
                <button type="button" onClick={handleReject} disabled={!rejectMotif.trim() || loading}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">Confirmer le rejet</button>
              </div>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Supprimer ce document ?</p>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400">Cette action est irréversible.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 border border-gray-300 rounded-lg text-sm">Annuler</button>
                <button type="button" onClick={handleDelete} disabled={loading}
                  className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">Supprimer</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
              <Download className="w-4 h-4" /> Télécharger
            </button>
            {isAdmin && doc.statut === 'en_attente' && (
              <>
                <button type="button" onClick={handleApprove} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Approuver
                </button>
                <button type="button" onClick={() => setShowReject(true)} disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
              </>
            )}
            {isAdmin && !showDeleteConfirm && (
              <button type="button" onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-90/20 ml-auto">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
