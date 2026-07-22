import { useState, forwardRef } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

const PasswordInput = forwardRef(({ value, onChange, placeholder, disabled, className = '', onKeyDown }, ref) => {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <Lock className="w-4 h-4" />
      </div>
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder || '••••••••'}
        className={`w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white disabled:opacity-50 transition-all ${className}`}
        required
      />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" disabled={disabled}>
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
})

PasswordInput.displayName = 'PasswordInput'
export default PasswordInput
