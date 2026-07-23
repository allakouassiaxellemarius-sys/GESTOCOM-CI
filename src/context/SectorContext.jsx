import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { getProductsV2, SECTEURS_COMMERCE } from '../lib/stockDb'
import { SECTORS } from '../lib/modules'
import { useAuth } from './AuthContext'

const SectorContext = createContext(null)

export function SectorProvider({ children }) {
  const { user } = useAuth()
  const [settingsTick, setSettingsTick] = useState(0)

  const reloadSettings = useCallback(() => setSettingsTick(t => t + 1), [])

  const activeSector = user?.secteur || 'commerce'

  const isFiltered = true
  const sectorDef = SECTORS[activeSector] || SECTEURS_COMMERCE.find(s => s.id === activeSector) || null
  const isTopSector = !!SECTORS[activeSector]
  const enabledSectors = [activeSector]
  const sectorChosen = true

  const setSector = () => {}

  const productsV2 = useMemo(() => getProductsV2(), [activeSector])

  const sectorProductIds = useMemo(() => {
    return new Set(productsV2.filter(p => p.secteur === activeSector).map(p => p.id))
  }, [productsV2, activeSector])

  const sectorProductNames = useMemo(() => {
    return new Set(productsV2.filter(p => p.secteur === activeSector).map(p => p.nom))
  }, [productsV2, activeSector])

  const filterVentes = (ventes) => {
    return ventes.filter(v =>
      (sectorProductIds && sectorProductIds.has(v.produitId)) ||
      (sectorProductNames && sectorProductNames.has(v.nomProduit))
    )
  }

  const filterMouvements = (mouvements) => {
    return mouvements.filter(m => m.produitSecteur === activeSector)
  }

  const filterAlertes = (alertes) => {
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
