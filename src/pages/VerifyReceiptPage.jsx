import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Search, Hash } from 'lucide-react'
import { verifyReceiptIntegrity, getReceiptByNumber } from '../lib/db'

export default function VerifyReceiptPage() {
  const { numero } = useParams()
  const [searchNumero, setSearchNumero] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (numero) {
      setSearchNumero(numero)
      doVerify(numero)
    }
  }, [numero])

  const doVerify = async (num) => {
    if (!num?.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const receipt = getReceiptByNumber(num.trim())
      if (!receipt) {
        setResult({ valid: false, error: 'Reçu introuvable', numero: num.trim() })
        return
      }
      const verification = await verifyReceiptIntegrity(num.trim())
      setResult({ ...verification, receipt })
    } catch (e) {
      setResult({ valid: false, error: 'Erreur de vérification', numero: num.trim() })
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    doVerify(searchNumero)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold dark:text-white">Vérification de Reçu</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vérifiez l'authenticité d'un reçu GESTOCOM CI</p>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700">
          <form onSubmit={handleSearch} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Numéro du reçu</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchNumero}
                  onChange={e => setSearchNumero(e.target.value)}
                  placeholder="Ex: RC20260721-0001"
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-dark-700 dark:text-white font-mono"
                  required
                />
              </div>
              <button type="submit" disabled={loading || !searchNumero.trim()}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Vérifier
              </button>
            </div>
          </form>

          {searched && result && (
            <div className={`rounded-xl p-5 ${result.valid ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-3 mb-3">
                {result.valid ? (
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div>
                  <h3 className={`font-semibold ${result.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {result.valid ? 'Reçu Authentique' : 'Reçu Non Valide'}
                  </h3>
                  <p className={`text-sm ${result.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {result.valid ? 'Ce reçu est vérifié et intègre' : result.error || 'Ce reçu n\'a pas pu être vérifié'}
                  </p>
                </div>
              </div>

              {result.valid && result.receipt && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-green-200/50 dark:border-green-800/50">
                    <span className="text-green-600 dark:text-green-400">Numéro</span>
                    <span className="font-mono font-medium text-green-800 dark:text-green-200">{result.receipt.numero}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-green-200/50 dark:border-green-800/50">
                    <span className="text-green-600 dark:text-green-400">Date</span>
                    <span className="text-green-800 dark:text-green-200">{new Date(result.receipt.date).toLocaleDateString('fr-FR')} {new Date(result.receipt.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-green-200/50 dark:border-green-800/50">
                    <span className="text-green-600 dark:text-green-400">Client</span>
                    <span className="text-green-800 dark:text-green-200">{result.receipt.client || 'Anonyme'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-green-200/50 dark:border-green-800/50">
                    <span className="text-green-600 dark:text-green-400">Articles</span>
                    <span className="text-green-800 dark:text-green-200">{result.receipt.ventes?.length || 0} produit(s)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-green-200/50 dark:border-green-800/50">
                    <span className="text-green-600 dark:text-green-400">Paiement</span>
                    <span className="text-green-800 dark:text-green-200">{result.receipt.modePaiement}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold">
                    <span className="text-green-600 dark:text-green-400">Total</span>
                    <span className="text-green-800 dark:text-green-200">{result.receipt.total?.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  {result.receipt.hash && (
                    <div className="mt-3 p-2.5 bg-green-100/50 dark:bg-green-900/30 rounded-lg">
                      <p className="text-[10px] text-green-500 dark:text-green-400 mb-1">Empreinte SHA-256</p>
                      <p className="text-[10px] font-mono text-green-600 dark:text-green-300 break-all">{result.receipt.hash}</p>
                    </div>
                  )}
                </div>
              )}

              {!result.valid && result.numero && (
                <div className="mt-3 p-3 bg-red-100/50 dark:bg-red-900/30 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Numéro recherché : {result.numero}
                  </p>
                </div>
              )}
            </div>
          )}

          {!searched && (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Entrez un numéro de reçu ou scannez un QR code pour vérifier</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          GESTOCOM CI — Vérification de reçus
        </p>
      </div>
    </div>
  )
}
