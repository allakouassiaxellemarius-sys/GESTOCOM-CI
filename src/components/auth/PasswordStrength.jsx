import { CheckCircle, AlertTriangle } from 'lucide-react'

export default function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const level = score <= 2 ? 1 : score <= 3 ? 2 : 3
  const colors = { 1: 'bg-red-500', 2: 'bg-amber-500', 3: 'bg-green-500' }
  const labels = { 1: 'Faible', 2: 'Moyen', 3: 'Fort' }
  const textColors = { 1: 'text-red-500', 2: 'text-amber-500', 3: 'text-green-500' }

  const checks = [
    [password.length >= 8, '8 caractères minimum'],
    [/[A-Z]/.test(password), '1 majuscule'],
    [/[0-9]/.test(password), '1 chiffre'],
  ]

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${level >= i ? colors[level] : 'bg-gray-200 dark:bg-dark-600'}`} />
        ))}
      </div>
      <p className={`text-[11px] mt-1 ${textColors[level]}`}>{labels[level]}</p>
      <div className="mt-1 space-y-0">
        {checks.map(([ok, label]) => (
          <div key={label} className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-green-600' : 'text-red-400'}`}>
            {ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {label}
          </div>
        ))}
      </div>
    </div>
  )
}
