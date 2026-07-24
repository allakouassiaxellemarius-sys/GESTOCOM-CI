import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { isFirebaseReady } from '../lib/firebase'
import { pullFromFirestore, restoreDataFromCloud, pushToFirestore, collectAllData } from '../lib/firebaseSync'
import { useNetwork } from './NetworkContext'

const SyncContext = createContext(null)

export function SyncProvider({ children }) {
  const { isOnline, wasOffline, clearWasOffline } = useNetwork()
  const [syncState, setSyncState] = useState({
    syncing: false,
    lastSync: null,
    lastError: null,
    pendingChanges: false,
    syncCount: 0,
  })
  const syncTimerRef = useRef(null)
  const userRef = useRef(null)

  const setSyncUser = useCallback((user) => {
    userRef.current = user
  }, [])

  const pushSync = useCallback(async (user) => {
    const u = user || userRef.current
    if (!u || !isFirebaseReady() || !navigator.onLine) return

    setSyncState(s => ({ ...s, syncing: true, lastError: null }))
    try {
      await pushToFirestore(u.email || u.nom, u.adminId)
      setSyncState(s => ({
        ...s,
        syncing: false,
        lastSync: new Date().toISOString(),
        lastError: null,
        pendingChanges: false,
        syncCount: s.syncCount + 1,
      }))
    } catch (err) {
      setSyncState(s => ({
        ...s,
        syncing: false,
        lastError: err.message || 'Erreur de synchronisation',
        pendingChanges: true,
      }))
    }
  }, [])

  const pullSync = useCallback(async (user) => {
    const u = user || userRef.current
    if (!u || !isFirebaseReady() || !navigator.onLine) return

    setSyncState(s => ({ ...s, syncing: true, lastError: null }))
    try {
      const email = u.email || u.nom
      const cloudData = await pullFromFirestore(email)
      if (cloudData && cloudData.data) {
        restoreDataFromCloud(cloudData)
      }
      setSyncState(s => ({
        ...s,
        syncing: false,
        lastSync: new Date().toISOString(),
        lastError: null,
      }))
    } catch (err) {
      setSyncState(s => ({
        ...s,
        syncing: false,
        lastError: err.message || 'Erreur de synchronisation',
      }))
    }
  }, [])

  const fullSync = useCallback(async (user) => {
    await pullSync(user)
    await pushSync(user)
  }, [pullSync, pushSync])

  const markDirty = useCallback(() => {
    setSyncState(s => ({ ...s, pendingChanges: true }))
  }, [])

  // Auto-sync every 5 minutes when online
  useEffect(() => {
    if (!userRef.current) return
    syncTimerRef.current = setInterval(() => {
      if (navigator.onLine && isFirebaseReady()) {
        pushSync()
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(syncTimerRef.current)
  }, [pushSync])

  // Sync when coming back online after being offline
  useEffect(() => {
    if (wasOffline && isOnline && userRef.current && syncState.pendingChanges) {
      clearWasOffline()
      fullSync()
    }
  }, [wasOffline, isOnline, fullSync, clearWasOffline, syncState.pendingChanges])

  return (
    <SyncContext.Provider value={{ ...syncState, pushSync, pullSync, fullSync, markDirty, setSyncUser }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}
