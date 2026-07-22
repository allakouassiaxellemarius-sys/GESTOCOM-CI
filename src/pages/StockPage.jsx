import { useState, useRef, useMemo, useEffect } from 'react'
import {
  getProductsV2, addProductV2, updateProductV2, deleteProductV2,
  searchProductsV2, duplicateProductV2,
  entreeStock, sortieStock, ajusterStock, transfertStock,
  getAlertesStock, getStatsStock, getMouvements,
  getRapportBestSellers, getRapportInvendus, getRapportMarges, getRapportSaisonnier, getRapportConsommationPharma,
  SECTEURS_COMMERCE, UNITES, CATEGORIES_SECTOR, SECTOR_FIELDS, CATEGORY_FIELDS,
  getEntrepots, addEntrepot, deleteEntrepot,
  getLots, addLot, getLotsPerimes, getLotsProchesPeremption,
  getRetoursConsignes, addRetourConsigne, updateRetourConsigne, getStatsRetoursConsignes,
  migrateFromV1,
} from '../lib/stockDb'
import { addLog } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { useDevice } from '../context/DeviceContext'
import {
  Plus, Edit2, Trash2, RefreshCw, X, Printer, Upload, Filter, Download,
  Search, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle,
  MinusCircle, ArrowRightCircle, Warehouse, BarChart3, TrendingUp, TrendingDown,
  ShoppingCart, RotateCcw, Tag, Calendar, Layers, ClipboardList, CircleDot, Check,
  Undo2, Palette, Ruler, Shield, Clock, BookOpen, FileText, Star, AlertCircle,
  Zap, ChevronRight, Eye, Hash, Truck, MapPin, ScanBarcode, Copy, Sparkles,
} from 'lucide-react'
import { BarcodeValue, BarcodeLabel, BarcodeSheet } from '../components/BarcodeLabel'
import BarcodeScanner from '../components/BarcodeScanner'
import SearchInput from '../components/SearchInput'
import SortableHeader, { useSort } from '../components/SortableHeader'
import { exportCSV } from '../lib/exportCSV'
import Pagination from '../components/Pagination'

const TABS = [
  { key: 'produits', label: 'Produits', icon: Package },
  { key: 'mouvements', label: 'Mouvements', icon: RefreshCw },
  { key: 'lots', label: 'Lots & Péremption', icon: Calendar },
  { key: 'retours', label: 'Retours Consignés', icon: RotateCcw },
  { key: 'alertes', label: 'Alertes', icon: AlertTriangle },
  { key: 'entrepots', label: 'Entrepôts', icon: Warehouse },
  { key: 'rapports', label: 'Rapports', icon: BarChart3 },
]

