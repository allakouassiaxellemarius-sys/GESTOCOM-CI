import { useState, useRef } from 'react'
import { KYC_TYPES, KYB_TYPES, addDocument } from '../lib/documentsDb'
import { X, Upload, Camera, FileText, AlertTriangle } from 'lucide-react'

const MAX_SIZE = 10 * 1024 * 1024

function createThumbnail(base64, maxWidth = 200) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = maxWidth / img.width
      canvas.width = maxWidth
      canvas.height = img.height * ratio
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.6))
    }
    img.onerror = () => resolve(null)
    img.src = base64
  })
}

export default function DocumentUploadModal({ isOpen, onClose, onUploaded }) {
  const [categorie, setCategorie] = useState('kyc')
  const [typeDocument, setTypeDocument] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef(null)

  const types = categorie === 'kyc' ? KYC_TYPES : KYB_TYPES
  const selectedType = types.find(t => t.key === typeDocument)

  const reset = () => { setCategorie('kyc'); setTypeDocument(''); setFile(null); setPreview(null); setNotes(''); setError('') }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setError('')
    if (f.size > MAX_SIZE) { setError(`Fichier trop volumineux (${(f.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 10 Mo.`); return }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type)) {
      setError('Format non supporté. Utilisez JPG, PNG ou PDF.'); return
    }
    const reader = new FileReader()
    reader.onload = () => { setPreview(reader.result); setFile(f) }
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!typeDocument) { setError('Sélectionnez un type de document.'); return }
    if (!file) { setError('Sélectionnez un fichier.'); return }
    setLoading(true); setError('')
    try {
      const thumbnailData = file.type.startsWith('image/') ? await createThumbnail(preview) : null
      addDocument({ categorie, typeDocument, nomFichier: file.name, fileData: preview, thumbnailData, fileType: file.type, fileSize: file.size, notes })
      reset(); onUploaded?.(); onClose()
    } catch { setError('Erreur lors de l\'enregistrement.') }
    finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70" onClick={onClose}>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold dark:text-white">Ajouter un document</h2>
          </div>
          <button onClick={() => { reset(); onClose() }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Catégorie *</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ val: 'kyc', label: 'KYC', desc: 'Know Your Customer' }, { val: 'kyb', label: 'KYB', desc: 'Know Your Business' }].map(c => (
                <button key={c.val} type="button" onClick={() => { setCategorie(c.val); setTypeDocument(''); setFile(null); setPreview(null) }}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    categorie === c.val ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                  }`}>
                  <div className={`text-sm font-semibold ${categorie === c.val ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>{c.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type de document *</label>
            <div className="grid grid-cols-1 gap-1.5">
              {types.map(t => (
                <button key={t.key} type="button" onClick={() => { setTypeDocument(t.key); setFile(null); setPreview(null) }}
                  className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    typeDocument === t.key ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                  }`}>
                  <div className={`text-sm font-medium ${typeDocument === t.key ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>{t.label}</div>
                  <div className="text-[10px] text-gray-400">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {typeDocument && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fichier *</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFile} className="hidden" />
              {!preview ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl p-6 text-center hover:border-brand-400 transition-all cursor-pointer"
                  onClick={() => fileRef.current?.click()}>
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500">Cliquez pour sélectionner ou glissez un fichier</p>
                    <p className="text-xs text-gray-400">JPG, PNG, PDF — Max 10 Mo</p>
                  </div>
                </div>
              ) : (
                <div className="relative border border-gray-200 dark:border-dark-600 rounded-xl overflow-hidden">
                  {file?.type === 'application/pdf' ? (
                    <div className="p-6 text-center bg-gray-50 dark:bg-dark-700">
                      <FileText className="w-10 h-10 text-red-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} Ko</p>
                    </div>
                  ) : (
                    <img src={preview} alt="Aperçu" className="w-full max-h-48 object-contain bg-gray-50 dark:bg-dark-700" />
                  )}
                  <button type="button" onClick={() => { setFile(null); setPreview(null) }}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-2 bg-gray-50 dark:bg-dark-700 text-xs text-gray-500">
                    {file?.name} — {(file?.size / 1024).toFixed(0)} Ko
                  </div>
                </div>
              )}
              <div className="mt-2">
                <button type="button" onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.capture = 'environment'; i.onchange = handleFile; i.click() }}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  <Camera className="w-4 h-4" /> Prendre une photo
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optionnel)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Informations complémentaires..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => { reset(); onClose() }}
              className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">
              Annuler
            </button>
            <button type="button" onClick={handleUpload} disabled={loading || !typeDocument || !file}
              className="flex-1 py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement...</> : <><Upload className="w-4 h-4" /> Enregistrer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
