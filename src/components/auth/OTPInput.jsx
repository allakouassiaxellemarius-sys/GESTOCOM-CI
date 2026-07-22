import { useEffect, useRef } from 'react'

export default function OTPInput({ value, onChange, autoFocus = true, onSubmit }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus()
  }, [autoFocus])

  useEffect(() => {
    if (value.length === 6 && onSubmit) {
      const timer = setTimeout(onSubmit, 250)
      return () => clearTimeout(timer)
    }
  }, [value, onSubmit])

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      onPaste={e => {
        const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
        if (text) onChange(text)
      }}
      placeholder="000000"
      maxLength={6}
      className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg text-2xl font-mono text-center tracking-[0.5em] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white transition-all"
    />
  )
}
