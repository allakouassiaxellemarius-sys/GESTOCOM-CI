import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Init Firebase in background
import { initFirebase } from './lib/firebase'
initFirebase()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// Init SQLite in background (non-blocking)
(async () => {
  try {
    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()
    if (platform !== 'electron' && platform !== 'web') {
      const sqlDb = await import('./lib/sqlDb.js')
      const { loadSqliteCache, setSqliteModule } = await import('./lib/db.js')
      setSqliteModule(sqlDb)
      const ok = await sqlDb.initSQLite()
      if (ok) {
        await sqlDb.migrateLocalStorage()
        await loadSqliteCache(sqlDb)
        console.log('[App] SQLite ready on', platform)
      }
    }
  } catch (e) {
    console.warn('[App] SQLite not available, using localStorage:', e.message)
  }
})()
