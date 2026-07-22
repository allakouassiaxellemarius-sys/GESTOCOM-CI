import { CheckCircle } from 'lucide-react'

export default function SuccessScreen({ title, subtitle, onRedirect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-brand-900/20 dark:via-dark-800 dark:to-gold-900/20 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-dark-700 text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold mb-2 dark:text-white">{title || 'Succès !'}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{subtitle || 'Opération effectuée avec succès.'}</p>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
