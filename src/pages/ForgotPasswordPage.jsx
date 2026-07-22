import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, CheckCircle, MessageCircle, Shield } from 'lucide-react'
import { getUsers, resetAdminPassword, isDefaultAdmin } from '../lib/db'

export default function ForgotPasswordPage() {
  const [nom, setNom] = useState('')
  const [step, setStep] = useState('ask') // ask | result
  const [resetDone, setResetDone] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLookup = (e) => {
    e.preventDefault()
    setError('')
    const users = getUsers()
    const user = users.find(u => u.nom === nom.trim())
    if (!user) {
      setError('Aucun compte trouvé avec ce nom.')
      return
    }
    setStep('result')
  }

  const handleResetAdmin = async () => {
    const ok = await resetAdminPassword()
    if (ok) {
      setResetDone(true)
    } else {
      setError('Impossible de réinitialiser. Contactez le support.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30 overflow-hidden">
            <div className="flex items-end gap-1 h-7">
              <div className="w-2 h-3 bg-green-300 rounded-sm"></div>
              <div className="w-2 h-5 bg-orange-300 rounded-sm"></div>
              <div className="w-2 h-7 bg-green-300 rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold dark:text-white">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Récupérez l'accès à votre compte</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700">
          {step === 'ask' ? (
            <form onSubmit={handleLookup}>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm px-4 py-3 rounded-lg mb-4">
                Vos données sont stockées localement sur cet appareil. Aucun serveur externe n'est contacté.
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur</label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Entrez votre nom d'utilisateur"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                  required
                />
              </div>

              <button type="submit" className="w-full btn-primary py-3">
                Rechercher le compte
              </button>
            </form>
          ) : resetDone ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold dark:text-white mb-2">Mot de passe réinitialisé</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter avec les identifiants par défaut.
              </p>
              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-6 text-left">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Identifiants par défaut :</p>
                <p className="text-sm font-mono dark:text-white">Nom : <strong>Admin</strong></p>
                <p className="text-sm font-mono dark:text-white">Mot de passe : <strong>Admin123!</strong></p>
              </div>
              <button onClick={() => navigate('/login')} className="w-full btn-primary py-3">
                Se connecter
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Seul le compte administrateur peut être réinitialisé</p>
                  <p>Pour les autres comptes, contactez le support WhatsApp.</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>
              )}

              <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Compte trouvé :</p>
                <p className="text-lg font-semibold dark:text-white">{nom}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Rôle : {isDefaultAdmin({ isDefault: true, nom }) ? 'Administrateur' : 'Utilisateur'}</p>
              </div>

              {isDefaultAdmin({ isDefault: true, nom }) ? (
                <button onClick={handleResetAdmin} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-all mb-3 flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Réinitialiser le mot de passe admin
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Ce compte n'est pas un administrateur. Contactez le support :
                  </p>
                  <a
                    href="https://wa.me/2250707070707?text=Bonjour,%20j%27ai%20oubli%C3%A9%20mon%20mot%20de%20passe%20GESTOCOM%20CI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Contacter le support WhatsApp
                  </a>
                </div>
              )}

              <button onClick={() => { setStep('ask'); setError(''); setNom('') }}
                className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2">
                Autre utilisateur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
