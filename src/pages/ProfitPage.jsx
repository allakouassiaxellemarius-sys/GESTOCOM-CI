import { useState, useMemo } from 'react'
import { getBeneficeParJour, getVentes } from '../lib/db'
import { useSector } from '../context/SectorContext'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Download } from 'lucide-react'
import { exportCSV } from '../lib/exportCSV'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function ProfitPage() {
  const [jours, setJours] = useState(30)
  const { isFiltered, filterVentes } = useSector()
  const allData = getBeneficeParJour(jours)
  const filteredVentes = useMemo(() => filterVentes(getVentes()), [isFiltered])
  const data = useMemo(() => {
    if (!isFiltered) return allData
    const venteMap = {}
    filteredVentes.forEach(v => {
      const day = v.dateVente?.slice(0, 10)
      if (!day) return
      if (!venteMap[day]) venteMap[day] = 0
      venteMap[day] += v.total
    })
    return allData.map(d => ({
      ...d,
      ventes: venteMap[d.jour] || 0,
      benefice: (venteMap[d.jour] || 0) - d.depenses,
    }))
  }, [allData, filteredVentes, isFiltered])
  const totalVentes = data.reduce((s, d) => s + d.ventes, 0)
  const totalDepenses = data.reduce((s, d) => s + d.depenses, 0)
  const totalBenefice = totalVentes - totalDepenses
  const maxVal = Math.max(...data.map(d => Math.max(d.ventes, d.depenses)), 1)

  const chartData = {
    labels: data.slice(-30).map(d => new Date(d.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Ventes',
        data: data.slice(-30).map(d => d.ventes),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Dépenses',
        data: data.slice(-30).map(d => d.depenses),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 4,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 }, callback: v => v >= 1000 ? (v/1000).toFixed(0) + 'k' : v } }
    }
  }

  const handleExport = () => {
    exportCSV('profit', ['Date', 'Ventes', 'Dépenses', 'Bénéfice'],
      data.map(d => [d.jour, d.ventes, d.depenses, d.benefice]))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Profit</h1>
        <select value={jours} onChange={e => setJours(+e.target.value)} className="text-sm border border-gray-200 dark:border-dark-600 rounded-lg px-3 py-2 bg-white dark:bg-dark-900 dark:text-gray-100">
          <option value={7}>7 jours</option>
          <option value={15}>15 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
        </select>
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
          <Download className="w-3.5 h-3.5" /> Exporter CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total ventes</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{totalVentes.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total dépenses</p>
          <p className="text-xl font-bold text-red-500 dark:text-red-400">{totalDepenses.toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-100 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bénéfice net</p>
          <p className={`text-xl font-bold ${totalBenefice >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {totalBenefice.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
      </div>

      {/* Graphique en barres */}
      {data.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold dark:text-white">Graphique ventes vs dépenses</h3>
          </div>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-700 border-b dark:border-dark-700">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Ventes</th>
              <th className="px-4 py-3 font-medium">Dépenses</th>
              <th className="px-4 py-3 font-medium">Bénéfice</th>
            </tr>
          </thead>
          <tbody>
            {data.slice().reverse().map(d => (
              <tr key={d.jour} className="border-b border-gray-50 dark:border-dark-700 last:border-0">
                <td className="px-4 py-3 font-medium dark:text-white">{new Date(d.jour).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-green-600 dark:text-green-400">{d.ventes.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-red-500 dark:text-red-400">{d.depenses.toLocaleString('fr-FR')}</td>
                <td className={`px-4 py-3 font-semibold ${d.benefice >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                  {d.benefice.toLocaleString('fr-FR')} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {data.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">Aucune donnée sur cette période</p>}
      </div>
    </div>
  )
}
