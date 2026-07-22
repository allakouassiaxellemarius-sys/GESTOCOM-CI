import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, vendre, getProductByBarcode, getProductsEnAlerte, getVentesSettings } from '../lib/db'
import { normalizePhone } from '../lib/phone'
import { useAuth } from '../context/AuthContext'
import { useSector } from '../context/SectorContext'
import { useDevice } from '../context/DeviceContext'
import { ShoppingCart, Plus, Search, Wine, Package, ScanBarcode, MessageCircle, AlertTriangle } from 'lucide-react'
import { generateReceipt, downloadReceipt } from '../lib/receipt'
import { playStockAlert, playSaleComplete, playNewReceipt, playQuantityExceeded, playDiscountAlert } from '../lib/sounds'
import { detectSalesAnomalies } from '../lib/ai'
import BarcodeScanner from '../components/BarcodeScanner'
import SearchDropdown from '../components/SearchDropdown'
import Chatbot from '../components/Chatbot'
import Panier from '../components/Panier'
import ReceiptPreview from '../components/ReceiptPreview'

const PAIEMENTS = [
  { key: 'especes', label: 'Espèces', icon: '💵' },
  { key: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { key: 'carte', label: 'Carte Bancaire', icon: '💳' },
  { key: 'credit', label: 'Crédit', icon: '📝' },
]

export default function VentesPage() {
  const { user } = useAuth()
  const { isFiltered, sectorProductNames, sectorProductIds } = useSector()
  const { isMobile, isTouch } = useDevice()
  const [allProducts, setAllProducts] = useState(getProducts)
  const products = useMemo(() => {
    if (!isFiltered) return allProducts
    return allProducts.filter(p => sectorProductIds.has(p.id) || sectorProductNames.has(p.nom))
  }, [allProducts, isFiltered, sectorProductNames, sectorProductIds])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [lastReceipt, setLastReceipt] = useState(null)
  const [showChatbot, setShowChatbot] = useState(false)
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)
  const [qtyFlash, setQtyFlash] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)

  const ventesSettings = useMemo(() => getVentesSettings(), [])
  const tvaActive = ventesSettings.tvaActivee
  const tvaRate = ventesSettings.tvaTaux || 18
  const remiseMaxTaux = ventesSettings.remiseMaxTaux || 50

  const stockAlerts = useMemo(() => getProductsEnAlerte(), [products])
  const anomalies = useMemo(() => detectSalesAnomalies(), [])

  useEffect(() => { if (stockAlerts.length > 0) playStockAlert() }, [])

  const [modePaiement, setModePaiement] = useState('especes')
  const [remise, setRemise] = useState(0)
  const [remiseType, setRemiseType] = useState('montant')
  const [clientNom, setClientNom] = useState('')
  const [clientTel, setClientTel] = useState('')
  const [clientFidelite, setClientFidelite] = useState('')
  const [refPaiement, setRefPaiement] = useState('')
  const [montantRecu, setMontantRecu] = useState('')
  const [notes, setNotes] = useState('')

  const refresh = () => setAllProducts(getProducts())

  const handleScan = (code) => {
    const p = getProductByBarcode(code)
    if (p) { addToCart(p); setShowScanner(false) }
    else alert(`Aucun produit trouvé pour le code: ${code}`)
  }

  const filtered = products.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()))
  const bouteilles = filtered.filter(p => p.type === 'bouteille')
  const canettes = filtered.filter(p => p.type === 'canette')

  const addToCart = useCallback((p) => {
    if (p.stockActuel < 1) return
    if (p.stockActuel <= p.seuilAlerte) playStockAlert()
    setCartOpen(true)
    setCart(prev => {
      const existing = prev.find(c => c.produitId === p.id)
      if (existing) {
        if (existing.quantite + 1 > p.stockActuel) { setQtyFlash(p.id); playQuantityExceeded(); setTimeout(() => setQtyFlash(null), 800); return prev }
        return prev.map(c => c.produitId === p.id ? { ...c, quantite: c.quantite + 1 } : c)
      }
      return [...prev, { produitId: p.id, nom: p.nom, type: p.type, prixUnitaire: p.prixUnite, quantite: 1, stockMax: p.stockActuel, remise: 0, remiseType: 'montant' }]
    })
  }, [])

  const updateQty = useCallback((produitId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.produitId !== produitId) return c
      const p = products.find(x => x.id === produitId)
      const newQ = c.quantite + delta
      if (newQ < 1) return null
      if (p && newQ > p.stockActuel) { setQtyFlash(produitId); playQuantityExceeded(); setTimeout(() => setQtyFlash(null), 800); return c }
      return { ...c, quantite: newQ }
    }).filter(Boolean))
  }, [products])

  const setQtyDirect = useCallback((produitId, qty) => {
    const q = parseInt(qty) || 0
    if (q < 1) { removeFromCart(produitId); return }
    const p = products.find(x => x.id === produitId)
    if (p && q > p.stockActuel) { setQtyFlash(produitId); playQuantityExceeded(); setTimeout(() => setQtyFlash(null), 800); return }
    setCart(prev => prev.map(c => c.produitId === produitId ? { ...c, quantite: q } : c))
  }, [products])

  const removeFromCart = useCallback((produitId) => setCart(prev => prev.filter(c => c.produitId !== produitId)), [])

  const updateLineRemise = useCallback((produitId, val) => {
    setCart(prev => prev.map(c => c.produitId === produitId ? { ...c, remise: Math.max(0, val) } : c))
  }, [])

  const updateLineRemiseType = useCallback((produitId, type) => {
    setCart(prev => prev.map(c => c.produitId === produitId ? { ...c, remiseType: type, remise: 0 } : c))
  }, [])

  const getLineTotal = useCallback((item) => {
    const base = item.quantite * item.prixUnitaire
    const discount = item.remiseType === 'pourcentage' ? Math.round(base * item.remise / 100) : item.remise
    return Math.max(0, base - discount)
  }, [])

  const sousTotal = cart.reduce((s, c) => s + c.quantite * c.prixUnitaire, 0)
  const remiseLignes = cart.reduce((s, c) => {
    const base = c.quantite * c.prixUnitaire
    return s + (c.remiseType === 'pourcentage' ? Math.round(base * c.remise / 100) : c.remise)
  }, 0)
  const remiseGlobale = remiseType === 'pourcentage' ? Math.round((sousTotal - remiseLignes) * remise / 100) : remise
  const totalAfterDiscounts = Math.max(0, sousTotal - remiseLignes - remiseGlobale)
  const tvaMontant = tvaActive ? Math.round(totalAfterDiscounts * tvaRate / 100) : 0
  const total = totalAfterDiscounts + tvaMontant
  const monnaie = montantRecu ? Math.max(0, +montantRecu - total) : 0
  const hasExcessDiscount = remiseLignes + remiseGlobale > 0 && ((remiseLignes + remiseGlobale) / Math.max(1, sousTotal) * 100) > remiseMaxTaux

  useEffect(() => { if (hasExcessDiscount) playDiscountAlert() }, [hasExcessDiscount])

  const handleDragStart = (e, p) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: p.id })); e.dataTransfer.effectAllowed = 'copy' }
  const handleCartDrop = (e) => { e.preventDefault(); setDragOverCart(false); try { const data = JSON.parse(e.dataTransfer.getData('application/json')); const p = products.find(x => x.id === data.id); if (p) addToCart(p) } catch {} }
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }
  const [dragOverCart, setDragOverCart] = useState(false)

  const handleVendre = async () => {
    if (cart.length === 0) return
    const result = []
    for (const item of cart) {
      const v = vendre(item.produitId, item.quantite, {
        modePaiement,
        remise: (item.remiseType === 'pourcentage' ? Math.round(item.quantite * item.prixUnitaire * item.remise / 100) : item.remise) + (cart.indexOf(item) === 0 ? remiseGlobale : 0),
        remiseType: 'montant',
        caissier: user?.nom || 'Inconnu',
      })
      if (v) result.push(v)
    }
    if (result.length > 0) {
      const { doc, receipt, numero } = await generateReceipt(result, total, {
        modePaiement: PAIEMENTS.find(p => p.key === modePaiement)?.label || 'Espèces',
        remise: remiseLignes + remiseGlobale,
        remiseType: 'montant',
        caissier: user?.nom || 'Inconnu',
        client: clientNom || null,
        telephone: clientTel ? normalizePhone(clientTel) : null,
        fidélite: clientFidelite || null,
        referencePaiement: refPaiement || null,
        sousTotal,
        tva: tvaMontant,
        notes: notes || null,
      })
      setLastReceipt({ doc, receipt, numero })
      downloadReceipt(doc, numero)
      playSaleComplete()
      setTimeout(() => playNewReceipt(), 500)
    }
    setCart([]); setCartOpen(false); setRemise(0); setModePaiement('especes')
    setClientNom(''); setClientTel(''); setClientFidelite(''); setRefPaiement(''); setMontantRecu(''); setNotes('')
    refresh(); setShowConfirm(true); setTimeout(() => setShowConfirm(false), 3000)
  }

  const ProductCard = ({ p }) => {
    const inCart = cart.find(c => c.produitId === p.id)
    const stockEpuise = p.stockActuel < 1
    const stockLow = p.stockActuel <= p.seuilAlerte && p.stockActuel > 0
    return (
      <button draggable={!stockEpuise} onDragStart={(e) => handleDragStart(e, p)} onClick={() => addToCart(p)} disabled={stockEpuise}
        className={`bg-white dark:bg-dark-800 rounded-xl p-4 border text-left transition-all group relative overflow-hidden cursor-grab active:cursor-grabbing ${
          stockEpuise ? 'border-gray-100 dark:border-dark-700 opacity-40 cursor-not-allowed' : 'border-gray-100 dark:border-dark-700 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-md'
        } ${inCart ? 'ring-2 ring-brand-300 ring-offset-1 dark:ring-offset-dark-800' : ''}`}>
        {p.image && <div className="w-full h-24 rounded-lg overflow-hidden mb-2 -mx-1 -mt-1"><img src={p.image} alt={p.nom} className="w-full h-full object-cover" /></div>}
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-semibold dark:text-gray-200">{p.nom}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${p.type === 'bouteille' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>{p.type}</span>
        </div>
        <div className="text-lg font-bold text-brand-600 dark:text-brand-400">{p.prixUnite.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">FCFA/u</span></div>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs font-medium ${stockEpuise ? 'text-red-500 dark:text-red-400' : stockLow ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {stockEpuise ? 'ÉPUISÉ' : `Stock: ${p.stockActuel.toLocaleString('fr-FR')}`}
          </span>
          {!stockEpuise && <Plus className="w-4 h-4 text-brand-400 dark:text-brand-500 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors" />}
          {inCart && <span className="absolute top-2 right-2 w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{inCart.quantite}</span>}
        </div>
      </button>
    )
  }

  return (
    <div>
      {anomalies.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="text-xs text-orange-700 dark:text-orange-300 font-medium">
            {anomalies.length} anomalie(s) détectée(s) — <Link to="/app/ia" className="underline">Voir le détail</Link>
          </span>
        </div>
      )}

      {showConfirm && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm">
          <div className="w-5 h-5 flex items-center justify-center">✓</div>
          <div>
            <div className="text-sm font-medium">Vente enregistrée</div>
            {lastReceipt && <div className="text-xs opacity-80">Reçu {lastReceipt.numero} généré</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex-1">
              <SearchDropdown
                options={products.filter(p => p.stockActuel > 0).map(p => ({
                  id: p.id, label: p.nom, sub: `${p.prixUnite.toLocaleString('fr-FR')} FCFA · Stock: ${p.stockActuel}`, icon: p.type === 'bouteille' ? '🍾' : '🥫',
                }))}
                value={null}
                onChange={(id) => { const p = products.find(x => x.id === id); if (p) addToCart(p) }}
                placeholder="Ajout rapide — rechercher un produit..."
              />
            </div>
            <button onClick={() => setShowScanner(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors whitespace-nowrap">
              <ScanBarcode className="w-4 h-4" /> Scanner
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input type="text" placeholder="Filtrer la grille..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 bg-white dark:bg-dark-700 dark:text-white" />
          </div>

          {bouteilles.length > 0 && (
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3"><Wine className="w-3.5 h-3.5" /> Bouteilles</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{bouteilles.map(p => <ProductCard key={p.id} p={p} />)}</div>
            </div>
          )}

          {canettes.length > 0 && (
            <div className="mb-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3"><Package className="w-3.5 h-3.5" /> Canettes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{canettes.map(p => <ProductCard key={p.id} p={p} />)}</div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500"><Search className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Aucun produit trouvé</p></div>
          )}
        </div>
      </div>

      <Panier
        open={cartOpen} onClose={() => setCartOpen(false)}
        cart={cart} updateQty={updateQty} setQtyDirect={setQtyDirect} removeFromCart={removeFromCart}
        updateLineRemise={updateLineRemise} updateLineRemiseType={updateLineRemiseType} getLineTotal={getLineTotal}
        remise={remise} setRemise={setRemise} remiseType={remiseType} setRemiseType={setRemiseType}
        modePaiement={modePaiement} setModePaiement={setModePaiement}
        clientNom={clientNom} setClientNom={setClientNom} clientTel={clientTel} setClientTel={setClientTel}
        clientFidelite={clientFidelite} setClientFidelite={setClientFidelite}
        refPaiement={refPaiement} setRefPaiement={setRefPaiement}
        montantRecu={montantRecu} setMontantRecu={setMontantRecu}
        notes={notes} setNotes={setNotes}
        sousTotal={sousTotal} remiseLignes={remiseLignes} remiseGlobale={remiseGlobale}
        totalAfterDiscounts={totalAfterDiscounts} tvaMontant={tvaMontant} total={total} monnaie={monnaie}
        hasExcessDiscount={hasExcessDiscount} tvaActive={tvaActive} tvaRate={tvaRate} remiseMaxTaux={remiseMaxTaux}
        dragOverCart={dragOverCart} onDrop={handleCartDrop} onDragOver={handleDragOver} onDragLeave={() => setDragOverCart(false)}
        qtyFlash={qtyFlash} onPreview={() => setShowReceiptPreview(true)} onValider={handleVendre} user={user}
      />

      {!cartOpen && (
        <button onClick={() => setCartOpen(true)}
          className="fab-safe right-4 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white w-14 h-14 rounded-full shadow-2xl shadow-brand-500/40 transition-all flex items-center justify-center">
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{cart.length}</span>}
        </button>
      )}

      {showReceiptPreview && (
        <ReceiptPreview
          cart={cart} getLineTotal={getLineTotal}
          sousTotal={sousTotal} remiseLignes={remiseLignes} remiseGlobale={remiseGlobale}
          tvaMontant={tvaMontant} total={total} monnaie={monnaie}
          tvaActive={tvaActive} tvaRate={tvaRate}
          modePaiement={modePaiement} clientNom={clientNom} clientTel={clientTel}
          notes={notes} montantRecu={montantRecu}
          onClose={() => setShowReceiptPreview(false)} onValider={handleVendre} user={user}
        />
      )}

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <button onClick={() => setShowChatbot(!showChatbot)}
        className="fab-safe right-20 w-12 h-12 bg-gradient-to-br from-orange-500 to-green-600 text-white rounded-full shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center justify-center" title="Assistant GESTOCOM">
        <MessageCircle className="w-5 h-5" />
      </button>
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  )
}
