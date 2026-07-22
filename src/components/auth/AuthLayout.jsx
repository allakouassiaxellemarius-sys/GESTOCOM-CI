import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const GESTOCOM_LOGO = (
  <div className="flex items-end gap-1 h-7">
    <div className="w-2 h-3 bg-green-300 rounded-sm" />
    <div className="w-2 h-5 bg-orange-300 rounded-sm" />
    <div className="w-2 h-7 bg-green-300 rounded-sm" />
  </div>
)

export default function AuthLayout({ children, backTo, backLabel = 'Retour' }) {
  return (
    <div className="h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm max-h-full overflow-y-auto">
        <div className="text-center mb-5">
          {backTo && (
            <Link to={backTo} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4">
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </Link>
          )}
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-orange-500/30 overflow-hidden">
            {GESTOCOM_LOGO}
          </div>
          <h1 className="text-xl font-bold dark:text-white">GESTOCOM CI</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gestion Commerciale Professionnelle</p>
        </div>
        {children}
      </div>
    </div>
  )
}
