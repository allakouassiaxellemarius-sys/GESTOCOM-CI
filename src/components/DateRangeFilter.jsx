import { useState, useMemo } from 'react'

const PRESETS = [
  { key: 'all', label: 'Tout' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: '7 jours' },
  { key: 'month', label: '30 jours' },
  { key: 'quarter', label: '90 jours' },
]

export function useDateFilter(defaultKey = 'all') {
  const [dateKey, setDateKey] = useState(defaultKey)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const filterDate = (itemDate) => {
    const d = new Date(itemDate)
    const now = new Date()
    if (dateKey === 'today') return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10)
    if (dateKey === 'week') { const ago = new Date(); ago.setDate(ago.getDate() - 7); return d >= ago }
    if (dateKey === 'month') { const ago = new Date(); ago.setDate(ago.getDate() - 30); return d >= ago }
    if (dateKey === 'quarter') { const ago = new Date(); ago.setDate(ago.getDate() - 90); return d >= ago }
    if (dateKey === 'custom' && customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      end.setHours(23, 59, 59)
      return d >= start && d <= end
    }
    return true
  }

  const dateKeyOptions = PRESETS

  return { dateKey, setDateKey, customStart, setCustomStart, customEnd, setCustomEnd, filterDate, dateKeyOptions }
}

export default function DateRangeFilter({ dateKey, setDateKey, customStart, setCustomStart, customEnd, setCustomEnd, options }) {
  const presets = options || PRESETS
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
        {presets.map(f => (
          <button key={f.key} onClick={() => setDateKey(f.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dateKey === f.key ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {f.label}
          </button>
        ))}
        <button onClick={() => setDateKey('custom')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dateKey === 'custom' ? 'bg-white dark:bg-dark-800 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
          Personnalisé
        </button>
      </div>
      {dateKey === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-700 dark:text-white" />
          <span className="text-xs text-gray-400">→</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-700 dark:text-white" />
        </div>
      )}
    </div>
  )
}
