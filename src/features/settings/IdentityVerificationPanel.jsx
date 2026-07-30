import { useState } from 'react'
import { getIdentityVerification, getVerificationStatus, submitIdentityVerification } from '../../lib/verification'
import { ShieldCheck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export default function IdentityVerificationPanel({ user, addLog }) {
  const [showSubmit, setShowSubmit] = useState(false)
  const [nomComplet, setNomComplet] = useState('')
  const [numeroPiece, setNumeroPiece] = useState('')
  const [typePiece, setTypePiece] = useState('cni')
  const [msg, setMsg] = useState('')

  const identity = getIdentityVerification(user?.id)
  const status = getVerificationStatus(user?.id)

  const handleSubmit = () => {
    if (!nomComplet.trim() || !numeroPiece.trim()) { setMsg('Tous les champs sont requis'); return }
    submitIdentityVerification(user.id, { nomComplet, numeroPiece, typePiece })
    addLog('Demande vérification identité soumise', `${typePiece}: ${numeroPiece}`, user.id, user.nom)
    setMsg('Demande soumise ! En attente de validation.')
    setShowSubmit(false); setNomComplet(''); setNumeroPiece('')
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
      <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
        <ShieldCheck className="w-5 h-5 text-purple-500" /> Vérification d'identité
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Vérifiez votre identité pour obtenir un badge de confiance sur votre profil.
      </p>

      {status.identity ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <CheckCircle className="w-4 h-4" /> Identité vérifiée
        </div>
      ) : identity ? (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            identity.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
            identity.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
            'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
          }`}>
            {identity.status === 'pending' ? <AlertTriangle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {identity.status === 'pending' ? 'En attente de validation' :
             identity.status === 'rejected' ? `Rejeté : ${identity.rejectionReason || 'Non précisé'}` :
             'Statut inconnu'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Type : {identity.typePiece === 'cni' ? 'CNI' : identity.typePiece === 'passeport' ? 'Passeport' : 'Autre'}</p>
            <p>N° : {identity.numeroPiece}</p>
            <p>Soumis le : {new Date(identity.submittedAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      ) : showSubmit ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
            <input type="text" value={nomComplet} onChange={e => setNomComplet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type de pièce</label>
            <select value={typePiece} onChange={e => setTypePiece(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="cni">Carte Nationale d'Identité</option>
              <option value="passeport">Passeport</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro de la pièce</label>
            <input type="text" value={numeroPiece} onChange={e => setNumeroPiece(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition">Soumettre</button>
            <button onClick={() => setShowSubmit(false)} className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowSubmit(true)} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Soumettre une vérification d'identité
        </button>
      )}

      {msg && <p className={`text-xs mt-2 ${msg.includes('soumise') || msg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  )
}
