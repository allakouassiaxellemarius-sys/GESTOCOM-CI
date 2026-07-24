import { useState, useEffect } from 'react'
import { useNetwork } from '../context/NetworkContext'
import { useSync } from '../context/SyncContext'
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle, Cloud } from 'lucide-react'

export default function SyncStatusBar() {
  const { isOnline } = useNetwork()
  const { syncing, lastSync, lastError, pendingChanges, syncCount } = useSync()
  const [showDetails, setShowDetails] = useState(false)
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!lastSync) return
    const update = () => {
      const diff = Date.now() - new Date(lastSync).getTime()
      if (diff < 60000) setTimeAgo('à l\'instant')
      else if (diff < 3600000) setTimeAgo(`il y a ${Math.floor(diff / 60000)} min`)
      else setTimeAgo(`il y a ${Math.floor(diff / 3600000)}h`)
    }
    update()
    const i = setInterval(update, 30000)
    return () => clearInterval(i)
  }, [lastSync])

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs">
        <WifiOff className="w-3 h-3" />
        <span>Hors ligne</span>
      </div>
    )
  }

  if (syncing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Sync...</span>
      </div>
    )
  }

  if (lastError) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
        <AlertCircle className="w-3 h-3" />
        <span>Erreur sync</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs">
      <Cloud className="w-3 h-3" />
      <span>{lastSync ? timeAgo : 'Non synchronisé'}</span>
      {pendingChanges && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
    </div>
  )
}
