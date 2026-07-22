import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw, Download, Upload, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'
import { pullFromFirestore, restoreDataFromCloud } from '../lib/firebaseSync'

export default function SyncPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const handlePull = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setMsg('')
    try {
      const data = await pullFromFirestore(email)
      if (!data) {
        setMsg('Aucune donnée trouvée pour cet email. Connectez-vous d\'abord sur l\'autre appareil et activez la synchronisation cloud.')
        setLoading(false)
        return
      }
      const result = restoreDataFromCloud(data)
      setSuccess(true)
      setMsg(`✅ Données restaurées : ${result.productCount} produit(s), ${result.venteCount} vente(s)`)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setMsg('❌ ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-900 dark:to-dark-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold dark:text-white">Restaurer depuis le cloud</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Connectez-vous pour récupérer vos données depuis un autre appareil
            </p>
          </div>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold dark:text-white">Données restaurées !</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Redirection vers la connexion...</p>
            </div>
          ) : (
            <form onSubmit={handlePull}>
              {msg && (
                <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${msg.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300'}`}>
                  {msg}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                  required
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || !email || !password}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Récupération...' : 'Récupérer les données'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Pas encore synchronisé ? Utilisez un fichier de sauvegarde.
            </p>
            <Link to="/inscription" className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
