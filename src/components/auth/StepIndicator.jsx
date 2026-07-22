import { Check } from 'lucide-react'

export default function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-4 px-4">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < current
        const active = stepNum === current
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div className={`h-0.5 w-8 sm:w-12 transition-colors duration-300 ${done ? 'bg-green-500' : 'bg-gray-200 dark:bg-dark-600'}`} />
            )}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done ? 'bg-green-500 text-white' : active ? 'bg-brand-500 text-white ring-2 ring-brand-200 dark:ring-brand-800' : 'bg-gray-200 dark:bg-dark-600 text-gray-500 dark:text-gray-400'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-brand-600 dark:text-brand-400' : done ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
