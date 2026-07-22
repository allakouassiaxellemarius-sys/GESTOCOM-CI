import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DeviceContext = createContext(null)

function detectDevice() {
  const w = window.innerWidth
  const h = window.innerHeight
  const isLandscape = w > h
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isMobileWidth = w < 640
  const isTabletWidth = w >= 640 && w < 1024
  const isDesktopWidth = w >= 1024
  const isSmallScreen = w < 768
  const isShortScreen = h < 500

  return {
    isMobile: isMobileWidth,
    isTablet: isTabletWidth,
    isDesktop: isDesktopWidth,
    isSmallScreen,
    isLandscape: isLandscape && isShortScreen,
    isTouch,
    width: w,
    height: h,
    orientation: isLandscape ? 'landscape' : 'portrait',
  }
}

export function DeviceProvider({ children }) {
  const [device, setDevice] = useState(detectDevice)

  const update = useCallback(() => setDevice(detectDevice()), [])

  useEffect(() => {
    update()
    const mq = window.matchMedia('(orientation: orientation)')
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    mq.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      mq.removeEventListener('change', update)
    }
  }, [update])

  return (
    <DeviceContext.Provider value={device}>
      {children}
    </DeviceContext.Provider>
  )
}

export const useDevice = () => useContext(DeviceContext)
