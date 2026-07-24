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
      }
    }
  } catch {}
})()

// Auto-migrate V1 → V2 products if needed
setTimeout(async () => {
  try {
    const { getProductsV2: _gpv2, migrateFromV1 } = await import('./lib/stockDb')
    if (_gpv2().length === 0) {
      const migrated = migrateFromV1()
      if (migrated > 0) console.log(`[Auto-migration] ${migrated} produits V1 migrés vers V2`)
    }
  } catch {}
}, 2000)
