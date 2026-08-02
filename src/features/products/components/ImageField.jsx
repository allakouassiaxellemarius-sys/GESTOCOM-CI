// Composant : upload d'image produit (base64, max 2 Mo).

import { useRef } from 'react'
import { Upload, X } from 'lucide-react'

const MAX_SIZE = 2 * 1024 * 1024

export default function ImageField({ value, onChange }) {
  const inputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_SIZE) { alert('Image trop lourde (max 2 Mo)'); return }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div>
      {value ? (
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-600">
          <img src={value} alt="Produit" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange('')} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full h-28 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
          <Upload className="w-5 h-5" /><span className="text-xs">Image</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}
