import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Plus, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Package, BarChart3, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import { getInventaires, demarrerInventaire, compterInventaire, terminerInventaire } from '../lib/stockDb'
import { useAuth } from '../context/AuthContext'

export default function StockInventairePage() {
  const { user } = useAuth()
  const [inventaires, setInventaires] = useState([])
  const [activeInv, setActiveInv] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newNom, setNewNom] = useState('')
  const [newSecteur, setNewSecteur] = useState('')
  const [filter, setFilter] = useState('all')
  const [compterProduit, setCompterProduit] = useState(null)
  const [compterQte, setCompterQte] = useState('')
  const [compterComment, setCompterComment] = useState('')

  useEffect(() => { refresh() }, [])

  const refresh = () => {
    const invs = getInventaires()
    setInventaires(invs)
    if (activeInv) {
      const updated = invs.find(i => i.id === activeInv.id)
      if (updated) setActiveInv(updated)
    }
  }

  const handleCreate = () => {
    if (!newNom.trim()) return
    const inv = demarrerInventaire(newNom.trim(), newSecteur || null, user?.nom || '')
    setInventaires(getInventaires())
    setActiveInv(inv)
    setShowNew(false)
    setNewNom('')
    setNewSecteur('')
  }

  const handleCount = (produit) => {
    setCompterProduit(produit)
    setCompterQte(produit.stockComte !== null ? String(produit.stockComte) : '')
    setCompterComment(produit.commentaire || '')
  }

  const handleSaveCount = () => {
    if (!compterProduit || compterQte === '') return
    compterInventaire(activeInv.id, compterProduit.produitId, parseInt(compterQte, 10), compterComment)
    refresh()
    setCompterProduit(null)
    setCompterQte('')
    setCompterComment('')
  }

  const handleFinish = (appliquer) => {
    terminerInventaire(activeInv.id, appliquer, user?.nom || '')
    refresh()
    setActiveInv(null)
  }

  const filtered = inventaires.filter(i => filter === 'all' || i.statut === filter)

  const statColors = { en_cours: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', termine: 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400' }

  if (activeInv) {
    const total = activeInv.lignes.length
    const comptes = activeInv.lignes.filter(l => l.stockCompte !== null).length
    const ecarts = activeInv.lignes.filter(l => l.ecart !== null && l.ecart !== 0).length
    const progress = total > 0 ? (comptes / total * 100) : 0

    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <button onClick={() => setActiveInv(null)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour à la liste
        </button>

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4 md:p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold dark:text-white">{activeInv.nom}</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">Créé par {activeInv.creePar || 'N/A'} — {new Date(activeInv.dateDebut).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="flex gap-2">
              {activeInv.statut === 'en_cours' && (
                <>
                  <button onClick={() => handleFinish(true)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Appliquer ajustements
                  </button>
                  <button onClick={() => handleFinish(false)} className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition">
                    Terminer sans ajuster
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{total}</p>
              <p className="text-[10px] text-blue-500 dark:text-blue-400">Produits</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{comptes}/{total}</p>
              <p className="text-[10px] text-amber-500 dark:text-amber-400">Comptés</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${ecarts > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <p className={`text-xl font-bold ${ecarts > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{ecarts}</p>
              <p className={`text-[10px] ${ecarts > 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>Écarts</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 mb-4">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {compterProduit && (
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-blue-300 dark:border-blue-700 p-4 mb-4 shadow-lg">
            <h3 className="text-sm font-semibold dark:text-white mb-3">Comptage — {compterProduit.produitNom}</h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Stock système : <strong>{compterProduit.stockSysteme}</strong></div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité comptée</label>
                <input type="number" value={compterQte} onChange={e => setCompterQte(e.target.value)} min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" autoFocus />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Commentaire</label>
                <input type="text" value={compterComment} onChange={e => setCompterComment(e.target.value)} placeholder="Optionnel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              </div>
            </div>
            {compterQte !== '' && (
              <div className={`mt-2 text-xs font-medium flex items-center gap-1 ${parseInt(compterQte) !== compterProduit.stockSysteme ? 'text-red-500' : 'text-green-500'}`}>
                {parseInt(compterQte) !== compterProduit.stockSysteme ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                Écart : {parseInt(compterQte) - compterProduit.stockSysteme}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={handleSaveCount} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition">Enregistrer</button>
              <button onClick={() => setCompterProduit(null)} className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition">Annuler</button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Produit</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Stock Système</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Compté</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Écart</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeInv.lignes.map((l, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium dark:text-white">{l.produitNom}</div>
                      {l.reference && <div className="text-[10px] text-gray-400">{l.reference}</div>}
                    </td>
                    <td className="px-4 py-3 text-center text-sm dark:text-gray-300">{l.stockSysteme}</td>
                    <td className="px-4 py-3 text-center">
                      {l.stockComte !== null ? (
                        <span className="text-sm font-medium dark:text-white">{l.stockComte}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {l.ecart !== null ? (
                        <span className={`text-xs font-medium flex items-center justify-center gap-1 ${l.ecart === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {l.ecart === 0 ? <CheckCircle className="w-3 h-3" /> : l.ecart > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {l.ecart > 0 ? '+' : ''}{l.ecart}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {activeInv.statut === 'en_cours' && (
                        <button onClick={() => handleCount(l)} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">
                          Compter
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-500" /> Inventaires de Stock
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Vérification physique des stocks</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-dark-700 rounded-lg p-0.5">
            {['all', 'en_cours', 'termine'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filter === f ? 'bg-white dark:bg-dark-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {f === 'all' ? 'Tous' : f === 'en_cours' ? 'En cours' : 'Terminés'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNew(true)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Nouvel inventaire
          </button>
        </div>
      </div>

      {showNew && (
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-4 shadow-lg">
          <h3 className="text-sm font-semibold dark:text-white mb-3">Nouvel inventaire</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={newNom} onChange={e => setNewNom(e.target.value)} placeholder="Nom de l'inventaire"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" autoFocus />
            <select value={newSecteur} onChange={e => setNewSecteur(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">Tous les secteurs</option>
              <option value="detail">Détail</option>
              <option value="alimentaire">Alimentaire</option>
              <option value="industriel">Industriel</option>
              <option value="pharmaceutique">Pharmaceutique</option>
              <option value="mode">Mode</option>
              <option value="high_tech">High-tech</option>
              <option value="logistique">Logistique</option>
              <option value="educatif">Éducatif</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} disabled={!newNom.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50">Créer</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition">Annuler</button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun inventaire trouvé</p>
          <p className="text-xs mt-1">Créez un inventaire pour vérifier vos stocks physiques</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inv => (
            <div key={inv.id} onClick={() => setActiveInv(inv)}
              className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold dark:text-white">{inv.nom}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statColors[inv.statut] || statColors.termine}`}>
                  {inv.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <span>{inv.resume.totalProduits} produits</span>
                <span>{inv.resume.comptes}/{inv.resume.totalProduits} comptés</span>
                {inv.resume.ecarts > 0 && <span className="text-red-500">{inv.resume.ecarts} écart(s)</span>}
                <span>{new Date(inv.dateDebut).toLocaleDateString('fr-FR')}</span>
              </div>
              {inv.statut === 'en_cours' && (
                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${inv.resume.totalProduits > 0 ? (inv.resume.comptes / inv.resume.totalProduits * 100) : 0}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
