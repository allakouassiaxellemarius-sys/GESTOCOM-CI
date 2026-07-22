import { AlertTriangle } from 'lucide-react'

export default function AuthError({ message }) {
  if (!message) return null
  return (
    <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2.5 rounded-lg mb-4 flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  )
}
