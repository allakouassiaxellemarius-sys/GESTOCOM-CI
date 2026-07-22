import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

export default function SearchDropdown({ options, value, onChange, placeholder = 'Rechercher...', labelKey = 'label', subKey = 'sub', iconKey = 'icon', renderOption, disabled = false, multiple = false, onClear }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const filtered = options.filter(o => {
    const label = (o[labelKey] || '').toLowerCase()
    const sub = (o[subKey] || '').toLowerCase()
    return label.includes(search.toLowerCase()) || sub.includes(search.toLowerCase())
  })

  const getLabel = (o) => o[labelKey] || o.label || ''
  const getSub = (o) => o[subKey] || o.sub || ''
  const getIcon = (o) => o[iconKey] || o.icon || null

  const selected = multiple
    ? options.filter(o => (value || []).includes(o.id))
    : options.find(o => o.id === value)

  const handleSelect = (o) => {
    if (multiple) {
      const current = value || []
      const next = current.includes(o.id) ? current.filter(id => id !== o.id) : [...current, o.id]
      onChange(next)
    } else {
      onChange(o.id)
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-sm text-left transition-colors ${
          disabled ? 'bg-gray-50 dark:bg-dark-800 text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-dark-800 hover:border-gray-300 dark:hover:border-dark-500 focus:outline-none focus:ring-1 focus:ring-brand-300'
        } ${open ? 'ring-1 ring-brand-300 border-brand-300' : 'border-gray-200 dark:border-dark-600'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {multiple ? (
            selected && selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selected.map(o => (
                  <span key={o.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-xs">
                    {getLabel(o)}
                    <button onClick={(e) => { e.stopPropagation(); handleSelect(o) }} className="hover:text-brand-900 dark:hover:text-brand-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )
          ) : (
            selected ? (
              <span className="flex items-center gap-2">
                {getIcon(selected) && <span className="text-base">{getIcon(selected)}</span>}
                <span className="font-medium dark:text-white">{getLabel(selected)}</span>
                {getSub(selected) && <span className="text-gray-400 text-xs">— {getSub(selected)}</span>}
              </span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {!multiple && selected && onClear && (
            <button onClick={(e) => { e.stopPropagation(); onClear() }} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-dark-700">
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b dark:border-dark-600">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tapez pour filtrer..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border-0 bg-gray-50 dark:bg-dark-900 dark:text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-200"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-400">Aucun résultat</div>
            ) : (
              filtered.map(o => {
                const isSelected = multiple ? (value || []).includes(o.id) : value === o.id
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleSelect(o)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors ${isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}
                  >
                    {getIcon(o) && <span className="text-lg w-6 text-center">{getIcon(o)}</span>}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-200'}`}>{getLabel(o)}</div>
                      {getSub(o) && <div className="text-xs text-gray-400 truncate">{getSub(o)}</div>}
                    </div>
                    {renderOption && renderOption(o)}
                    {isSelected && <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