function StatCard({ icon: Icon, label, value, color = 'brand', sub, onClick }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  }
  return (
    <div onClick={onClick} className={`bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-2 sm:p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 rounded-lg ${colors[color]}`}><Icon className="w-4 h-4 sm:w-5 sm:h-5" /></div>
        <div className="min-w-0">
          <p className="text-sm sm:text-xl font-bold dark:text-white leading-tight">{value}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function ImageUpload({ value, onChange }) {
  const inputRef = useRef(null)
  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Image trop lourde (max 2 Mo)'); return }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }
  return (
    <div>
      {value ? (
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-600">
          <img src={value} alt="Produit" className="w-full h-full object-cover" />
          <button onClick={() => onChange('')} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"><X className="w-3 h-3" /></button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} type="button" className="w-full h-28 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
          <Upload className="w-5 h-5" /><span className="text-xs">Image</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}

function SectorSpecificFields({ form, setForm, secteur }) {
  const fields = SECTOR_FIELDS[secteur] || []
  if (fields.length === 0) return null
  return (
    <div className="col-span-2 mt-2 pt-3 border-t border-gray-100 dark:border-dark-600">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
        Champs spécifiques — {SECTEURS_COMMERCE.find(s => s.id === secteur)?.icon} {SECTEURS_COMMERCE.find(s => s.id === secteur)?.nom}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => {
          const val = form.specifications?.[f.key] ?? f.default
          if (f.type === 'checkbox') {
            return (
              <label key={f.key} className="col-span-2 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!val} onChange={e => setForm({ ...form, specifications: { ...form.specifications, [f.key]: e.target.checked } })}
                  className="rounded border-gray-300 dark:border-dark-600 text-brand-500" />
                <span className="text-sm dark:text-gray-300">{f.label}</span>
              </label>
            )
          }
          if (f.type === 'select') {
            return (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                <select value={val} onChange={e => setForm({ ...form, specifications: { ...form.specifications, [f.key]: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="">--</option>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )
          }
          return (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
              <input type={f.type} value={val} placeholder={f.placeholder || ''}
                onChange={e => setForm({ ...form, specifications: { ...form.specifications, [f.key]: f.type === 'number' ? +e.target.value : e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CATEGORY_ICONS = {
  Alimentaire: '🍽️', Boisson: '🍷', Hygiène: '🧼', Entretien: '🧹', Électronique: '📱', Vêtement: '👕', Autre: '📦',
}

function CategorySpecificFields({ form, setForm, categorie }) {
  if (!categorie || categorie === 'Autre') return null
  const fields = CATEGORY_FIELDS[categorie] || []
  if (fields.length === 0) return null
  return (
    <div className="col-span-2 mt-2 pt-3 border-t border-gray-200 dark:border-dark-500">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wider">
        {CATEGORY_ICONS[categorie] || '📦'} Champs spécifiques — {categorie}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(f => {
          const val = form.specifications?.[f.key] ?? f.default
          if (f.type === 'checkbox') {
            return (
              <label key={f.key} className="col-span-2 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!val} onChange={e => setForm({ ...form, specifications: { ...form.specifications, [f.key]: e.target.checked } })}
                  className="rounded border-gray-300 dark:border-dark-600 text-brand-500" />
                <span className="text-sm dark:text-gray-300">{f.label}</span>
              </label>
            )
          }
          if (f.type === 'select') {
            return (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                <select value={val} onChange={e => setForm({ ...form, specifications: { ...form.specifications, [f.key]: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="">--</option>
                  {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )
          }
          return (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
              <input type={f.type} value={val} placeholder={f.placeholder || ''}
                onChange={e => setForm({ ...form, specifications: { ...form.specifications, [f.key]: f.type === 'number' ? +e.target.value : e.target.value } })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProductForm({ form, setForm, onSave, onCancel }) {
  const secteur = form.secteur || 'detail'
  const categories = CATEGORIES_SECTOR[secteur] || []
  const unites = UNITES[secteur] || ['pièce']
  const [showScanner, setShowScanner] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Auto name suggestions
  useEffect(() => {
    if (form.nom && form.nom.length >= 2 && !form.id) {
      const results = searchProductsV2(form.nom)
      setNameSuggestions(results.filter(p => p.nom.toLowerCase() !== form.nom.toLowerCase()))
      setShowSuggestions(results.length > 0)
    } else {
      setNameSuggestions([])
      setShowSuggestions(false)
    }
  }, [form.nom, form.id])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && nameRef.current && !nameRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto margin calculation
  const marginInfo = useMemo(() => {
    if (!form.prixAchat || !form.prixVente) return null
    const marge = form.prixAchat > 0 ? ((form.prixVente - form.prixAchat) / form.prixAchat * 100) : 0
    const benefice = form.prixVente - form.prixAchat
    return { marge: marge.toFixed(1), benefice, isValid: marge >= (form.margeMinimum || 0) }
  }, [form.prixAchat, form.prixVente, form.margeMinimum])

  // Auto-suggest selling price from cost + default margin
  const handleCostPriceChange = (val) => {
    const cost = +val
    setForm(prev => {
      const updated = { ...prev, prixAchat: cost }
      if (cost > 0 && (!prev.prixVente || prev.prixVente === 0)) {
        updated.prixVente = Math.round(cost * 1.3)
      }
      return updated
    })
  }

  // Handle barcode scan in form
  const handleFormScan = (code) => {
    setForm(prev => ({ ...prev, barcode: code }))
    setShowScanner(false)
  }

  // Quick duplicate from existing product
  const handleQuickFill = (product) => {
    setForm(prev => ({
      ...prev,
      nom: product.nom,
      secteur: product.secteur || 'detail',
      categorie: product.categorie || '',
      unite: product.unite || 'pièce',
      prixAchat: product.prixAchat || 0,
      prixVente: product.prixVente || 0,
      margeMinimum: product.margeMinimum || 10,
      emplacement: product.emplacement || '',
      entrepot: product.entrepot || 'Principal',
      description: product.description || '',
    }))
    setShowSuggestions(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white">{form.id ? 'Modifier' : 'Ajouter'} un produit</h3>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-600 touch-target"><X className="w-5 h-5 dark:text-gray-400" /></button>
        </div>

        {/* Auto-generated barcode preview */}
        {form.id && form.barcode && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-xl flex items-center gap-4">
            <BarcodeValue value={form.barcode} width={1} height={35} fontSize={10} />
            <div className="text-xs text-gray-500 dark:text-gray-400"><div className="font-medium text-gray-700 dark:text-gray-300">Code-barres auto-généré</div><div>{form.barcode}</div></div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image</label><ImageUpload value={form.image} onChange={(img) => setForm({ ...form, image: img })} /></div>

          {/* PRODUCT NAME with suggestions */}
          <div className="col-span-2 relative">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom * {form.id && <span className="text-gray-400">(automatique)</span>}</label>
            <div className="relative">
              <input ref={nameRef} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
              {!form.id && form.nom && <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />}
            </div>
            {showSuggestions && nameSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-700">Produits similaires — cliquer pour pré-remplir</div>
                {nameSuggestions.map(p => (
                  <button key={p.id} onClick={() => handleQuickFill(p)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2 text-sm transition-colors">
                    <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium dark:text-white truncate">{p.nom}</div>
                      <div className="text-[11px] text-gray-400">{p.categorie} · {p.prixVente?.toLocaleString('fr-FR')} FCFA</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* REFERENCE — auto-generated preview */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Référence {!form.id && <span className="text-green-500">(auto)</span>}
            </label>
            <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white"
              placeholder={form.id ? '' : 'Générée automatiquement'} />
            {!form.id && !form.reference && (
              <p className="text-[10px] text-green-500 mt-0.5">Sera générée: {(() => {
                const prefixes = { detail: 'DET', alimentaire: 'ALI', industriel: 'IND', pharmaceutique: 'PHAR', mode: 'MOD', high_tech: 'TECH', logistique: 'LOG', educatif: 'EDU' }
                return `${prefixes[secteur] || 'PRD'}-XXXX`
              })()}</p>
            )}
          </div>

          {/* BARCODE with scanner */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Code-barres {!form.id && <span className="text-green-500">(auto)</span>}
            </label>
            <div className="flex gap-1.5">
              <input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white font-mono"
                placeholder={form.id ? '' : 'GCI000001'} />
              <button onClick={() => setShowScanner(true)}
                className="px-3 py-2 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors touch-target"
                title="Scanner un code-barres">
                <ScanBarcode className="w-4 h-4" />
              </button>
            </div>
            {!form.id && !form.barcode && (
              <p className="text-[10px] text-green-500 mt-0.5">Sera généré automatiquement à la sauvegarde</p>
            )}
          </div>

          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Secteur *</label>
            <select value={form.secteur} onChange={e => setForm({ ...form, secteur: e.target.value, categorie: '', unite: UNITES[e.target.value]?.[0] || 'pièce' })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              {SECTEURS_COMMERCE.map(s => <option key={s.id} value={s.id}>{s.icon} {s.nom}</option>)}
            </select></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Catégorie</label>
            <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">-- Choisir --</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Unité</label>
            <select value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              {unites.map(u => <option key={u} value={u}>{u}</option>)}
            </select></div>

          {/* PRICE with auto margin */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix d'achat (FCFA)</label>
            <input type="number" value={form.prixAchat} onChange={e => handleCostPriceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Prix de vente (FCFA)</label>
            <input type="number" value={form.prixVente} onChange={e => setForm({ ...form, prixVente: +e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
            {marginInfo && (
              <div className={`flex items-center gap-2 mt-1 text-[11px] ${marginInfo.isValid ? 'text-green-500' : 'text-amber-500'}`}>
                <span>Marge: {marginInfo.marge}%</span>
                <span>·</span>
                <span>Bénéfice: {marginInfo.benefice.toLocaleString('fr-FR')} FCFA</span>
                {!marginInfo.isValid && <span>· <b>Min: {form.margeMinimum}%</b></span>}
              </div>
            )}
          </div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Marge min (%)</label><input type="number" value={form.margeMinimum} onChange={e => setForm({ ...form, margeMinimum: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stock actuel</label><input type="number" value={form.stockActuel} onChange={e => setForm({ ...form, stockActuel: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Seuil alerte</label><input type="number" value={form.seuilAlerte} onChange={e => setForm({ ...form, seuilAlerte: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stock min</label><input type="number" value={form.stockMinimal} onChange={e => setForm({ ...form, stockMinimal: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stock max</label><input type="number" value={form.stockMaximal} onChange={e => setForm({ ...form, stockMaximal: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Entrepôt</label><input value={form.entrepot} onChange={e => setForm({ ...form, entrepot: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" placeholder="Principal" /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Emplacement</label><input value={form.emplacement} onChange={e => setForm({ ...form, emplacement: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" placeholder="Rayon A3" /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          <SectorSpecificFields form={form} setForm={setForm} secteur={secteur} />
          {secteur === 'detail' && <CategorySpecificFields form={form} setForm={setForm} categorie={form.categorie} />}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={onSave} className="btn-primary text-sm py-2 px-4" disabled={!form.nom}>
            {form.id ? 'Modifier' : 'Créer le produit'}
          </button>
        </div>
      </div>

      {/* Barcode scanner modal */}
      {showScanner && <BarcodeScanner onScan={handleFormScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}

function EntreeSortieModal({ type, produit, onConfirm, onCancel }) {
  const isEntree = type === 'entree'
  const [qty, setQty] = useState(1)
  const [motif, setMotif] = useState(isEntree ? 'Réapprovisionnement' : 'Vente')
  const [reference, setReference] = useState('')
  const [fournisseur, setFournisseur] = useState('')
  const [client, setClient] = useState('')
  const [lot, setLot] = useState('')
  const [datePeremption, setDatePeremption] = useState('')
  const [prixUnitaire, setPrixUnitaire] = useState(isEntree ? (produit.prixAchat || 0) : (produit.prixVente || 0))
  const [numeroSerie, setNumeroSerie] = useState('')
  const [variantTaille, setVariantTaille] = useState('')
  const [variantCouleur, setVariantCouleur] = useState('')

  const handleConfirm = () => {
    if (qty <= 0) return
    const opts = { motif, reference, prixUnitaire, lot, datePeremption: datePeremption || null, numeroSerie, variantTaille, variantCouleur }
    if (isEntree) {
      opts.fournisseur = fournisseur
      entreeStock(produit.id, qty, opts)
    } else {
      if (qty > produit.stockActuel) { alert('Stock insuffisant !'); return }
      opts.client = client
      sortieStock(produit.id, qty, opts)
    }
    onConfirm()
  }

  const tailles = (produit.specifications?.tailles || '').split(',').filter(Boolean)
  const couleurs = (produit.specifications?.couleurs || '').split(',').filter(Boolean)
  const isMode = produit.secteur === 'mode' && (tailles.length > 0 || couleurs.length > 0)
  const isHighTech = produit.secteur === 'high_tech'
  const isPharma = produit.secteur === 'pharmaceutique'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isEntree ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
            {isEntree ? <ArrowDownCircle className="w-5 h-5 text-green-500" /> : <ArrowUpCircle className="w-5 h-5 text-red-500" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold dark:text-white">{isEntree ? 'Entrée' : 'Sortie'} de stock</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{produit.nom} — Stock: {produit.stockActuel} {produit.unite}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité *</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(+e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Motif</label>
            <select value={motif} onChange={e => setMotif(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              {isEntree ? (<><option>Réapprovisionnement</option><option>Retour client</option><option>Don</option><option>Production</option><option>Autre</option></>) :
                (<><option>Vente</option><option>Consommation interne</option><option>Perte</option><option>Don</option><option>Autre</option></>)}
            </select>
          </div>
          {isMode && (
            <div className="grid grid-cols-2 gap-3">
              {tailles.length > 0 && (
                <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Taille</label>
                  <select value={variantTaille} onChange={e => setVariantTaille(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    <option value="">--</option>{tailles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
              )}
              {couleurs.length > 0 && (
                <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Couleur</label>
                  <select value={variantCouleur} onChange={e => setVariantCouleur(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    <option value="">--</option>{couleurs.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              )}
            </div>
          )}
          {(isHighTech || isPharma) && (
            <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° de série</label><input value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" placeholder="SN-XXXX" /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Réf. commande</label><input value={reference} onChange={e => setReference(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
            <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Prix unitaire</label><input type="number" value={prixUnitaire} onChange={e => setPrixUnitaire(+e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          </div>
          {isEntree && <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fournisseur</label><input value={fournisseur} onChange={e => setFournisseur(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
            <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">N° Lot</label><input value={lot} onChange={e => setLot(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
          </div>}
          {!isEntree && <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Client</label><input value={client} onChange={e => setClient(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">Annuler</button>
          <button onClick={handleConfirm} className={`text-sm py-2 px-4 ${isEntree ? 'btn-primary' : 'bg-red-500 text-white rounded-lg hover:bg-red-600'}`} disabled={qty <= 0}>Confirmer</button>
        </div>
      </div>
    </div>
  )
}

function StockTab({ products, refresh }) {
  const { activeSector, isFiltered, enabledSectors } = useSector()
  const { isMobile } = useDevice()
  const [form, setForm] = useState(null)
  const [stockModal, setStockModal] = useState(null)
  const [labelProduct, setLabelProduct] = useState(null)
  const [showLabels, setShowLabels] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20
  const { sortField, sortDir, handleSort, sortData } = useSort('nom', 'asc')

  const filteredProducts = useMemo(() => {
    let result = products
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => p.nom.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q) || (p.reference || '').toLowerCase().includes(q))
    }
    if (isFiltered) result = result.filter(p => p.secteur === activeSector)
    return sortData(result)
  }, [products, search, activeSector, isFiltered, sortData])

  const totalPages = Math.ceil(filteredProducts.length / perPage)

  const emptyForm = { nom: '', reference: '', description: '', secteur: 'detail', categorie: '', barcode: '', unite: 'pièce', prixAchat: 0, prixVente: 0, margeMinimum: 10, stockActuel: 0, stockMinimal: 0, stockMaximal: 99999, seuilAlerte: 5, emplacement: '', entrepot: 'Principal', image: '', specifications: {}, variants: [], serialNumbers: [], recettes: [] }

  const handleSave = () => {
    if (form.id) updateProductV2(form)
    else addProductV2(form)
    setForm(null); refresh()
  }
  const handleDelete = (id) => { if (confirm('Supprimer ce produit ?')) { deleteProductV2(id); refresh() } }
  const handleDuplicate = (p) => {
    const dup = duplicateProductV2(p.id)
    if (dup) { refresh(); setForm({ ...dup }) }
  }
  const handleExport = () => {
    exportCSV('stock', ['ID', 'Réf', 'Code-barres', 'Nom', 'Secteur', 'Catégorie', 'Unité', 'Prix Achat', 'Prix Vente', 'Marge%', 'Stock', 'Seuil', 'Entrepôt'],
      filteredProducts.map(p => [p.id, p.reference, p.barcode, p.nom, p.secteur, p.categorie, p.unite, p.prixAchat, p.prixVente, p.prixAchat > 0 ? (((p.prixVente - p.prixAchat) / p.prixAchat) * 100).toFixed(1) : '-', p.stockActuel, p.seuilAlerte, p.entrepot]))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="flex-1 min-w-0 max-w-xs" />
        <select value={isFiltered ? activeSector : 'all'} disabled className="px-2 sm:px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-xs sm:text-sm bg-white dark:bg-dark-700 dark:text-white">
          <option value="all">Tous les secteurs</option>
          {SECTEURS_COMMERCE.filter(s => enabledSectors.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.icon} {s.nom}</option>)}
        </select>
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">{filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-1.5 sm:gap-2 ml-auto">
          <button onClick={() => setForm({ ...emptyForm })} className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 inline-flex items-center gap-1 sm:gap-2"><Plus className="w-4 h-4" /> <span className="hidden xs:inline">Ajouter</span></button>
          <button onClick={handleExport} className="btn-secondary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 inline-flex items-center gap-1 sm:gap-2"><Download className="w-4 h-4" /> <span className="hidden sm:inline">Exporter</span></button>
          <button onClick={() => setShowLabels(true)} className="btn-secondary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 inline-flex items-center gap-1 sm:gap-2"><Printer className="w-4 h-4" /> <span className="hidden sm:inline">Étiquettes</span></button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                <th className="px-3 py-3 font-medium text-xs w-10"></th>
                <SortableHeader label="Nom" field="nom" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="hidden sm:table-cell px-3 py-3 font-medium text-xs">Réf</th>
                <th className="hidden md:table-cell px-3 py-3 font-medium text-xs">Secteur</th>
                <SortableHeader label="Stock" field="stockActuel" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="hidden lg:table-cell px-3 py-3 font-medium text-xs">Seuil</th>
                <SortableHeader label="Prix Achat" field="prixAchat" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Prix Vente" field="prixVente" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                <th className="hidden sm:table-cell px-3 py-3 font-medium text-xs">Marge</th>
                <th className="px-3 py-3 font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.slice((page - 1) * perPage, page * perPage).map(p => {
                const marge = p.prixAchat > 0 ? (((p.prixVente - p.prixAchat) / p.prixAchat) * 100) : null
                const isAlert = p.stockActuel <= p.seuilAlerte
                const isMargeCritique = marge !== null && marge < p.margeMinimum
                const secteurInfo = SECTEURS_COMMERCE.find(s => s.id === p.secteur)
                return (
                  <tr key={p.id} className={`border-b border-gray-50 dark:border-dark-700 ${isAlert ? 'bg-red-50 dark:bg-red-900/10' : ''} hover:bg-gray-50 dark:hover:bg-dark-700/50`}>
                    <td className="px-3 py-2">{p.image ? <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-100 dark:bg-dark-600 flex items-center justify-center"><Package className="w-3.5 h-3.5 text-gray-300" /></div>}</td>
                    <td className="px-3 py-2 font-medium dark:text-gray-200"><div className="truncate max-w-[140px] sm:max-w-none">{p.nom}</div>{p.description && <div className="text-[10px] text-gray-400 truncate max-w-[120px] sm:max-w-[200px]">{p.description}</div>}</td>
                    <td className="hidden sm:table-cell px-3 py-2 dark:text-gray-400 text-xs font-mono">{p.reference || '-'}</td>
                    <td className="hidden md:table-cell px-3 py-2"><span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-dark-600 dark:text-gray-300">{secteurInfo?.icon} {secteurInfo?.nom?.split(' ')[0] || p.secteur}</span></td>
                    <td className="px-3 py-2"><span className={isAlert ? 'text-red-600 dark:text-red-400 font-bold' : 'dark:text-gray-300'}>{p.stockActuel} <span className="text-[10px] text-gray-400">{p.unite}</span></span></td>
                    <td className="hidden lg:table-cell px-3 py-2 dark:text-gray-400 text-xs">{p.seuilAlerte}</td>
                    <td className="px-3 py-2 dark:text-gray-300 text-xs">{p.prixAchat.toLocaleString('fr-FR')}</td>
                    <td className="px-3 py-2 dark:text-gray-300 text-xs">{p.prixVente.toLocaleString('fr-FR')}</td>
                    <td className="hidden sm:table-cell px-3 py-2 text-xs">{marge !== null ? <span className={isMargeCritique ? 'text-red-600 font-bold' : 'text-green-600 dark:text-green-400'}>{marge.toFixed(1)}%</span> : <span className="text-gray-400">-</span>}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setStockModal({ type: 'entree', produit: p })} className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500" title="Entrée"><ArrowDownCircle className="w-4 h-4" /></button>
                        <button onClick={() => setStockModal({ type: 'sortie', produit: p })} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Sortie"><ArrowUpCircle className="w-4 h-4" /></button>
                        <button onClick={() => setForm({ ...p })} className="p-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-500" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucun produit trouvé</p>}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {form && <ProductForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => setForm(null)} />}
      {stockModal && <EntreeSortieModal type={stockModal.type} produit={stockModal.produit} onConfirm={() => { setStockModal(null); refresh() }} onCancel={() => setStockModal(null)} />}
      {labelProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Étiquette</h3><button onClick={() => setLabelProduct(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button></div>
            <div className="flex justify-center"><BarcodeLabel barcode={labelProduct.barcode || String(labelProduct.id).padStart(8, '0')} nom={labelProduct.nom} prix={labelProduct.prixVente} /></div>
          </div>
        </div>
      )}
      {showLabels && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Toutes les étiquettes</h3><button onClick={() => setShowLabels(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button></div>
            <BarcodeSheet products={products} />
          </div>
        </div>
      )}
    </div>
  )
}

function MouvementsTab({ mouvements }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const perPage = 25

  const filtered = useMemo(() => {
    let result = mouvements.sort((a, b) => new Date(b.dateMouvement) - new Date(a.dateMouvement))
    if (search) { const q = search.toLowerCase(); result = result.filter(m => m.produitNom.toLowerCase().includes(q) || (m.reference || '').toLowerCase().includes(q)) }
    if (typeFilter !== 'all') result = result.filter(m => m.type === typeFilter)
    return result
  }, [mouvements, search, typeFilter])

  const tc = { entree: { icon: ArrowDownCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Entrée' }, sortie: { icon: ArrowUpCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Sortie' }, ajustement: { icon: MinusCircle, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', label: 'Ajustement' }, transfert: { icon: ArrowRightCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Transfert' } }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="flex-1 min-w-0 max-w-xs" />
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1 overflow-x-auto scrollbar-hide">
          {[{ key: 'all', label: 'Tout' }, { key: 'entree', label: 'Entrées' }, { key: 'sortie', label: 'Sorties' }, { key: 'ajustement', label: 'Ajust.' }, { key: 'transfert', label: 'Transf.' }].map(f => (
            <button key={f.key} onClick={() => { setTypeFilter(f.key); setPage(1) }} className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${typeFilter === f.key ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}>{f.label}</button>
          ))}
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline">{filtered.length} mouvement{filtered.length !== 1 ? 's' : ''}</span>
        <button onClick={() => exportCSV('mouvements', ['Date', 'Type', 'Produit', 'Quantité', 'Avant', 'Après', 'Motif', 'Réf', 'Montant'],
          filtered.map(m => [m.dateMouvement, m.type, m.produitNom, m.quantite, m.quantiteAvant, m.quantiteApres, m.motif, m.reference, m.montantTotal]))}
          className="btn-secondary text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 inline-flex items-center gap-1 sm:gap-2 ml-auto"><Download className="w-4 h-4" /> <span className="hidden sm:inline">Exporter</span></button>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm landscape-table">
            <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
              <th className="px-2 sm:px-3 py-3 font-medium text-xs">Type</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Date</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Produit</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Qté</th><th className="px-2 sm:px-3 py-3 font-medium text-xs hidden md:table-cell">Avant→Après</th><th className="px-2 sm:px-3 py-3 font-medium text-xs hidden lg:table-cell">Motif</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Montant</th>
            </tr></thead>
            <tbody>
              {filtered.slice((page - 1) * perPage, page * perPage).map(m => {
                const c = tc[m.type] || tc.ajustement; const Icon = c.icon
                return (
                  <tr key={m.id} className="border-b border-gray-50 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                    <td className="px-2 sm:px-3 py-2"><span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${c.bg} ${c.color}`}><Icon className="w-3 h-3" />{c.label}</span></td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-400 whitespace-nowrap">{new Date(m.dateMouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-2 sm:px-3 py-2 font-medium dark:text-gray-200 text-[10px] sm:text-xs">{m.produitNom}{m.variantTaille && ` (${m.variantTaille}/${m.variantCouleur})`}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs"><span className={m.type === 'sortie' ? 'text-red-500' : 'text-green-500'}>{m.type === 'sortie' ? '-' : '+'}{m.quantite}</span></td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-400 hidden md:table-cell">{m.quantiteAvant} → {m.quantiteApres}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-400 hidden lg:table-cell">{m.motif}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-300">{m.montantTotal > 0 ? m.montantTotal.toLocaleString('fr-FR') + ' FCFA' : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">Aucun mouvement</p>}
      </div>
      <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / perPage)} onPageChange={setPage} />
    </div>
  )
}

function LotsTab({ products }) {
  const [lots, setLots] = useState(getLots)
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const refreshLots = () => setLots(getLots())
  const filteredLots = useMemo(() => { let r = lots; if (search) { const q = search.toLowerCase(); r = r.filter(l => l.numeroLot.toLowerCase().includes(q)) } return r }, [lots, search])
  const now = new Date().toISOString().slice(0, 10)
  const perimes = getLotsPerimes()
  const proches = getLotsProchesPeremption()

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <StatCard icon={AlertTriangle} label="Lots expirés" value={perimes.length} color="red" />
        <StatCard icon={Clock} label="Expire < 30j" value={proches.length} color="amber" />
        <StatCard icon={Package} label="Total lots" value={lots.length} color="brand" />
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un lot..." className="flex-1 min-w-0 max-w-xs" />
        <button onClick={() => setForm({ produitId: '', numeroLot: '', quantite: 0, datePeremption: '', dateProduction: '', fournisseur: '', prixAchat: 0, statut: 'actif' })} className="btn-primary text-sm py-2 inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter un lot</button>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm landscape-table">
            <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
              <th className="px-2 sm:px-3 py-3 font-medium text-xs">N° Lot</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Produit</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Qté</th><th className="px-2 sm:px-3 py-3 font-medium text-xs hidden sm:table-cell">Production</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Péremption</th><th className="px-2 sm:px-3 py-3 font-medium text-xs hidden sm:table-cell">Statut</th>
            </tr></thead>
            <tbody>
              {filteredLots.map(l => {
                const prod = products.find(p => p.id === l.produitId)
                const estPerime = l.datePeremption && l.datePeremption <= now
                const estProche = l.datePeremption && !estPerime && (new Date(l.datePeremption) - new Date()) < 30 * 86400000
                return (
                  <tr key={l.id} className={`border-b border-gray-50 dark:border-dark-700 ${estPerime ? 'bg-red-50 dark:bg-red-900/10' : estProche ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                    <td className="px-2 sm:px-3 py-2 font-mono text-[10px] sm:text-xs dark:text-gray-300">{l.numeroLot}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-200">{prod?.nom || `#${l.produitId}`}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-300">{l.quantite}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-400 hidden sm:table-cell">{l.dateProduction || '-'}</td>
                    <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs">{l.datePeremption ? <span className={estPerime ? 'text-red-600 font-bold' : estProche ? 'text-amber-600' : 'dark:text-gray-400'}>{l.datePeremption} {estPerime && 'EXPIRÉ'}</span> : '-'}</td>
                    <td className="px-2 sm:px-3 py-2 hidden sm:table-cell"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${l.statut === 'actif' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>{l.statut}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredLots.length === 0 && <p className="text-center text-gray-400 py-8">Aucun lot</p>}
      </div>
      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Ajouter un lot</h3><button onClick={() => setForm(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Produit *</label>
                <select value={form.produitId} onChange={e => setForm({ ...form, produitId: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="">-- Choisir --</option>{products.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">N° Lot *</label><input value={form.numeroLot} onChange={e => setForm({ ...form, numeroLot: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité</label><input type="number" value={form.quantite} onChange={e => setForm({ ...form, quantite: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Production</label><input type="date" value={form.dateProduction} onChange={e => setForm({ ...form, dateProduction: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Péremption</label><input type="date" value={form.datePeremption} onChange={e => setForm({ ...form, datePeremption: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fournisseur</label><input value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => { if (form.produitId && form.numeroLot) { addLot(form); setForm(null); refreshLots() } }} className="btn-primary text-sm py-2 px-4" disabled={!form.numeroLot || !form.produitId}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RetourConsigneTab({ products }) {
  const [retours, setRetours] = useState(getRetoursConsignes)
  const [form, setForm] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const refreshRetours = () => setRetours(getRetoursConsignes())
  const stats = getStatsRetoursConsignes()

  const boissonProducts = products.filter(p => p.secteur === 'detail' && p.categorie === 'Boisson' && p.specifications?.estConsigne)

  const filtered = useMemo(() => {
    let r = retours
    if (search) { const q = search.toLowerCase(); r = r.filter(ret => ret.produitNom.toLowerCase().includes(q) || ret.client.toLowerCase().includes(q)) }
    if (filterStatut !== 'all') r = r.filter(ret => ret.statut === filterStatut)
    return r.sort((a, b) => new Date(b.dateRetour) - new Date(a.dateRetour))
  }, [retours, search, filterStatut])

  const statutColors = {
    en_attente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    valide: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rembourse: 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <StatCard icon={RefreshCw} label="Total retours" value={stats.total} color="brand" />
        <StatCard icon={Clock} label="En attente" value={stats.enAttente} color="amber" />
        <StatCard icon={Check} label="Validés" value={stats.valide} color="green" />
        <StatCard icon={TrendingUp} label="Montant consigné" value={`${stats.montantTotal.toLocaleString('fr-FR')}`} color="blue" sub="FCFA" />
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." className="flex-1 min-w-0 max-w-xs" />
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
          {[{ key: 'all', label: 'Tout' }, { key: 'en_attente', label: 'En attente' }, { key: 'valide', label: 'Validé' }, { key: 'rembourse', label: 'Remboursé' }].map(f => (
            <button key={f.key} onClick={() => setFilterStatut(f.key)} className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${filterStatut === f.key ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}`}>{f.label}</button>
          ))}
        </div>
        <button onClick={() => setForm({ produitId: '', produitNom: '', typeContenant: 'Bouteille', quantite: 1, montantConsigne: 0, client: '', statut: 'en_attente', notes: '' })} className="btn-primary text-sm py-2 inline-flex items-center gap-2 ml-auto"><Plus className="w-4 h-4" /> Nouveau retour</button>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm landscape-table">
            <thead><tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
              <th className="px-2 sm:px-3 py-3 font-medium text-xs">Produit</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Client</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Type</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Qté</th><th className="px-2 sm:px-3 py-3 font-medium text-xs hidden sm:table-cell">Consigne</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Statut</th><th className="px-2 sm:px-3 py-3 font-medium text-xs">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-50 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700/50">
                  <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-medium dark:text-gray-200">{r.produitNom}</td>
                  <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-300">{r.client || '-'}</td>
                  <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-400">{r.typeContenant}</td>
                  <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-300">{r.quantite}</td>
                  <td className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs dark:text-gray-300 hidden sm:table-cell">{(r.montantConsigne * r.quantite).toLocaleString('fr-FR')} FCFA</td>
                  <td className="px-2 sm:px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statutColors[r.statut] || statutColors.en_attente}`}>{r.statut === 'en_attente' ? 'En attente' : r.statut === 'valide' ? 'Validé' : 'Remboursé'}</span></td>
                  <td className="px-2 sm:px-3 py-2">
                    <div className="flex items-center gap-0.5">
                      {r.statut === 'en_attente' && <>
                        <button onClick={() => { updateRetourConsigne({ id: r.id, statut: 'valide' }); refreshRetours() }} className="p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500" title="Valider"><Check className="w-4 h-4" /></button>
                        <button onClick={() => { updateRetourConsigne({ id: r.id, statut: 'rembourse' }); refreshRetours() }} className="p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500" title="Rembourser"><RotateCcw className="w-4 h-4" /></button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">Aucun retour consigné</p>}
      </div>

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Nouveau retour consigné</h3><button onClick={() => setForm(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Produit *</label>
                <select value={form.produitId} onChange={e => {
                  const p = boissonProducts.find(pr => pr.id === +e.target.value)
                  setForm({ ...form, produitId: +e.target.value, produitNom: p?.nom || '' })
                }} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="">-- Choisir --</option>{boissonProducts.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type contenant</label>
                  <select value={form.typeContenant} onChange={e => setForm({ ...form, typeContenant: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    <option>Bouteille</option><option>Casier</option><option>Pack</option><option>Canette</option><option>Bidon</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Quantité *</label><input type="number" min={1} value={form.quantite} onChange={e => setForm({ ...form, quantite: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Client</label><input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" placeholder="Nom du client" /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Consigne (FCFA/u)</label><input type="number" value={form.montantConsigne} onChange={e => setForm({ ...form, montantConsigne: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" placeholder="Optionnel" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => { if (form.produitId && form.quantite > 0) { addRetourConsigne(form); setForm(null); refreshRetours() } }} className="btn-primary text-sm py-2 px-4" disabled={!form.produitId || form.quantite <= 0}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AlertesTab({ alertes }) {
  const { activeSector, isFiltered, enabledSectors } = useSector()
  const [filterGravite, setFilterGravite] = useState('all')

  const filtered = useMemo(() => {
    let r = alertes
    if (isFiltered) r = r.filter(a => a.secteur === activeSector)
    if (filterGravite !== 'all') r = r.filter(a => a.gravite === filterGravite)
    return r
  }, [alertes, activeSector, isFiltered, filterGravite])

  const iconMap = {
    stock_bas: AlertTriangle, perime: AlertCircle, peremption_proche: Clock, stock_max: TrendingUp,
    marge_critique: TrendingDown, garantie_expiree: Shield, invendu: Package, pharma_perime: AlertCircle, transfert_suggere: ArrowRightCircle,
    ingredient_cle_rupture: AlertCircle, consigne_en_attente: RefreshCw, hygiene_essentiel_rupture: AlertCircle,
    entretien_base_critique: AlertTriangle, vetement_bestseller: TrendingUp, retours_consignes_globaux: RotateCcw,
  }
  const colorMap = {
    critique: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  }

  if (filtered.length === 0) return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-green-500" /></div>
      <h3 className="text-lg font-semibold dark:text-white mb-2">Tout est OK</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">Aucune alerte</p>
    </div>
  )

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select value={isFiltered ? activeSector : 'all'} disabled className="px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
          <option value="all">Tous les secteurs</option>{SECTEURS_COMMERCE.filter(s => enabledSectors.includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.icon} {s.nom}</option>)}
        </select>
        <select value={filterGravite} onChange={e => setFilterGravite(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
          <option value="all">Toutes gravités</option><option value="critique">Critique</option><option value="warning">Avertissement</option><option value="info">Info</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} alerte{filtered.length !== 1 ? 's' : ''}</span>
        <button onClick={() => exportCSV('alertes', ['Type', 'Gravité', 'Secteur', 'Message'], filtered.map(a => [a.type, a.gravite, a.secteur, a.message]))} className="btn-secondary text-sm py-2 inline-flex items-center gap-2 ml-auto"><Download className="w-4 h-4" /> Exporter</button>
      </div>
      <div className="space-y-2">
        {filtered.map((a, i) => {
          const Icon = iconMap[a.type] || AlertTriangle
          return (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${colorMap[a.gravite] || colorMap.info}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.message}</p>
                {a.produit && <p className="text-xs opacity-70">Réf: {a.produit.reference || '-'} | {SECTEURS_COMMERCE.find(s => s.id === a.secteur)?.icon} {SECTEURS_COMMERCE.find(s => s.id === a.secteur)?.nom}</p>}
                {a.produitDispo && <p className="text-xs opacity-70">→ Suggéré: {a.produitDispo.nom} ({a.produitDispo.stockActuel} u. dispo)</p>}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.gravite === 'critique' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300' : a.gravite === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{a.gravite}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EntrepotsTab({ refresh }) {
  const [entrepots, setEntrepots] = useState(getEntrepots)
  const [form, setForm] = useState(null)
  const refreshE = () => setEntrepots(getEntrepots())
  return (
    <div>
      <div className="flex justify-end mb-4"><button onClick={() => setForm({ nom: '', adresse: '', ville: '', zone: '', responsable: '', telephone: '', capacite: 0 })} className="btn-primary text-sm py-2 inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Ajouter</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entrepots.map(e => (
          <div key={e.id} className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2"><Warehouse className="w-5 h-5 text-brand-500" /><h4 className="font-semibold dark:text-white">{e.nom}</h4></div>
              <button onClick={() => { if (confirm('Supprimer ?')) { deleteEntrepot(e.id); refreshE() } }} className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
            {e.ville && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">📍 {e.ville}{e.zone ? ` — ${e.zone}` : ''}</p>}
            {e.adresse && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">🏠 {e.adresse}</p>}
            {e.responsable && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">👤 {e.responsable}</p>}
            {e.capacite > 0 && <p className="text-xs text-gray-500 dark:text-gray-400">📦 Capacité: {e.capacite}</p>}
          </div>
        ))}
        {entrepots.length === 0 && <p className="text-center text-gray-400 py-8 col-span-full">Aucun entrepôt</p>}
      </div>
      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold dark:text-white">Ajouter un entrepôt</h3><button onClick={() => setForm(null)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-600"><X className="w-5 h-5 dark:text-gray-400" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label><input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Ville</label><input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" placeholder="Abidjan" /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Zone</label><input value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" placeholder="Plateau" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Adresse</label><input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Responsable</label><input value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
                <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Capacité</label><input type="number" value={form.capacite} onChange={e => setForm({ ...form, capacite: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setForm(null)} className="btn-secondary text-sm py-2 px-4">Annuler</button>
              <button onClick={() => { if (form.nom) { addEntrepot(form); setForm(null); refreshE() } }} className="btn-primary text-sm py-2 px-4" disabled={!form.nom}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RapportsTab({ products, mouvements }) {
  const [rapport, setRapport] = useState('bestsellers')
  const [dateDebut, setDateDebut] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10) })
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().slice(0, 10))

  const rapportTypes = [
    { key: 'bestsellers', label: 'Best-Sellers', icon: Star },
    { key: 'invendus', label: 'Invendus', icon: Package },
    { key: 'marges', label: 'Marges', icon: TrendingUp },
    { key: 'saisonnier', label: 'Saisonnier', icon: Calendar },
    { key: 'pharma', label: 'Consommation Pharma', icon: ClipboardList },
  ]

  const data = useMemo(() => {
    switch (rapport) {
      case 'bestsellers': return getRapportBestSellers(dateDebut, dateFin)
      case 'invendus': return getRapportInvendus(90)
      case 'marges': return getRapportMarges()
      case 'saisonnier': return getRapportSaisonnier()
      case 'pharma': return getRapportConsommationPharma(dateDebut, dateFin)
      default: return []
    }
  }, [rapport, dateDebut, dateFin, mouvements])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {rapportTypes.map(r => {
          const Icon = r.icon
          return <button key={r.key} onClick={() => setRapport(r.key)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${rapport === r.key ? 'bg-brand-500 text-white' : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}><Icon className="w-4 h-4" /> {r.label}</button>
        })}
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-700 dark:text-white" />
          <span className="text-gray-400">→</span>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-700 dark:text-white" />
          <button onClick={() => exportCSV(rapport, rapport === 'bestsellers' ? ['Produit', 'Quantité', 'CA'] : rapport === 'marges' ? ['Nom', 'Marge%', 'Valeur Stock'] : ['Mois', 'Quantité', 'CA'], rapport === 'bestsellers' ? data.map(d => [d.nom, d.quantiteVendue, d.ca]) : rapport === 'marges' ? data.map(d => [d.nom, d.marge?.toFixed(1), d.valeurStock]) : rapport === 'saisonnier' ? data.map(d => [d.mois, d.quantite, d.ca]) : rapport === 'invendus' ? data.map(d => [d.nom, d.stockActuel, d.prixVente]) : data.map(d => [d.nom, d.totalSorti, d.ca]))} className="btn-secondary text-sm py-1.5 inline-flex items-center gap-1"><Download className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-600">
                {rapport === 'bestsellers' && <><th className="px-3 py-3 font-medium text-xs">#</th><th className="px-3 py-3 font-medium text-xs">Produit</th><th className="px-3 py-3 font-medium text-xs">Quantité vendue</th><th className="px-3 py-3 font-medium text-xs">CA</th></>}
                {rapport === 'invendus' && <><th className="px-3 py-3 font-medium text-xs">Produit</th><th className="px-3 py-3 font-medium text-xs">Stock</th><th className="px-3 py-3 font-medium text-xs">Prix</th><th className="px-3 py-3 font-medium text-xs">Secteur</th></>}
                {rapport === 'marges' && <><th className="px-3 py-3 font-medium text-xs">Produit</th><th className="px-3 py-3 font-medium text-xs">Achat</th><th className="px-3 py-3 font-medium text-xs">Vente</th><th className="px-3 py-3 font-medium text-xs">Marge</th><th className="px-3 py-3 font-medium text-xs">Valeur Stock</th></>}
                {rapport === 'saisonnier' && <><th className="px-3 py-3 font-medium text-xs">Mois</th><th className="px-3 py-3 font-medium text-xs">Quantité</th><th className="px-3 py-3 font-medium text-xs">CA</th><th className="px-3 py-3 font-medium text-xs">Nb ventes</th></>}
                {rapport === 'pharma' && <><th className="px-3 py-3 font-medium text-xs">Médicament</th><th className="px-3 py-3 font-medium text-xs">DCI</th><th className="px-3 py-3 font-medium text-xs">Qté sortie</th><th className="px-3 py-3 font-medium text-xs">CA</th></>}
              </tr>
            </thead>
            <tbody>
              {rapport === 'bestsellers' && data.map((d, i) => <tr key={i} className="border-b border-gray-50 dark:border-dark-700"><td className="px-3 py-2 text-xs font-bold text-brand-500">{i + 1}</td><td className="px-3 py-2 text-xs dark:text-gray-200">{d.nom}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.quantiteVendue}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.ca.toLocaleString('fr-FR')} FCFA</td></tr>)}
              {rapport === 'invendus' && data.map((d, i) => <tr key={i} className="border-b border-gray-50 dark:border-dark-700"><td className="px-3 py-2 text-xs dark:text-gray-200">{d.nom}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.stockActuel}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.prixVente.toLocaleString('fr-FR')} FCFA</td><td className="px-3 py-2 text-xs dark:text-gray-400">{SECTEURS_COMMERCE.find(s => s.id === d.secteur)?.icon}</td></tr>)}
              {rapport === 'marges' && data.map((d, i) => <tr key={i} className={`border-b border-gray-50 dark:border-dark-700 ${d.marge < d.margeMinimum ? 'bg-red-50 dark:bg-red-900/10' : ''}`}><td className="px-3 py-2 text-xs dark:text-gray-200">{d.nom}</td><td className="px-3 py-2 text-xs dark:text-gray-400">{d.prixAchat.toLocaleString('fr-FR')}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.prixVente.toLocaleString('fr-FR')}</td><td className="px-3 py-2 text-xs"><span className={d.marge < d.margeMinimum ? 'text-red-600 font-bold' : 'text-green-600 dark:text-green-400'}>{d.marge?.toFixed(1)}%</span></td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.valeurStock.toLocaleString('fr-FR')} FCFA</td></tr>)}
              {rapport === 'saisonnier' && data.map((d, i) => <tr key={i} className="border-b border-gray-50 dark:border-dark-700"><td className="px-3 py-2 text-xs dark:text-gray-200">{d.mois}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.quantite}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.ca.toLocaleString('fr-FR')} FCFA</td><td className="px-3 py-2 text-xs dark:text-gray-400">{d.nbVentes}</td></tr>)}
              {rapport === 'pharma' && data.map((d, i) => <tr key={i} className="border-b border-gray-50 dark:border-dark-700"><td className="px-3 py-2 text-xs dark:text-gray-200">{d.nom}</td><td className="px-3 py-2 text-xs dark:text-gray-400">{d.specifications?.dcI || '-'}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.totalSorti}</td><td className="px-3 py-2 text-xs dark:text-gray-300">{d.ca.toLocaleString('fr-FR')} FCFA</td></tr>)}
            </tbody>
          </table>
        </div>
        {data.length === 0 && <p className="text-center text-gray-400 py-8">Aucune donnée pour cette période</p>}
      </div>
    </div>
  )
}

export default function StockPage() {
  const [tab, setTab] = useState('produits')
  const { activeSector, isFiltered, filterAlertes } = useSector()
  const { isMobile } = useDevice()
  const [products, setProducts] = useState(getProductsV2)
  const [mouvements, setMouvements] = useState(getMouvements)
  const refresh = () => { setProducts(getProductsV2()); setMouvements(getMouvements()) }

  const stats = useMemo(() => getStatsStock(isFiltered ? activeSector : null), [products, mouvements, activeSector, isFiltered])
  const alertes = useMemo(() => filterAlertes(getAlertesStock()), [products, mouvements, activeSector, isFiltered])

  return (
    <div className="overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Package className="w-6 h-6 text-brand-500" /> Gestion de Stock</h1>
        <button onClick={() => { const m = migrateFromV1(); if (m > 0) { alert(`${m} produits migrés !`); refresh() } else { alert('Aucun produit à migrer.') } }} className="btn-secondary text-sm py-2 inline-flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Migration V1</button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-4">
        <StatCard icon={Package} label="Produits" value={stats.totalProduits} color="brand" />
        <StatCard icon={TrendingUp} label="Stock (achat)" value={`${(stats.valeurStock / 1000).toFixed(0)}k`} color="blue" sub="FCFA" />
        <StatCard icon={TrendingUp} label="Stock (vente)" value={`${(stats.valeurVente / 1000).toFixed(0)}k`} color="green" sub="FCFA" />
        <StatCard icon={AlertTriangle} label="Alertes" value={alertes.length} color={alertes.length > 0 ? 'red' : 'green'} />
        <StatCard icon={ArrowDownCircle} label="Entrées mois" value={stats.entreesMois} color="green" />
        <StatCard icon={ArrowUpCircle} label="Sorties mois" value={stats.sortiesMois} color="red" />
        <StatCard icon={TrendingUp} label="Marge moy." value={`${stats.margeMoyenne}%`} color="purple" />
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-xl p-1 mb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(t => {
          const Icon = t.icon
          const badge = t.key === 'alertes' && alertes.length > 0 ? alertes.length : null
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${tab === t.key ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.label.split(' ')[0]}</span>
              {badge && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">{badge}</span>}
            </button>
          )
        })}
      </div>

      {tab === 'produits' && <StockTab products={products} refresh={refresh} />}
      {tab === 'mouvements' && <MouvementsTab mouvements={mouvements} />}
      {tab === 'lots' && <LotsTab products={products} />}
      {tab === 'retours' && <RetourConsigneTab products={products} />}
      {tab === 'alertes' && <AlertesTab alertes={alertes} />}
      {tab === 'entrepots' && <EntrepotsTab refresh={refresh} />}
      {tab === 'rapports' && <RapportsTab products={products} mouvements={mouvements} />}
    </div>
  )
}
