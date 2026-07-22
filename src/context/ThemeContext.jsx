import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [fontScale, setFontScale] = useState(() => {
    try { return parseFloat(localStorage.getItem('gestocom_fontscale')) || 1 } catch { return 1 }
  })
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('gestocom_darkmode') === 'true' } catch { return false }
  })

  useEffect(() => {
    localStorage.setItem('gestocom_fontscale', fontScale)
    document.documentElement.style.fontSize = (fontScale * 16) + 'px'
  }, [fontScale])

  useEffect(() => {
    localStorage.setItem('gestocom_darkmode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <ThemeContext.Provider value={{ fontScale, setFontScale, darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
