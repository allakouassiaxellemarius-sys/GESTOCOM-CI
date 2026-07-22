import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DeviceContext = createContext(null)

function detectDevice() {
  const w = window.innerWidth
  const h = window.innerHeight
  const isLandscape = w > h
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallDevice = w < 1024
  const isMobileWidth = w < 640
  const isTabletWidth = w >= 640 && w < 1024
  const isDesktopWidth = w >= 1024
  const isSmallScreen = w < 768

  const isMobile = isMobileWidth && !isLandscape
  const isLandscapeMode = isLandscape && isSmallDevice

  return {
    isMobile,
    isTablet: isTabletWidth,
    isDesktop: isDesktopWidth,
    isSmallScreen,
    isLandscape: isLandscapeMode,
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
    let mq
    try { mq = window.matchMedia('(orientation: landscape)') } catch {}
    const onResize = () => { clearTimeout(onResize._t); onResize._t = setTimeout(update, 80) }
    const onOrient = () => { clearTimeout(onOrient._t); onOrient._t = setTimeout(update, 200) }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onOrient)
    if (mq) mq.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onOrient)
      if (mq) mq.removeEventListener('change', update)
    }
  }, [update])

  return (
    <DeviceContext.Provider value={device}>
      {children}
    </DeviceContext.Provider>
  )
}

export const useDevice = () => useContext(DeviceContext)
