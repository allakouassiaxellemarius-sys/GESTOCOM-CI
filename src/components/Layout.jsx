import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useSector } from '../context/SectorContext'
import { useDevice } from '../context/DeviceContext'
import { SECTEURS_COMMERCE } from '../lib/stockDb'
import { SECTORS } from '../lib/modules'
import {
  LayoutDashboard, Package, ShoppingCart,
  TrendingUp, Receipt, Truck, Settings, LogOut,
  Menu, X, Zap, BarChart3, RefreshCw, Download, Loader,
  History, FileText, ChevronRight, RotateCcw, ClipboardList, MoreHorizontal,
  Landmark, Factory, Heart, GraduationCap, HandHeart, ChevronDown, Users,
  Layers, Filter, ShieldCheck, Monitor,
} from 'lucide-react'
import { getProductsEnAlerte } from '../lib/db'

const ICONS = { LayoutDashboard, Package, ShoppingCart, TrendingUp, Receipt, Truck, Settings, BarChart3, History, FileText, RotateCcw, ClipboardList, Landmark, Factory, Heart, GraduationCap, HandHeart, Layers, Users }

function SectorGate({ enabledSectors, onChosen, user, onLogout }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const sectors = enabledSectors.map(id => SECTORS[id]).filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-gray-100">
      <header className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-dark-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold dark:text-white">GESTOCOM</div>
            <div className="text-[10px] text-gold-400">CI v2.1</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">{user?.nom}</span>
          <button onClick={onLogout} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 touch-target" title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Layers className="w-8 h-8 text-brand-500" />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">Bienvenue !</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Sélectionnez votre secteur d'activité pour commencer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sectors.map(s => {
              const Icon = ICONS[s.icon] || Layers
              return (
                <button key={s.id} onClick={() => onChosen(s.id)}
                  className="group flex items-center gap-3 p-4 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-2xl hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/10 transition-all text-left touch-feedback active:scale-[0.97]">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{s.nom}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">{s.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
          <button onClick={() => onChosen('all')}
            className="mt-6 text-sm text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
            Passer — Voir tous les secteurs
          </button>
        </div>
      </main>
    </div>
  )
}

const SECTOR_NAV = {
  commerce: {
    icon: 'ShoppingCart', label: 'Commerce', to: '/app/stock',
    sub: [
      { to: '/app/stock', icon: 'Package', label: 'Stock' },
      { to: '/app/ventes', icon: 'ShoppingCart', label: 'Ventes' },
      { to: '/app/ventes/historique', icon: 'History', label: 'Historique' },
      { to: '/app/ventes/recus', icon: 'FileText', label: 'Reçus' },
      { to: '/app/ventes/rapports', icon: 'BarChart3', label: 'Rapports' },
      { to: '/app/retours', icon: 'RotateCcw', label: 'Retours' },
      { to: '/app/fournisseurs', icon: 'Truck', label: 'Fournisseurs' },
      { to: '/app/fournisseurs/commandes', icon: 'ClipboardList', label: 'Commandes' },
      { to: '/app/profit', icon: 'TrendingUp', label: 'Profit' },
      { to: '/app/depenses', icon: 'Receipt', label: 'Dépenses' },
    ],
  },
  finance: { icon: 'Landmark', label: 'Finance & Comptabilité', to: '/app/finance' },
  industrie: { icon: 'Factory', label: 'Industrie & Artisanat', to: '/app/industrie' },
  transport: { icon: 'Truck', label: 'Transport & Logistique', to: '/app/transport' },
  sante: { icon: 'Heart', label: 'Santé & Pharmacies', to: '/app/sante' },
  education: { icon: 'GraduationCap', label: 'Éducation & Formation', to: '/app/education' },
  ong: { icon: 'HandHeart', label: 'ONG & Associations', to: '/app/ong' },
}

