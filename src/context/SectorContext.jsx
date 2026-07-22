import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { getProductsV2, SECTEURS_COMMERCE } from '../lib/stockDb'
import { getCompanySettings } from '../lib/db'
import { SECTORS } from '../lib/modules'
import { useAuth } from './AuthContext'

const SectorContext = createContext(null)

function readEnabledSectors() {
  const settings = getCompanySettings()
  return settings.enabledSectors || ['commerce']
}

export function SectorProvider({ children }) {
  const { user } = useAuth()
  const [activeSector, setActiveSector] = useState(() => {
    try { return localStorage.getItem('gestocom_active_sector') || 'all' } catch { return 'all' }
  })
  const [sectorChosen, setSectorChosen] = useState(() => {
    try { return localStorage.getItem('gestocom_active_sector') != null } catch { return false }
  })
  const [settingsTick, setSettingsTick] = useState(0)

  const reloadSettings = useCallback(() => setSettingsTick(t => t + 1), [])

  const setSector = (sector) => {
    setActiveSector(sector)
    setSectorChosen(true)
    try { localStorage.setItem('gestocom_active_sector', sector) } catch {}
  }

  const isFiltered = activeSector !== 'all'
  const sectorDef = isFiltered ? (SECTORS[activeSector] || SECTEURS_COMMERCE.find(s => s.id === activeSector)) : null
  const isTopSector = isFiltered && !!SECTORS[activeSector]

  const enabledSectors = useMemo(() => readEnabledSectors(), [user, settingsTick])

  const productsV2 = useMemo(() => getProductsV2(), [activeSector])

  const sectorProductIds = useMemo(() => {
    if (!isFiltered) return null
    return new Set(productsV2.filter(p => p.secteur === activeSector).map(p => p.id))
  }, [productsV2, activeSector, isFiltered])

  const sectorProductNames = useMemo(() => {
    if (!isFiltered) return null
    return new Set(productsV2.filter(p => p.secteur === activeSector).map(p => p.nom))
  }, [productsV2, activeSector, isFiltered])

  const filterVentes = (ventes) => {
    if (!isFiltered) return ventes
    return ventes.filter(v =>
      (sectorProductIds && sectorProductIds.has(v.produitId)) ||
      (sectorProductNames && sectorProductNames.has(v.nomProduit))
    )
  }

  const filterMouvements = (mouvements) => {
    if (!isFiltered) return mouvements
    return mouvements.filter(m => m.produitSecteur === activeSector)
  }

  const filterAlertes = (alertes) => {
    if (!isFiltered) return alertes
    return alertes.filter(a => a.secteur === activeSector)
  }

  const value = {
    activeSector, setSector, isFiltered, sectorDef, isTopSector, enabledSectors, sectorChosen,
    filterVentes, filterMouvements, filterAlertes,
    productsV2, sectorProductIds, sectorProductNames,
    reloadSettings,
  }

  return (
    <SectorContext.Provider value={value}>
      {children}
    </SectorContext.Provider>
  )
}

export const useSector = () => useContext(SectorContext)
