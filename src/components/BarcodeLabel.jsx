import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'
import { Printer, Download } from 'lucide-react'

export function BarcodeValue({ value, width = 1.5, height = 40, fontSize = 12 }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width,
        height,
        fontSize,
        displayValue: true,
        margin: 4,
        background: 'transparent',
        lineColor: '#1a1a1a',
      })
    }
  }, [value, width, height, fontSize])

  return <svg ref={svgRef} />
}

export function BarcodeLabel({ barcode, nom, prix, showPrint = true }) {
  const printRef = useRef(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=400,height=300')
    win.document.write(`
      <html><head><title>Étiquette - ${nom}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 10px; margin: 0; }
        .name { font-size: 14px; font-weight: bold; margin: 4px 0; }
        .price { font-size: 12px; color: #333; margin: 2px 0; }
        svg { max-width: 100%; }
      </style></head><body>
      ${content.innerHTML}
      <script>setTimeout(() => { window.print(); window.close(); }, 300);</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div className="inline-flex flex-col items-center">
      <div ref={printRef} className="bg-white p-3 border border-gray-200 rounded-lg">
        <div className="name">{nom}</div>
        <BarcodeValue value={barcode} width={1.2} height={35} fontSize={10} />
        {prix && <div className="price">{prix.toLocaleString('fr-FR')} FCFA</div>}
      </div>
      {showPrint && (
        <button onClick={handlePrint} className="mt-2 text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
          <Printer className="w-3 h-3" /> Imprimer
        </button>
      )}
    </div>
  )
}

export function BarcodeSheet({ products }) {
  const printRef = useRef(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=800,height=600')
    win.document.write(`
      <html><head><title>Étiquettes - GESTOCOM CI</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .sheet { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
        .label { text-align: center; border: 1px solid #ddd; padding: 8px; border-radius: 6px; width: 180px; }
        .name { font-size: 12px; font-weight: bold; margin: 2px 0; }
        .price { font-size: 10px; color: #555; }
        svg { max-width: 100%; }
      </style></head><body>
      <h2 style="text-align:center">Étiquettes - ${new Date().toLocaleDateString('fr-FR')}</h2>
      ${content.innerHTML}
      <script>setTimeout(() => { window.print(); window.close(); }, 300);</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div>
      <div ref={printRef} className="sheet">
        {products.map(p => (
          <div key={p.id} className="label">
            <div className="name">{p.nom}</div>
            <BarcodeValue value={p.barcode || String(p.id).padStart(8, '0')} width={1} height={30} fontSize={9} />
            <div className="price">{(p.prixVente || p.prixUnite || 0).toLocaleString('fr-FR')} FCFA</div>
          </div>
        ))}
      </div>
      {products.length > 0 && (
        <div className="text-center mt-4">
          <button onClick={handlePrint} className="btn-primary text-sm py-2 px-6 inline-flex items-center gap-2">
            <Printer className="w-4 h-4" /> Imprimer toutes les étiquettes
          </button>
        </div>
      )}
    </div>
  )
}
