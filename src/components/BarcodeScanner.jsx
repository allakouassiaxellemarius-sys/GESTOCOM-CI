import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X, AlertCircle } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    let scanner = null
    const start = async () => {
      try {
        scanner = new Html5Qrcode('barcode-reader')
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 5, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
          (decodedText) => {
            onScan(decodedText)
            stopScanner()
          },
          () => {}
        )
        setScanning(true)
      } catch (err) {
        setError('Caméra non disponible ou permission refusée. Vous pouvez entrer le code manuellement.')
      }
    }
    start()
    return () => stopScanner()
  }, [])

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-dark-600">
          <h3 className="font-semibold flex items-center gap-2 dark:text-white">
            <Camera className="w-5 h-5 text-brand-500" /> Scanner un code-barres
          </h3>
          <button onClick={() => { stopScanner(); onClose() }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <ManualInput onSubmit={(val) => { onScan(val); onClose() }} />
            </div>
          ) : (
            <>
              <div id="barcode-reader" ref={containerRef} className="rounded-xl overflow-hidden mb-4" />
              {scanning && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400 mb-3">
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                    En attente du scan...
                  </div>
                  <ManualInput onSubmit={(val) => { onScan(val); onClose() }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ManualInput({ onSubmit }) {
  const [val, setVal] = useState('')
  return (
    <div className="flex gap-2 max-w-xs mx-auto">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val && onSubmit(val)}
        placeholder="Saisir le code..."
        className="flex-1 px-3 py-2 border dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-200"
        autoFocus
      />
      <button onClick={() => val && onSubmit(val)} className="btn-primary text-sm py-2 px-4" disabled={!val}>
        OK
      </button>
    </div>
  )
}