const COMMERCE_TABS = [
  { to: '/app', icon: 'LayoutDashboard', label: 'Accueil' },
  { to: '/app/ventes', icon: 'ShoppingCart', label: 'Ventes' },
  { to: '/app/stock', icon: 'Package', label: 'Stock' },
  { to: '/app/depenses', icon: 'Receipt', label: 'Dépenses' },
  { to: '__more', icon: 'MoreHorizontal', label: 'Plus' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { activeSector, setSector, isFiltered, sectorDef, isTopSector, enabledSectors, sectorChosen } = useSector()
  const { isMobile, isLandscape } = useDevice()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [openSector, setOpenSector] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showMoreSheet, setShowMoreSheet] = useState(false)
  const [showSectorDropdown, setShowSectorDropdown] = useState(false)
  const sheetRef = useRef(null)
  const touchStartY = useRef(0)

  useEffect(() => { setShowMoreMenu(false); setShowMoreSheet(false) }, [location.pathname])

  useEffect(() => {
    enabledSectors.forEach(s => {
      const nav = SECTOR_NAV[s]
      if (nav?.sub && location.pathname.startsWith(nav.to)) setOpenSector(s)
    })
  }, [location.pathname])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    const api = window.electronAPI
    if (api?.window?.reload) api.window.reload()
    else setTimeout(() => window.location.reload(), 100)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) { e.preventDefault(); handleRefresh() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleRefresh])

  useEffect(() => {
    const api = window.electronAPI
    if (!api?.onUpdateProgress) return
    return api.onUpdateProgress(setUpdateProgress)
  }, [])

  // Bottom sheet swipe-to-close
  const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY }
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current
    if (diff > 80) {
      setShowSectors(false)
      setShowMoreSheet(false)
    }
  }

  const visibleSectors = enabledSectors

  const getCurrentPageTitle = () => {
    for (const sectorId of enabledSectors) {
      const nav = SECTOR_NAV[sectorId]
      if (!nav) continue
      if (nav.sub) {
        if (nav.sub.some(sub => location.pathname === sub.to)) return nav.label
      }
      if (location.pathname === nav.to) return nav.label
    }
    if (location.pathname === '/app') return 'Tableau de bord'
    if (location.pathname === '/app/ia') return 'Analyses & Prévisions'
    if (location.pathname === '/app/documents') return 'Documents KYC/KYB'
    if (location.pathname === '/app/logiciels') return 'Logiciels'
    if (location.pathname === '/app/parametres') return 'Paramètres'
    if (location.pathname === '/app/modules') return 'Modules'
    return 'GESTOCOM'
  }

  const getActiveTab = () => {
    if (location.pathname === '/app') return '/app'
    if (location.pathname.startsWith('/app/ventes')) return '/app/ventes'
    if (location.pathname.startsWith('/app/stock') || location.pathname.startsWith('/app/fournisseurs') || location.pathname.startsWith('/app/retours') || location.pathname.startsWith('/app/profit')) return '/app/stock'
    if (location.pathname.startsWith('/app/depenses')) return '/app/depenses'
    if (location.pathname.startsWith('/app/finance') || location.pathname.startsWith('/app/industrie') || location.pathname.startsWith('/app/transport') || location.pathname.startsWith('/app/sante') || location.pathname.startsWith('/app/education') || location.pathname.startsWith('/app/ong')) return '__sector'
    return '__more'
  }

  const getMobileTabs = () => {
    if (isFiltered && activeSector !== 'commerce') {
      const nav = SECTOR_NAV[activeSector]
      if (nav) {
        return [
          { to: '/app', icon: 'LayoutDashboard', label: 'Accueil' },
          { to: nav.to, icon: nav.icon, label: nav.label.split(' ')[0] },
          { to: '__more', icon: 'MoreHorizontal', label: 'Plus' },
        ]
      }
    }
    return COMMERCE_TABS
  }

  if (!sectorChosen && enabledSectors.length > 1) {
    return (
      <SectorGate enabledSectors={enabledSectors} onChosen={setSector} user={user} onLogout={() => { logout(); navigate('/') }} />
    )
  }

  return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-gray-100 overflow-x-hidden max-w-full">

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className={`${isMobile ? 'hidden' : ''} fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'w-56' : 'w-0'} transition-all duration-200 overflow-hidden bg-dark-900 flex flex-col`}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">GESTOCOM</div>
            <div className="text-[10px] text-gold-400">CI v2.1</div>
          </div>
        </div>
        <div className="px-3 py-2 border-b border-white/10">
          <button onClick={() => setShowSectorDropdown(!showSectorDropdown)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left">
            <Filter className="w-3.5 h-3.5 text-brand-400" />
            <span className="flex-1 truncate text-gray-300">
              {isFiltered ? (
                isTopSector ? (
                  <span className="inline-flex items-center gap-1">
                    {(() => { const I = ICONS[sectorDef?.icon] || Layers; return <I className="w-3.5 h-3.5" /> })()}
                    {sectorDef?.nom}
                  </span>
                ) : (
                  <span>{sectorDef?.icon} {sectorDef?.nom}</span>
                )
              ) : 'Tous les secteurs'}
            </span>
            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${showSectorDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showSectorDropdown && (
            <div className="mt-1 bg-dark-800 border border-white/10 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <button onClick={() => { setSector('all'); setShowSectorDropdown(false) }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  !isFiltered ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}>
                Tous les secteurs
              </button>
              {Object.values(SECTORS).filter(s => enabledSectors.includes(s.id)).map(s => {
                const SIcon = ICONS[s.icon] || Layers
                return (
                  <button key={s.id} onClick={() => { setSector(s.id); setShowSectorDropdown(false) }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
                      activeSector === s.id ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}>
                    <SIcon className="w-3.5 h-3.5" /> {s.nom}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          <Link to="/app" className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
            location.pathname === '/app' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}>
            <LayoutDashboard className="w-4 h-4" /> Tableau de bord
          </Link>

          <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Opérations</div>
          {(isFiltered ? visibleSectors.filter(s => s === activeSector) : visibleSectors).map(sectorId => {
            const nav = SECTOR_NAV[sectorId]
            if (!nav) return null
            const Icon = ICONS[nav.icon] || Layers
            if (nav.sub) {
              const active = location.pathname.startsWith(nav.to)
              const isOpen = openSector === sectorId
              return (
                <div key={sectorId}>
                  <button onClick={() => setOpenSector(isOpen ? null : sectorId)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active ? 'bg-brand-500/10 text-brand-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{nav.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="ml-4 border-l border-white/10">
                      {nav.sub.map(sub => {
                        const SubIcon = ICONS[sub.icon] || FileText
                        return (
                          <Link key={sub.to} to={sub.to}
                            className={`flex items-center gap-2 px-4 py-2 text-xs transition-colors ${
                              location.pathname === sub.to ? 'text-brand-400 bg-brand-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}>
                            <SubIcon className="w-3.5 h-3.5" /> {sub.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <Link key={sectorId} to={nav.to}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  location.pathname === nav.to ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" /> {nav.label}
              </Link>
            )
          })}

          <div className="mx-4 mt-3 mb-1 border-t border-white/10" />
          <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Outils</div>
          <Link to="/app/ia" className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
            location.pathname === '/app/ia' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}>
            <BarChart3 className="w-4 h-4" /> Analyses & Prévisions
          </Link>
          {user?.role === 'admin' && (
            <Link to="/app/documents" className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              location.pathname === '/app/documents' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}>
              <ShieldCheck className="w-4 h-4" /> Documents KYC/KYB
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/app/logiciels" className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
              location.pathname === '/app/logiciels' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}>
              <Monitor className="w-4 h-4" /> Logiciels
            </Link>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="mx-4 mt-3 mb-1 border-t border-white/10" />
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Administration</div>
              <Link to="/app/parametres" className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                location.pathname === '/app/parametres' ? 'bg-brand-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
                <Settings className="w-4 h-4" /> Paramètres
              </Link>
            </>
          )}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={() => { logout(); navigate('/') }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <div className={`flex-1 min-w-0 overflow-hidden ${isMobile ? '' : (sidebarOpen ? 'ml-56' : 'ml-0')} transition-all duration-200 flex flex-col min-h-screen`}>
        {/* Header */}
        <header className="layout-header sticky top-0 z-20 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-dark-700/60 safe-area-top">
          <div className="px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isMobile && (
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 touch-target">
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
              <h1 className="text-sm font-semibold dark:text-white truncate max-w-[200px] sm:max-w-none">{getCurrentPageTitle()}</h1>
              {isMobile && isFiltered && (
                <button onClick={() => setSector('all')} className="ml-2 px-2 py-0.5 text-[10px] bg-brand-500/20 text-brand-400 rounded-full flex items-center gap-1 shrink-0">
                  <Filter className="w-2.5 h-2.5" />
                  {isTopSector ? (
                    <>
                      {(() => { const I = ICONS[sectorDef?.icon] || Layers; return <I className="w-2.5 h-2.5" /> })()}
                      {sectorDef?.nom?.slice(0, 12)}
                    </>
                  ) : (
                    <>{sectorDef?.icon} {sectorDef?.nom?.slice(0, 12)}</>
                  )}
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">{user?.nom}</span>
              {!isMobile && (
                <button onClick={() => { logout(); navigate('/') }}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 touch-target" title="Déconnexion">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={`layout-main flex-1 ${isMobile ? 'p-3 pb-24' : 'p-6'} bg-gray-50 dark:bg-dark-950 page-enter overflow-x-hidden max-w-full`}>
          {children}
        </main>

        {/* Desktop footer */}
        {!isMobile && (
          <div className="px-4 py-1.5 bg-dark-900 text-gray-400 text-xs flex items-center justify-between">
            <span>v2.1 — {user?.nom} ({user?.role})</span>
            <span>Données stockées localement</span>
          </div>
        )}
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      {isMobile && (
        <nav className="layout-nav fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-dark-800/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-dark-700/60 safe-area-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center justify-around h-14">
            {getMobileTabs().map(item => {
              if (item.to === '__more') {
                return (
                  <button key="more" onClick={() => { setShowMoreSheet(!showMoreSheet); setShowSectors(false) }}
                    className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors touch-target ${
                      showMoreSheet ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                    <MoreHorizontal className="w-5 h-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                )
              }
              const active = getActiveTab() === item.to
              return (
                <Link key={item.to} to={item.to}
                  className={`flex flex-col items-center justify-center gap-0.5 w-14 h-14 transition-colors touch-target relative ${
                    active ? 'text-brand-500' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  <item.icon className="w-5 h-5" />
                  <span className={`text-[10px] ${active ? 'font-semibold' : ''}`}>{item.label}</span>
                  {active && <div className="absolute top-0.5 w-5 h-0.5 bg-brand-500 rounded-full" />}
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* ═══ MOBILE: MORE BOTTOM SHEET ═══ */}
      {showMoreSheet && (
        <>
          <div className="bottom-sheet-overlay" onClick={() => setShowMoreSheet(false)} />
          <div className="bottom-sheet" ref={sheetRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="px-4 pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
              <h3 className="text-base font-bold dark:text-white">Plus</h3>
            </div>
            <div className="overflow-y-auto max-h-[65vh] pb-4">
              {(!isFiltered || activeSector === 'commerce') && (
                <>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Navigation</div>
                  <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                    <Link to="/app/ventes/historique" onClick={() => setShowMoreSheet(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-dark-600 touch-feedback">
                      <History className="w-4 h-4 text-gray-500" /> Historique
                    </Link>
                    <Link to="/app/ventes/recus" onClick={() => setShowMoreSheet(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-dark-600 touch-feedback">
                      <FileText className="w-4 h-4 text-gray-500" /> Reçus
                    </Link>
                    <Link to="/app/ventes/rapports" onClick={() => setShowMoreSheet(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-dark-600 touch-feedback">
                      <BarChart3 className="w-4 h-4 text-gray-500" /> Rapports
                    </Link>
                    <Link to="/app/profit" onClick={() => setShowMoreSheet(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-dark-600 touch-feedback">
                      <TrendingUp className="w-4 h-4 text-gray-500" /> Profit
                    </Link>
                    <Link to="/app/fournisseurs" onClick={() => setShowMoreSheet(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-dark-600 touch-feedback">
                      <Truck className="w-4 h-4 text-gray-500" /> Fournisseurs
                    </Link>
                    <Link to="/app/retours" onClick={() => setShowMoreSheet(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-dark-600 touch-feedback">
                      <RotateCcw className="w-4 h-4 text-gray-500" /> Retours
                    </Link>
                  </div>
                </>
              )}

              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Secteurs</div>
              <div className="px-4 pb-2">
                <Link to="/app/finance" onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                  <Landmark className="w-4 h-4 text-emerald-500" /> Finance & Comptabilité
                </Link>
                <Link to="/app/industrie" onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                  <Factory className="w-4 h-4 text-slate-500" /> Industrie & Artisanat
                </Link>
                <Link to="/app/transport" onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                  <Truck className="w-4 h-4 text-teal-500" /> Transport & Logistique
                </Link>
                <Link to="/app/sante" onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                  <Heart className="w-4 h-4 text-rose-500" /> Santé & Pharmacies
                </Link>
                <Link to="/app/education" onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                  <GraduationCap className="w-4 h-4 text-violet-500" /> Éducation & Formation
                </Link>
                <Link to="/app/ong" onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                  <HandHeart className="w-4 h-4 text-amber-500" /> ONG & Associations
                </Link>
              </div>

              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outils</div>
              <div className="px-4 pb-2">
                <Link to="/app/ia" onClick={() => setShowMoreSheet(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                  <BarChart3 className="w-4 h-4 text-brand-500" /> Analyses & Prévisions
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/app/documents" onClick={() => setShowMoreSheet(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                    <ShieldCheck className="w-4 h-4 text-blue-500" /> Documents KYC/KYB
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/app/logiciels" onClick={() => setShowMoreSheet(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                    <Monitor className="w-4 h-4 text-violet-500" /> Logiciels
                  </Link>
                )}
              </div>

              {user?.role === 'admin' && (
                <>
                  <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Administration</div>
                  <div className="px-4 pb-2">
                    <Link to="/app/parametres" onClick={() => setShowMoreSheet(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-dark-700 touch-feedback">
                      <Settings className="w-4 h-4 text-gray-500" /> Paramètres
                    </Link>
                  </div>
                </>
              )}

              <div className="px-4 border-t border-gray-100 dark:border-dark-700 mt-2 pt-3">
                <button onClick={() => { logout(); navigate('/') }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 active:bg-red-50 dark:active:bg-red-900/20 touch-feedback">
                  <LogOut className="w-5 h-5" /> Déconnexion
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Update overlay */}
      {updateProgress && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-8 shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              {updateProgress.percent >= 100
                ? <Loader className="w-8 h-8 text-brand-500 animate-spin" />
                : <Download className="w-8 h-8 text-brand-500" />}
            </div>
            <h3 className="text-lg font-bold dark:text-white mb-2">Mise à jour en cours</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{updateProgress.status}</p>
            {updateProgress.percent < 100 && (
              <>
                <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2.5 mb-2">
                  <div className="bg-brand-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: updateProgress.percent + '%' }} />
                </div>
                <p className="text-xs text-gray-400">{updateProgress.percent}%</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
