// src/lib/ai.js — Moteur d'analyses GESTOCOM CI v2.0
// Statistiques avancées, prévisions, CLV, Churn, optimisation prix, alertes proactives

import { getProducts, getVentes, getReceipts, getDepenses, getUsers, getCompanySettings, getFournisseurs } from './db'

// ═══════════════════════════════════════════════════════
// UTILS MATHÉMATIQUES
// ═══════════════════════════════════════════════════════

function sma(data, window) {
  if (data.length < window) return data.length ? data.reduce((a, b) => a + b, 0) / data.length : 0
  return data.slice(-window).reduce((a, b) => a + b, 0) / window
}

function ema(data, alpha = 0.3) {
  if (!data.length) return 0
  let result = data[0]
  for (let i = 1; i < data.length; i++) result = alpha * data[i] + (1 - alpha) * result
  return result
}

// Triple Exponential Smoothing (Holt-Winters Additive)
function holtWinters(data, seasonLength = 7, alpha = 0.3, beta = 0.1, gamma = 0.1, forecastLength = 7) {
  if (data.length < seasonLength * 2) {
    const val = ema(data, alpha)
    return { forecast: Array(forecastLength).fill(Math.round(val)), confidence: Math.min(0.4, data.length * 0.05), method: 'ema' }
  }
  const n = data.length
  const level = [0]; const trend = [0]; const seasonal = new Array(n).fill(0)

  // Initial level = average of first season
  level[0] = data.slice(0, seasonLength).reduce((a, b) => a + b, 0) / seasonLength
  // Initial trend
  trend[0] = (data.slice(seasonLength, seasonLength * 2).reduce((a, b) => a + b, 0) / seasonLength - level[0]) / seasonLength
  // Initial seasonal indices
  for (let i = 0; i < seasonLength; i++) seasonal[i] = data[i] - level[0]

  for (let t = 1; t < n; t++) {
    const s = t < seasonLength ? 0 : t - seasonLength
    level[t] = alpha * (data[t] - seasonal[s]) + (1 - alpha) * (level[t - 1] + trend[t - 1])
    trend[t] = beta * (level[t] - level[t - 1]) + (1 - beta) * trend[t - 1]
    seasonal[t] = gamma * (data[t] - level[t]) + (1 - gamma) * seasonal[s]
  }

  const forecast = []
  for (let h = 1; h <= forecastLength; h++) {
    const sIdx = n - seasonLength + ((h - 1) % seasonLength)
    forecast.push(Math.max(0, Math.round(level[n - 1] + h * trend[n - 1] + seasonal[sIdx])))
  }

  // Confidence interval
  const residuals = data.map((v, i) => v - (level[i] + trend[i] + seasonal[i]))
  const rmse = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n)
  const confidence = Math.min(0.95, 0.5 + (n / 100) * 0.45)

  return { forecast, rmse: Math.round(rmse), confidence, method: 'holt-winters', alpha, beta, gamma }
}

// Confidence interval
function confidenceInterval(prediction, rmse, confidence = 0.95) {
  const z = confidence >= 0.95 ? 1.96 : confidence >= 0.90 ? 1.645 : 1.28
  return {
    lower: Math.max(0, Math.round(prediction - z * rmse)),
    upper: Math.round(prediction + z * rmse),
    margin: Math.round(z * rmse),
  }
}

// Linear regression
function linearRegression(values) {
  const n = values.length
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 }
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0, ssRes = 0, ssTot = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean)
    den += (i - xMean) ** 2
    ssTot += (values[i] - yMean) ** 2
  }
  const slope = den !== 0 ? num / den : 0
  const intercept = yMean - slope * xMean
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i
    ssRes += (values[i] - predicted) ** 2
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0
  return { slope, intercept, r2: Math.max(0, r2) }
}

// Stats de base
function stats(arr) {
  if (!arr.length) return { mean: 0, stdDev: 0, median: 0, q1: 0, q3: 0, min: 0, max: 0 }
  const sorted = [...arr].sort((a, b) => a - b)
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length
  const stdDev = Math.sqrt(variance)
  const median = sorted[Math.floor(sorted.length / 2)]
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  return { mean, stdDev, median, q1, q3, min: sorted[0], max: sorted[sorted.length - 1] }
}

function zScore(value, mean, stdDev) { return stdDev === 0 ? 0 : (value - mean) / stdDev }

// ═══════════════════════════════════════════════════════
// 1. PRÉDICTIONS DE VENTES (Holt-Winters + Confiance)
// ═══════════════════════════════════════════════════════

function dailySalesToValues(ventes, key = 'total') {
  const map = {}
  ventes.forEach(v => {
    const j = v.dateVente.slice(0, 10)
    map[j] = (map[j] || 0) + (key === 'total' ? v.total : v.quantite)
  })
  const sorted = Object.entries(map).sort()
  return { values: sorted.map(([, v]) => v), dates: sorted.map(([d]) => d) }
}

export function predictProductDemand(produitId, jours = 7) {
  const ventes = getVentes().filter(v => v.produitId === produitId)
  if (ventes.length === 0) return { prediction: 0, confidence: 0, trend: 'stable', jourSeuil: null, forecast: [], intervals: [] }

  const { values } = dailySalesToValues(ventes, 'quantite')
  const hw = holtWinters(values, 7, 0.3, 0.1, 0.1, jours)
  const totalPrediction = hw.forecast.reduce((a, b) => a + b, 0)
  const trend = detectTrend(values)

  // Confidence intervals per day
  const intervals = hw.forecast.map(v => confidenceInterval(v, hw.rmse || 1, hw.confidence))

  // Best day analysis
  const byDay = analyzeDayOfWeek(ventes)
  const bestDay = [...byDay].sort((a, b) => b.nbVentes - a.nbVentes)[0]

  // Days of stock remaining
  const product = getProducts().find(p => p.id === produitId)
  const avgDaily = values.length ? values.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, values.length) : 0
  const daysOfStock = product && avgDaily > 0 ? Math.round(product.stockActuel / avgDaily) : Infinity

  return {
    prediction: totalPrediction,
    dailyForecast: hw.forecast,
    intervals,
    confidence: hw.confidence,
    method: hw.method,
    trend: trend.direction,
    slope: trend.slope,
    bestDay: bestDay?.jour,
    daysOfStock,
    avgDaily: Math.round(avgDaily * 10) / 10,
    nbDataPoints: ventes.length,
    rmse: hw.rmse,
  }
}

export function predictGlobalSales(jours = 7) {
  const ventes = getVentes()
  if (ventes.length < 3) return { prediction: 0, trend: 'stable', confidence: 0, forecast: [], intervals: [] }

  const { values } = dailySalesToValues(ventes)
  const hw = holtWinters(values, 7, 0.3, 0.1, 0.1, jours)
  const totalPrediction = hw.forecast.reduce((a, b) => a + b, 0)
  const trend = detectTrend(values)
  const avgDaily = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0

  const intervals = hw.forecast.map(v => confidenceInterval(v, hw.rmse || 1, hw.confidence))

  // Decompose trend + seasonality
  const weeklyPattern = detectWeeklyPattern(ventes)

  return {
    prediction: totalPrediction,
    dailyForecast: hw.forecast,
    intervals,
    avgDaily: Math.round(avgDaily),
    trend: trend.direction,
    slope: trend.slope,
    confidence: hw.confidence,
    method: hw.method,
    joursAnalyse: values.length,
    rmse: hw.rmse,
    weeklyPattern,
  }
}

export function predictMonthlyRevenue() {
  const ventes = getVentes()
  if (ventes.length < 5) return { prediction: 0, confidence: 0 }

  const byMonth = {}
  ventes.forEach(v => { const m = v.dateVente.slice(0, 7); byMonth[m] = (byMonth[m] || 0) + v.total })
  const values = Object.values(byMonth).sort((a, b) => a - b)

  if (values.length < 2) return { prediction: values[0] || 0, confidence: 0.3, growthRate: 0, avgMonthly: values[0] || 0 }

  // Use exponential smoothing on monthly data
  const hw = holtWinters(values, Math.min(6, values.length), 0.4, 0.2, 0.1, 1)
  const predicted = hw.forecast[0] || values[values.length - 1]

  const lastMonth = values[values.length - 1]
  const prevMonth = values[values.length - 2]
  const growthRate = prevMonth > 0 ? (lastMonth - prevMonth) / prevMonth : 0
  const avgMonthly = values.reduce((a, b) => a + b, 0) / values.length

  // Trend line regression
  const reg = linearRegression(values)

  return {
    prediction: Math.round(predicted),
    lastMonth,
    growthRate: (growthRate * 100).toFixed(1),
    avgMonthly: Math.round(avgMonthly),
    confidence: Math.min(0.95, hw.confidence),
    method: hw.method,
    regression: { slope: Math.round(reg.slope), r2: reg.r2 },
    trendDirection: reg.slope > 100 ? 'croissance' : reg.slope < -100 ? 'décroissance' : 'stable',
  }
}

// Détection pattern hebdomadaire
function detectWeeklyPattern(ventes) {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const byDay = Array(7).fill(0)
  const countDay = Array(7).fill(0)

  ventes.forEach(v => {
    const d = new Date(v.dateVente).getDay()
    byDay[d] += v.total
    countDay[d]++
  })

  const avgPerDay = byDay.map((t, i) => countDay[i] > 0 ? Math.round(t / countDay[i]) : 0)
  const overallAvg = avgPerDay.reduce((a, b) => a + b, 0) / 7 || 1

  return days.map((name, i) => ({
    jour: name,
    caMoyen: avgPerDay[i],
    ratio: Math.round((avgPerDay[i] / overallAvg) * 100) / 100,
    isPeak: avgPerDay[i] > overallAvg * 1.15,
    isLow: avgPerDay[i] < overallAvg * 0.85,
  }))
}

// Analyse saisonnière par jour de la semaine
function analyzeDayOfWeek(ventes) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const byDay = Array(7).fill(null).map(() => ({ count: 0, total: 0 }))

  ventes.forEach(v => {
    const dayIdx = new Date(v.dateVente).getDay()
    byDay[dayIdx].count++
    byDay[dayIdx].total += v.total
  })

  return days.map((name, i) => ({
    jour: name,
    nbVentes: byDay[i].count,
    caTotal: byDay[i].total,
    panierMoyen: byDay[i].count > 0 ? Math.round(byDay[i].total / byDay[i].count) : 0,
  }))
}

// Tendance par régression linéaire
function detectTrend(values) {
  if (values.length < 3) return { direction: 'stable', slope: 0, confidence: 0 }
  const reg = linearRegression(values)
  const yMean = values.reduce((a, b) => a + b, 0) / values.length
  const normalizedSlope = yMean > 0 ? reg.slope / yMean : 0
  const direction = normalizedSlope > 0.02 ? 'hausse' : normalizedSlope < -0.02 ? 'baisse' : 'stable'
  const confidence = Math.min(1, reg.r2 * 1.5)
  return { direction, slope: normalizedSlope, confidence, r2: reg.r2 }
}

// Produits les plus demandés (30j vs 7j)
export function getMostDemandedProducts(limit = 10) {
  const ventes = getVentes()
  const produits = getProducts()
  const now = new Date()
  const last30j = new Date(now - 30 * 86400000)
  const last7j = new Date(now - 7 * 86400000)

  const recentVentes = ventes.filter(v => new Date(v.dateVente) >= last30j)
  const weekVentes = ventes.filter(v => new Date(v.dateVente) >= last7j)

  const stats = {}
  produits.forEach(p => {
    stats[p.id] = {
      produit: p,
      totalVentes30j: 0, unites30j: 0, ca30j: 0,
      totalVentes7j: 0, unites7j: 0, ca7j: 0,
      tendance: 'stable', tendanceRatio: 1,
    }
  })

  recentVentes.forEach(v => { if (!stats[v.produitId]) return; stats[v.produitId].totalVentes30j++; stats[v.produitId].unites30j += v.quantite; stats[v.produitId].ca30j += v.total })
  weekVentes.forEach(v => { if (!stats[v.produitId]) return; stats[v.produitId].totalVentes7j++; stats[v.produitId].unites7j += v.quantite; stats[v.produitId].ca7j += v.total })

  Object.values(stats).forEach(s => {
    const weekRate = s.totalVentes7j / 7
    const monthRate = s.totalVentes30j / 30
    if (monthRate === 0) { s.tendance = s.totalVentes7j > 0 ? 'nouveau' : 'inactif'; return }
    const ratio = weekRate / monthRate
    s.tendanceRatio = ratio
    s.tendance = ratio > 1.2 ? 'en Hausse' : ratio < 0.8 ? 'en Baisse' : 'Stable'
    // Velocity (unités/jour)
    s.velocity7j = Math.round(s.unites7j / 7 * 10) / 10
    s.velocity30j = Math.round(s.unites30j / 30 * 10) / 10
  })

  return Object.values(stats)
    .filter(s => s.unites30j > 0)
    .sort((a, b) => b.ca30j - a.ca30j)
    .slice(0, limit)
}

export function getTrendingProducts() {
  return getMostDemandedProducts(20)
    .filter(p => p.tendance === 'en Hausse' || p.tendanceRatio > 1.1)
    .slice(0, 5)
}

// ═══════════════════════════════════════════════════════
// 2. GESTION DU STOCK — Anticipation & Réapprovisionnement
// ═══════════════════════════════════════════════════════

export function getDaysOfStock(produitId) {
  const ventes = getVentes().filter(v => v.produitId === produitId)
  const product = getProducts().find(p => p.id === produitId)
  if (!product || ventes.length === 0) return Infinity
  const last30j = new Date(Date.now() - 30 * 86400000)
  const recentVentes = ventes.filter(v => new Date(v.dateVente) >= last30j)
  if (recentVentes.length === 0) return Infinity
  const avgDaily = recentVentes.reduce((s, v) => s + v.quantite, 0) / 30
  return avgDaily > 0 ? Math.round(product.stockActuel / avgDaily) : Infinity
}

export function predictStockout() {
  const products = getProducts()
  const alerts = []

  products.forEach(p => {
    const days = getDaysOfStock(p.id)
    const prediction = predictProductDemand(p.id, 7)

    let severity = 'ok'
    if (days <= 2) severity = 'critique'
    else if (days <= 5) severity = 'attention'
    else if (days <= 10) severity = 'alerte'

    const besoinReappro = (days !== Infinity && days <= 30) ? Math.max(0, prediction.prediction - p.stockActuel) : 0

    // Stock value at risk
    const stockValue = p.stockActuel * (p.prixUnite || 0)

    alerts.push({
      produit: p,
      joursRestants: days,
      severity,
      stockActuel: p.stockActuel,
      seuilAlerte: p.seuilAlerte,
      demandePrevue7j: prediction.prediction,
      besoinReappro,
      tendance: prediction.trend,
      avgDaily: prediction.avgDaily,
      stockValue: Math.round(stockValue),
      forecast: prediction.dailyForecast,
      intervals: prediction.intervals,
    })
  })

  return alerts
    .filter(a => a.severity !== 'ok' || a.besoinReappro > 0)
    .sort((a, b) => a.joursRestants - b.joursRestants)
}

export function analyzeABC() {
  const products = getProducts()
  const ventes = getVentes()
  const last30j = new Date(Date.now() - 30 * 86400000)
  const caByProduct = {}
  ventes.filter(v => new Date(v.dateVente) >= last30j).forEach(v => { caByProduct[v.produitId] = (caByProduct[v.produitId] || 0) + v.total })

  const items = products.map(p => ({
    produit: p,
    ca: caByProduct[p.id] || 0,
  })).sort((a, b) => b.ca - a.ca)

  const totalCA = items.reduce((s, i) => s + i.ca, 0)
  let cumul = 0

  return items.map(item => {
    cumul += item.ca
    const cumulPct = totalCA > 0 ? (cumul / totalCA) * 100 : 0
    const classe = cumulPct <= 80 ? 'A' : cumulPct <= 95 ? 'B' : 'C'
    return { ...item, cumulPct, classe }
  })
}

export function getAutoReorderSuggestions() {
  const alerts = predictStockout()
  const abc = analyzeABC()

  return alerts.map(a => {
    const abcClass = abc.find(x => x.produit.id === a.produit.id)
    const classe = abcClass?.classe || 'C'
    const priority = classe === 'A' ? 1 : classe === 'B' ? 2 : 3
    const qteRecommandee = classe === 'A'
      ? Math.max(a.besoinReappro, a.produit.nbUnitesParCasier * 4)
      : classe === 'B'
        ? Math.max(a.besoinReappro, a.produit.nbUnitesParCasier * 2)
        : Math.max(a.besoinReappro, a.produit.nbUnitesParCasier)

    return {
      ...a,
      classe,
      priority,
      casiersRecommandes: Math.ceil(qteRecommandee / a.produit.nbUnitesParCasier),
      qteRecommandee,
      urgence: a.severity === 'critique' ? 'Immédiate' : a.severity === 'attention' ? 'Sous 3 jours' : 'Sous 7 jours',
      coutEstime: Math.round(qteRecommandee * (a.produit.prixUnite || 0)),
    }
  }).sort((a, b) => a.priority - b.priority || a.joursRestants - b.joursRestants)
}

// ═══════════════════════════════════════════════════════
// 3. CLIENTS — CLV, Churn, RFM, Cross-Selling
// ═══════════════════════════════════════════════════════

function buildClientProfiles() {
  const receipts = getReceipts()
  const profiles = {}

  receipts.forEach(r => {
    const key = r.telephone || r.client || `anonyme_${r.id}`
    if (!profiles[key]) {
      profiles[key] = {
        nom: r.client || 'Client anonyme',
        telephone: r.telephone || null,
        fidélité: r.fidélite || null,
        nbAchats: 0, totalDepense: 0,
        dernierAchat: null, premierAchat: null,
        produitsAchetes: {}, modesPaiement: {},
        panierMoyen: 0, achatsParMois: {},
        montantsAchetes: [],
      }
    }
    const p = profiles[key]
    p.nbAchats++
    p.totalDepense += r.total
    p.montantsAchetes.push(r.total)
    const date = new Date(r.date)
    if (!p.dernierAchat || date > new Date(p.dernierAchat)) p.dernierAchat = r.date
    if (!p.premierAchat || date < new Date(p.premierAchat)) p.premierAchat = r.date
    p.modesPaiement[r.modePaiement] = (p.modesPaiement[r.modePaiement] || 0) + 1
    const monthKey = r.date.slice(0, 7)
    p.achatsParMois[monthKey] = (p.achatsParMois[monthKey] || 0) + 1
    r.ventes?.forEach(v => {
      p.produitsAchetes[v.nomProduit] = (p.produitsAchetes[v.nomProduit] || 0) + v.quantite
    })
  })

  Object.values(profiles).forEach(p => {
    p.panierMoyen = p.nbAchats > 0 ? Math.round(p.totalDepense / p.nbAchats) : 0
    p.montantStats = stats(p.montantsAchetes)
    // Frequency per month
    const months = Object.keys(p.achatsParMois).length || 1
    p.frequenceMensuelle = Math.round(p.nbAchats / months * 10) / 10
  })

  return Object.entries(profiles).map(([key, p]) => ({ key, ...p }))
}

function computeRFM(profiles) {
  const now = new Date()
  if (profiles.length === 0) return []
  const maxAchats = Math.max(...profiles.map(p => p.nbAchats)) || 1
  const maxDepense = Math.max(...profiles.map(p => p.totalDepense)) || 1

  return profiles.map(p => {
    const joursDepuis = p.dernierAchat ? Math.floor((now - new Date(p.dernierAchat)) / 86400000) : 365
    const r = joursDepuis <= 7 ? 5 : joursDepuis <= 30 ? 4 : joursDepuis <= 90 ? 3 : joursDepuis <= 180 ? 2 : 1
    const f = Math.min(5, Math.ceil((p.nbAchats / maxAchats) * 5))
    const m = Math.min(5, Math.ceil((p.totalDepense / maxDepense) * 5))
    const score = r * 2 + f * 3 + m * 2

    let segment
    if (score >= 28) segment = 'VIP'
    else if (score >= 20) segment = 'Fidèle'
    else if (score >= 12) segment = 'Régulier'
    else if (score >= 6) segment = 'Occasionnel'
    else segment = 'Inactif'

    return { ...p, rfm: { r, f, m, score }, segment, joursDepuisDernierAchat: joursDepuis }
  }).sort((a, b) => b.rfm.score - a.rfm.score)
}

export function segmentCustomers() { return computeRFM(buildClientProfiles()) }

export function getSegmentStats() {
  const segmented = segmentCustomers()
  const segments = ['VIP', 'Fidèle', 'Régulier', 'Occasionnel', 'Inactif']
  const totalCA = segmented.reduce((s, c) => s + c.totalDepense, 0)

  return segments.map(seg => {
    const clients = segmented.filter(c => c.segment === seg)
    return {
      segment: seg,
      count: clients.length,
      totalDepense: clients.reduce((s, c) => s + c.totalDepense, 0),
      panierMoyen: clients.length ? Math.round(clients.reduce((s, c) => s + c.panierMoyen, 0) / clients.length) : 0,
      pourcentage: segmented.length ? ((clients.length / segmented.length) * 100).toFixed(1) : 0,
      caShare: totalCA > 0 ? ((clients.reduce((s, c) => s + c.totalDepense, 0) / totalCA) * 100).toFixed(1) : 0,
    }
  })
}

// Customer Lifetime Value (CLV) — Prédiction
export function computeCLV(clientProfile) {
  if (!clientProfile || clientProfile.nbAchats === 0) return { clv: 0, predictedAnnual: 0, risk: 'unknown' }

  const now = new Date()
  const premierAchat = new Date(clientProfile.premierAchat)
  const monthsActive = Math.max(1, (now - premierAchat) / (30 * 86400000))
  const avgMonthly = clientProfile.totalDepense / monthsActive
  const expectedLifespan = 24 // 2 ans en mois
  const clv = Math.round(avgMonthly * expectedLifespan)

  // Predicted annual value
  const predictedAnnual = Math.round(avgMonthly * 12)

  // Risk assessment
  const joursDepuis = clientProfile.dernierAchat
    ? Math.floor((now - new Date(clientProfile.dernierAchat)) / 86400000)
    : 999
  let risk = 'low'
  if (joursDepuis > 60) risk = 'high'
  else if (joursDepuis > 30) risk = 'medium'

  // Growth trend
  const monthlyData = Object.entries(clientProfile.achatsParMois || {}).sort()
  let monthlyTrend = 'stable'
  if (monthlyData.length >= 3) {
    const recent3 = monthlyData.slice(-3).map(([, v]) => v)
    const prev3 = monthlyData.slice(-6, -3).map(([, v]) => v)
    if (prev3.length) {
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / prev3.length
      if (prevAvg > 0) {
        const ratio = recentAvg / prevAvg
        monthlyTrend = ratio > 1.2 ? 'croissance' : ratio < 0.8 ? 'décroissance' : 'stable'
      }
    }
  }

  return {
    clv,
    predictedAnnual,
    avgMonthly: Math.round(avgMonthly),
    monthsActive: Math.round(monthsActive),
    risk,
    monthlyTrend,
    nbAchats: clientProfile.nbAchats,
    panierMoyen: clientProfile.panierMoyen,
  }
}

// Churn Prediction — Score de probabilité de départ (0-100)
export function predictChurn(clientProfile) {
  if (!clientProfile || clientProfile.nbAchats === 0) return { churnScore: 50, factors: [], label: 'inconnu' }

  const now = new Date()
  let churnScore = 0
  const factors = []

  // Factor 1: Days since last purchase (weight: 35%)
  const joursDepuis = clientProfile.dernierAchat
    ? Math.floor((now - new Date(clientProfile.dernierAchat)) / 86400000)
    : 999
  if (joursDepuis > 90) { churnScore += 30; factors.push('Aucun achat depuis 90+ jours') }
  else if (joursDepuis > 60) { churnScore += 25; factors.push('Aucun achat depuis 60+ jours') }
  else if (joursDepuis > 30) { churnScore += 15; factors.push('Aucun achat depuis 30+ jours') }
  else if (joursDepuis <= 7) { churnScore -= 5; factors.push('Achat récent (< 7 jours)') }

  // Factor 2: Purchase frequency trend (weight: 25%)
  const monthlyData = Object.entries(clientProfile.achatsParMois || {}).sort()
  if (monthlyData.length >= 4) {
    const recent4 = monthlyData.slice(-4).map(([, v]) => v)
    const prev4 = monthlyData.slice(-8, -4).map(([, v]) => v)
    if (prev4.length) {
      const recentAvg = recent4.reduce((a, b) => a + b, 0) / recent4.length
      const prevAvg = prev4.reduce((a, b) => a + b, 0) / prev4.length
      if (prevAvg > 0) {
        const ratio = recentAvg / prevAvg
        if (ratio < 0.5) { churnScore += 25; factors.push('Fréquence d\'achat en forte baisse') }
        else if (ratio < 0.8) { churnScore += 15; factors.push('Fréquence d\'achat en baisse') }
        else if (ratio > 1.3) { churnScore -= 10; factors.push('Fréquence d\'achat en hausse') }
      }
    }
  }

  // Factor 3: Average basket size trend (weight: 20%)
  if (clientProfile.montantsAchetes.length >= 4) {
    const recent = clientProfile.montantsAchetes.slice(-4)
    const prev = clientProfile.montantsAchetes.slice(-8, -4)
    if (prev.length) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length
      if (prevAvg > 0 && recentAvg / prevAvg < 0.6) {
        churnScore += 15; factors.push('Panier moyen en baisse significative')
      }
    }
  }

  // Factor 4: Total purchases count (weight: 10%)
  if (clientProfile.nbAchats <= 2) { churnScore += 10; factors.push('Peu d\'achats au total') }
  else if (clientProfile.nbAchats >= 20) { churnScore -= 5; factors.push('Client très actif') }

  // Factor 5: Payment method diversity (weight: 10%)
  const modesCount = Object.keys(clientProfile.modesPaiement).length
  if (modesCount <= 1 && clientProfile.nbAchats > 5) { churnScore += 5; factors.push('Mode de paiement unique') }

  churnScore = Math.max(0, Math.min(100, churnScore))

  let label
  if (churnScore >= 70) label = 'Risque élevé'
  else if (churnScore >= 40) label = 'Risque moyen'
  else label = 'Fidèle'

  return { churnScore, factors, label, joursDepuisDernierAchat: joursDepuis }
}

// Cross-Selling — Produits complémentaires
export function getCrossSellingRecommendations(produitId) {
  const ventes = getVentes()
  const products = getProducts()
  const targetProduct = products.find(p => p.id === produitId)
  if (!targetProduct) return []

  // Find products frequently bought together (in same receipt/time window)
  const productPairs = {}
  const receipts = getReceipts()

  receipts.forEach(r => {
    if (!r.ventes || r.ventes.length < 2) return
    const productIds = r.ventes.map(v => v.produitId).filter(id => id !== produitId)
    productIds.forEach(otherId => {
      if (!productPairs[otherId]) productPairs[otherId] = { count: 0, totalRevenue: 0 }
      productPairs[otherId].count++
      productPairs[otherId].totalRevenue += r.ventes.find(v => v.produitId === otherId)?.total || 0
    })
  })

  return Object.entries(productPairs)
    .map(([id, data]) => ({
      produit: products.find(p => p.id === parseInt(id)),
      cooccurrence: data.count,
      revenue: Math.round(data.totalRevenue),
      score: data.count,
    }))
    .filter(r => r.produit && r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

// Recommandations par client (amélioré avec CLV + Churn + Cross-Selling)
export function getClientRecommendations(telephone) {
  const customers = segmentCustomers()
  const client = customers.find(c => c.telephone === telephone)
  if (!client) return { recommendations: [], clv: null, churn: null }

  const products = getProducts()
  const recommendations = []

  // Cross-sell based on purchase history
  const topPurchased = Object.entries(client.produitsAchetes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  topPurchased.forEach(([nomProduit]) => {
    const product = products.find(p => p.nom === nomProduit)
    if (product) {
      const crossSells = getCrossSellingRecommendations(product.id)
      crossSells.forEach(cs => {
        if (!client.produitsAchetes[cs.produit.nom] && !recommendations.find(r => r.produit.id === cs.produit.id)) {
          recommendations.push({
            produit: cs.produit,
            raison: `Souvent acheté avec ${nomProduit}`,
            priorite: 'haute',
            type: 'cross-sell',
          })
        }
      })
    }
  })

  // Popular products not yet purchased
  const topProducts = getMostDemandedProducts(15)
  topProducts.forEach(tp => {
    if (!client.produitsAchetes[tp.produit.nom] && !recommendations.find(r => r.produit.id === tp.produit.id)) {
      recommendations.push({
        produit: tp.produit,
        raison: tp.tendance === 'en Hausse' ? 'Produit en forte hausse' : 'Produit populaire',
        priorite: tp.tendance === 'en Hausse' ? 'haute' : 'moyenne',
        type: 'popular',
      })
    }
  })

  // VIP-specific: new products
  if (client.segment === 'VIP') {
    products.slice(-3).forEach(p => {
      if (!recommendations.find(r => r.produit.id === p.id)) {
        recommendations.push({ produit: p, raison: 'Nouveauté pour clients VIP', priorite: 'haute', type: 'vip' })
      }
    })
  }

  // CLV and Churn analysis
  const clv = computeCLV(client)
  const churn = predictChurn(client)

  return {
    recommendations: recommendations.slice(0, 8),
    clv,
    churn,
    segment: client.segment,
    totalDepense: client.totalDepense,
  }
}

// ═══════════════════════════════════════════════════════
// 4. OPTIMISATION DES PRIX
// ═══════════════════════════════════════════════════════

export function getPriceOptimization() {
  const products = getProducts()
  const ventes = getVentes()

  return products.map(p => {
    const productVentes = ventes.filter(v => v.produitId === p.id)
    if (productVentes.length < 5) return { produit: p, suggestion: 'Données insuffisantes', score: 0 }

    const now = new Date()
    const last30j = new Date(now - 30 * 86400000)
    const prev30j = new Date(now - 60 * 86400000)

    const recentVentes = productVentes.filter(v => new Date(v.dateVente) >= last30j)
    const prevVentes = productVentes.filter(v => { const d = new Date(v.dateVente); return d >= prev30j && d < last30j })

    if (recentVentes.length < 3 || prevVentes.length < 3) return { produit: p, suggestion: 'Données insuffisantes', score: 0 }

    // Price-volume analysis
    const recentAvgPrice = recentVentes.reduce((s, v) => s + v.prixUnitaire, 0) / recentVentes.length
    const prevAvgPrice = prevVentes.reduce((s, v) => s + v.prixUnitaire, 0) / prevVentes.length
    const recentAvgQty = recentVentes.reduce((s, v) => s + v.quantite, 0) / recentVentes.length
    const prevAvgQty = prevVentes.reduce((s, v) => s + v.quantite, 0) / prevVentes.length

    const priceChange = prevAvgPrice > 0 ? (recentAvgPrice - prevAvgPrice) / prevAvgPrice : 0
    const volumeChange = prevAvgQty > 0 ? (recentAvgQty - prevAvgQty) / prevAvgQty : 0

    // Demand elasticity (simplified)
    const elasticity = priceChange !== 0 ? volumeChange / priceChange : 0

    // Margin analysis
    const coutAchat = p.prixCasier / p.nbUnitesParCasier
    const currentMargin = recentAvgPrice > 0 ? (recentAvgPrice - coutAchat) / recentAvgPrice : 0
    const avgMargin = productVentes.length > 0
      ? productVentes.reduce((s, v) => s + (v.total - (v.coutAchat || coutAchat) * v.quantite), 0) / productVentes.reduce((s, v) => s + v.total, 0)
      : 0

    // Recommendation
    let suggestion, action, score = 0
    if (currentMargin < 0.15) {
      suggestion = 'Marge trop faible — Augmentez le prix de 10-15%'
      action = 'augmenter'
      score = 80
    } else if (elasticity < -1 && priceChange > 0.05) {
      suggestion = 'Prix en hausse mais ventes en baisse — Stabilisez le prix'
      action = 'stabiliser'
      score = 70
    } else if (elasticity > -0.5 && currentMargin > 0.3 && volumeChange < -0.1) {
      suggestion = 'Bonne marge mais ventes en baisse — Testez une promotion de 5-10%'
      action = 'promotion'
      score = 60
    } else if (currentMargin > 0.4 && volumeChange > 0.1) {
      suggestion = 'Forte demande et bonne marge — Prix optimal, maintenez'
      action = 'maintenir'
      score = 30
    } else {
      suggestion = 'Pricing dans la norme'
      action = 'maintenir'
      score = 10
    }

    return {
      produit: p,
      prixActuel: Math.round(recentAvgPrice),
      prixCout: Math.round(coutAchat),
      margeActuelle: (currentMargin * 100).toFixed(1),
      elasticite: elasticity.toFixed(2),
      variationPrix: (priceChange * 100).toFixed(1),
      variationVolume: (volumeChange * 100).toFixed(1),
      suggestion,
      action,
      score,
    }
  }).sort((a, b) => b.score - a.score)
}

// ═══════════════════════════════════════════════════════
// 5. ALERTES PROACTIVES INTELLIGENTES
// ═══════════════════════════════════════════════════════

export function getProactiveAlerts() {
  const alerts = []
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const ventes = getVentes()
  const products = getProducts()
  const depenses = getDepenses()

  // 1. Stock critical
  const stockAlerts = predictStockout()
  stockAlerts.filter(a => a.severity === 'critique').forEach(a => {
    alerts.push({
      type: 'stock_critique',
      severity: 'critique',
      icon: 'Package',
      title: `Stock critique : ${a.produit.nom}`,
      message: `Plus que ${a.stockActuel} unités — rupture prévue dans ${a.joursRestants} jours`,
      action: { label: 'Voir le stock', route: '/app/stock' },
    })
  })

  // 2. Sales drop anomaly
  const thisWeek = ventes.filter(v => { const d = new Date(v.dateVente); return (now - d) < 7 * 86400000 })
  const lastWeek = ventes.filter(v => { const d = new Date(v.dateVente); return (now - d) >= 7 * 86400000 && (now - d) < 14 * 86400000 })
  if (lastWeek.length > 0 && thisWeek.length > 0) {
    const thisWeekCA = thisWeek.reduce((s, v) => s + v.total, 0) / 7
    const lastWeekCA = lastWeek.reduce((s, v) => s + v.total, 0) / 7
    if (lastWeekCA > 0 && thisWeekCA / lastWeekCA < 0.6) {
      alerts.push({
        type: 'chute_ventes',
        severity: 'attention',
        icon: 'TrendingDown',
        title: 'Chute des ventes détectée',
        message: `CA cette semaine : ${Math.round(thisWeekCA).toLocaleString('fr-FR')} FCFA/j vs ${Math.round(lastWeekCA).toLocaleString('fr-FR')} FCFA/j la semaine dernière (-${Math.round((1 - thisWeekCA / lastWeekCA) * 100)}%)`,
        action: { label: 'Voir les prédictions', route: '/app/ia' },
      })
    }
  }

  // 3. Unusual expense spike
  const monthExpenses = depenses.filter(d => { const dd = new Date(d.date); return (now - dd) < 30 * 86400000 })
  const avgMonthlyExpense = monthExpenses.reduce((s, d) => s + d.montant, 0) / 30
  const todayExpenses = depenses.filter(d => d.date.slice(0, 10) === today)
  if (todayExpenses.length > 0) {
    const todayTotal = todayExpenses.reduce((s, d) => s + d.montant, 0)
    if (todayTotal > avgMonthlyExpense * 0.5) {
      alerts.push({
        type: 'depense_spike',
        severity: 'attention',
        icon: 'Wallet',
        title: 'Dépenses élevées aujourd\'hui',
        message: `${todayTotal.toLocaleString('fr-FR')} FCFA dépensés aujourd\'hui (moyenne: ${Math.round(avgMonthlyExpense).toLocaleString('fr-FR')} FCFA/j)`,
        action: { label: 'Voir les dépenses', route: '/app/depenses' },
      })
    }
  }

  // 4. Top product out of trend
  const topProducts = getMostDemandedProducts(5)
  topProducts.filter(p => p.tendance === 'en Baisse' && p.ca30j > 0).forEach(p => {
    alerts.push({
      type: 'produit_baisse',
      severity: 'info',
      icon: 'TrendingDown',
      title: `Tendance baissière : ${p.produit.nom}`,
      message: `Ventes en baisse de ${Math.round((1 - p.tendanceRatio) * 100)}% cette semaine vs moyenne`,
      action: { label: 'Voir les prédictions', route: '/app/ia' },
    })
  })

  // 5. Customer churn risk
  const customers = segmentCustomers()
  const atRisk = customers.filter(c => {
    const churn = predictChurn(c)
    return churn.churnScore >= 70 && c.totalDepense > 10000
  })
  if (atRisk.length > 0) {
    alerts.push({
      type: 'client_churn',
      severity: 'attention',
      icon: 'Users',
      title: `${atRisk.length} client(s) fidèle(s) en risque de départ`,
      message: atRisk.slice(0, 3).map(c => `${c.nom} (${c.totalDepense.toLocaleString('fr-FR')} FCFA)`).join(', '),
      action: { label: 'Voir les clients', route: '/app/ia' },
    })
  }

  // 6. Security anomalies
  const anomalies = detectSalesAnomalies()
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critique')
  if (criticalAnomalies.length > 0) {
    alerts.push({
      type: 'securite',
      severity: 'critique',
      icon: 'Shield',
      title: `${criticalAnomalies.length} anomalie(s) critique(s) de sécurité`,
      message: criticalAnomalies[0].description,
      action: { label: 'Voir la sécurité', route: '/app/ia' },
    })
  }

  // 7. No sales today (after 2pm)
  const hour = now.getHours()
  if (hour >= 14) {
    const todaySalesCount = ventes.filter(v => v.dateVente.slice(0, 10) === today).length
    if (todaySalesCount === 0) {
      alerts.push({
        type: 'pas_de_ventes',
        severity: 'info',
        icon: 'Clock',
        title: 'Aucune vente enregistrée aujourd\'hui',
        message: `Il est ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — vérifiez l\'activité`,
        action: { label: 'Voir les ventes', route: '/app/ventes' },
      })
    }
  }

  return alerts.sort((a, b) => {
    const sev = { critique: 0, attention: 1, info: 2 }
    return (sev[a.severity] || 3) - (sev[b.severity] || 3)
  })
}

// ═══════════════════════════════════════════════════════
// 6. SÉCURITÉ — Détection d'anomalies & Fraudes
// ═══════════════════════════════════════════════════════

export function detectSalesAnomalies() {
  const ventes = getVentes()
  if (ventes.length < 10) return []
  const anomalies = []

  // 1. Montants anormaux
  const amounts = ventes.map(v => v.total)
  const { mean, stdDev, q1, q3 } = stats(amounts)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  ventes.forEach(v => {
    const z = zScore(v.total, mean, stdDev)
    if (Math.abs(z) > 2.5 || v.total > upperBound || v.total < lowerBound) {
      anomalies.push({
        type: 'montant_anormal',
        severity: Math.abs(z) > 3 ? 'critique' : 'attention',
        description: `Vente #${v.id}: ${v.total.toLocaleString('fr-FR')} FCFA ${v.total > upperBound ? 'anormalement élevé' : 'anormalement bas'}`,
        details: { vente: v, zScore: z, mean, stdDev },
        date: v.dateVente,
      })
    }
  })

  // 2. Remises excessives (> 30%)
  ventes.forEach(v => {
    if (v.remise && v.sousTotal > 0 && (v.remise / v.sousTotal) > 0.3) {
      anomalies.push({
        type: 'remise_excessive',
        severity: 'attention',
        description: `Vente #${v.id}: Remise de ${((v.remise / v.sousTotal) * 100).toFixed(0)}% sur ${v.nomProduit}`,
        details: { vente: v, pourcentageRemise: (v.remise / v.sousTotal) * 100 },
        date: v.dateVente,
      })
    }
  })

  // 3. Heures atypiques
  ventes.forEach(v => {
    const hour = new Date(v.dateVente).getHours()
    if (hour >= 2 && hour <= 6) {
      anomalies.push({
        type: 'heure_atypique',
        severity: 'info',
        description: `Vente #${v.id} à ${hour}h — heure inhabituelle`,
        details: { vente: v, heure: hour },
        date: v.dateVente,
      })
    }
  })

  // 4. Volumes suspects par caissier
  const ventesParCaissier = {}
  ventes.forEach(v => {
    const c = v.caissier || 'Inconnu'
    if (!ventesParCaissier[c]) ventesParCaissier[c] = { count: 0, total: 0, unites: 0, amounts: [] }
    ventesParCaissier[c].count++
    ventesParCaissier[c].total += v.total
    ventesParCaissier[c].unites += v.quantite
    ventesParCaissier[c].amounts.push(v.total)
  })

  const caissierTotals = Object.values(ventesParCaissier).map(c => c.total)
  const cStats = stats(caissierTotals)

  Object.entries(ventesParCaissier).forEach(([nom, data]) => {
    const z = zScore(data.total, cStats.mean, cStats.stdDev)
    if (Math.abs(z) > 3 && data.count > 5) {
      anomalies.push({
        type: 'caissier_suspect',
        severity: 'critique',
        description: `Caissier "${nom}": CA total anormal (${z > 0 ? '+' : ''}${z.toFixed(1)}σ)`,
        details: { caissier: nom, zScore: z, total: data.total },
        date: new Date().toISOString(),
      })
    }
    // Check for unusual variance within caissier
    if (data.amounts.length >= 5) {
      const caStats = stats(data.amounts)
      if (caStats.stdDev > caStats.mean * 0.8) {
        anomalies.push({
          type: 'variance_anormale',
          severity: 'attention',
          description: `Caissier "${nom}": Variance anormale des montants (écart-type ${caStats.stdDev.toFixed(0)} FCFA)`,
          details: { caissier: nom, stats: caStats },
          date: new Date().toISOString(),
        })
      }
    }
  })

  // 5. Patterns de fraude
  for (let i = 1; i < ventes.length; i++) {
    const prev = ventes[i - 1]
    const curr = ventes[i]
    if (
      prev.produitId === curr.produitId &&
      prev.quantite === curr.quantite &&
      prev.total === curr.total &&
      prev.caissier === curr.caissier &&
      Math.abs(new Date(curr.dateVente) - new Date(prev.dateVente)) < 60000
    ) {
      anomalies.push({
        type: 'pattern_fraude',
        severity: 'attention',
        description: `Ventes #${prev.id} et #${curr.id}: même produit, même quantité, même montant, < 1 min d'écart`,
        details: { v1: prev, v2: curr },
        date: curr.dateVente,
      })
    }
  }

  // 6. Volume soudain (spike > 3σ)
  const ventesParJour = {}
  ventes.forEach(v => { const j = v.dateVente.slice(0, 10); ventesParJour[j] = (ventesParJour[j] || 0) + v.quantite })
  const dailyVolumes = Object.values(ventesParJour)
  if (dailyVolumes.length >= 7) {
    const vStats = stats(dailyVolumes)
    const todayStr = new Date().toISOString().slice(0, 10)
    const todayVol = ventesParJour[todayStr]
    if (todayVol && vStats.stdDev > 0) {
      const z = zScore(todayVol, vStats.mean, vStats.stdDev)
      if (z > 3) {
        anomalies.push({
          type: 'volume_spike',
          severity: 'info',
          description: `Volume aujourd'hui anormalement élevé (${todayVol} u. vs moyenne ${Math.round(vStats.mean)} u.)`,
          details: { volume: todayVol, zScore: z },
          date: new Date().toISOString(),
        })
      }
    }
  }

  return anomalies.sort((a, b) => {
    const sev = { critique: 0, attention: 1, info: 2 }
    return (sev[a.severity] || 3) - (sev[b.severity] || 3)
  })
}

export function getSecurityScore() {
  const anomalies = detectSalesAnomalies()
  const critique = anomalies.filter(a => a.severity === 'critique').length
  const attention = anomalies.filter(a => a.severity === 'attention').length
  const info = anomalies.filter(a => a.severity === 'info').length
  let score = 100
  score -= critique * 15; score -= attention * 5; score -= info * 1
  return {
    score: Math.max(0, Math.min(100, score)),
    anomalies: anomalies.length, critique, attention, info,
    rating: score >= 90 ? 'Excellent' : score >= 70 ? 'Bon' : score >= 50 ? 'Moyen' : 'À améliorer',
  }
}

// ═══════════════════════════════════════════════════════
// 7. RÉSUMÉ GLOBAL IA
// ═══════════════════════════════════════════════════════

export function getAISummary() {
  const ventes = getVentes()
  const products = getProducts()
  const security = getSecurityScore()
  const stockAlerts = predictStockout()
  const salesPredict = predictGlobalSales(7)
  const monthlyPredict = predictMonthlyRevenue()
  const trending = getTrendingProducts()
  const segments = getSegmentStats()
  const reorder = getAutoReorderSuggestions()
  const proactive = getProactiveAlerts()
  const priceOptim = getPriceOptimization()
  const customers = segmentCustomers()
  const churnRisks = customers.filter(c => predictChurn(c).churnScore >= 60)

  return {
    overview: {
      totalProducts: products.length,
      totalSales: ventes.length,
      stockAlerts: stockAlerts.length,
      criticalAlerts: stockAlerts.filter(a => a.severity === 'critique').length,
      proactiveAlerts: proactive.length,
      criticalAlerts2: proactive.filter(a => a.severity === 'critique').length,
    },
    sales: {
      prediction7j: salesPredict,
      predictionMois: monthlyPredict,
      trending,
      weeklyPattern: salesPredict.weeklyPattern,
    },
    stock: {
      alerts: stockAlerts,
      reorderSuggestions: reorder,
      countReorder: reorder.length,
    },
    customers: {
      segments,
      totalClients: segments.reduce((s, seg) => s + seg.count, 0),
      churnRisks: churnRisks.length,
    },
    security,
    priceOptimization: priceOptim.slice(0, 5),
    proactiveAlerts: proactive,
  }
}

// ═══════════════════════════════════════════════════════
// 8. CHATBOT AMÉLIORÉ
// ═══════════════════════════════════════════════════════

export function getChatbotResponse(question) {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const ventes = getVentes()
  const products = getProducts()
  const now = new Date()

  // Salutation
  if (/^(bonjour|salut|hello|hey|coucou|bonsoir|yo)/i.test(q)) {
    return "Bonjour ! Je suis l'assistant GESTOCOM CI. Comment puis-je vous aider ?"
  }

  // Aide
  if (/^(aide|help|commande|utilisation|que sais|que peux)/i.test(q)) {
    return "Voici ce que je peux faire :\n\n📊 Ventes\n• « Ventes aujourd'hui » / « CA du mois »\n• « Top produits » / « Meilleur caissier »\n• « Modes de paiement »\n\n📦 Stock\n• « Stock de [produit] » / « Produits en rupture »\n• « Alertes stock » / « Réappro »\n\n💰 Finance\n• « Bénéfice du mois » / « Dépenses »\n• « Optimisation prix »\n\n👥 Clients\n• « Segmentation clients » / « Clients VIP »\n• « Risque de churn »\n\n🔒 Sécurité\n• « Score sécurité » / « Anomalies »\n\n🤖 Prédictions\n• « Prédictions ventes » / « Tendance »\n• « Prédiction mois prochain »"
  }

  // Stock d'un produit
  if (/stock|quantite|combien.*reste/i.test(q)) {
    const productName = q.replace(/.*stock\s*(de\s*|d['']?)?\s*/i, '').replace(/\?.*/g, '').trim()
    if (productName.length > 1) {
      const found = products.filter(p => p.nom.toLowerCase().includes(productName))
      if (found.length === 1) {
        const p = found[0]
        const days = getDaysOfStock(p.id)
        const alert = p.stockActuel <= p.seuilAlerte ? '\n⚠️ Stock bas !' : ''
        const daysStr = days === Infinity ? '∞' : `${days} jours`
        return `📦 ${p.nom}\n• Stock: ${p.stockActuel} u. (${p.nombreCasiers} casiers)\n• Seuil: ${p.seuilAlerte}\n• Jours restants: ~${daysStr}${alert}`
      } else if (found.length > 1) {
        return `Produits trouvés :\n${found.map(p => `• ${p.nom} (${p.stockActuel} u.)`).join('\n')}`
      }
    }
    return `Stock: ${products.length} produits. ${products.filter(p => p.stockActuel <= p.seuilAlerte).length} en alerte.`
  }

  // Ventes aujourd'hui
  if (/vente.*aujourd|aujourd.*vente|vente.*jour|chiffre.*jour/i.test(q)) {
    const today = now.toISOString().slice(0, 10)
    const todaySales = ventes.filter(v => v.dateVente.slice(0, 10) === today)
    const ca = todaySales.reduce((s, v) => s + v.total, 0)
    const unites = todaySales.reduce((s, v) => s + v.quantite, 0)
    return `📊 Aujourd'hui :\n• ${todaySales.length} ventes\n• ${unites} unités vendues\n• ${ca.toLocaleString('fr-FR')} FCFA`
  }

  // CA mensuel
  if (/ca.*mois|chiffre.*mois|revenu.*mois|gagne.*mois/i.test(q)) {
    const month = now.toISOString().slice(0, 7)
    const monthSales = ventes.filter(v => v.dateVente.startsWith(month))
    const ca = monthSales.reduce((s, v) => s + v.total, 0)
    const pred = predictMonthlyRevenue()
    return `💰 CA ${month} :\n• Réalisé: ${ca.toLocaleString('fr-FR')} FCFA (${monthSales.length} ventes)\n• Prédit: ${pred.prediction.toLocaleString('fr-FR')} FCFA\n• Tendance: ${pred.trendDirection}`
  }

  // Meilleur caissier
  if (/meilleur.*caissier|caissier.*meilleur|top.*caissier/i.test(q)) {
    const map = {}
    ventes.forEach(v => { const c = v.caissier || 'Inconnu'; if (!map[c]) map[c] = { nom: c, total: 0, count: 0 }; map[c].total += v.total; map[c].count++ })
    const sorted = Object.values(map).sort((a, b) => b.total - a.total)
    if (sorted.length) return `🏆 Classement caissiers :\n${sorted.map((c, i) => `${i + 1}. ${c.nom}: ${c.total.toLocaleString('fr-FR')} FCFA (${c.count} ventes)`).join('\n')}`
    return "Aucune donnée caissier."
  }

  // Produits en rupture
  if (/rupture|rupt|epuis|manque|stock.*bas/i.test(q)) {
    const alerts = predictStockout().filter(a => a.severity === 'critique' || a.severity === 'attention')
    if (!alerts.length) return "✅ Tous les stocks sont OK !"
    return `⚠️ ${alerts.length} produit(s) en alerte :\n${alerts.slice(0, 5).map(a => `• ${a.produit.nom}: ${a.stockActuel} u. (~${a.joursRestants}j)`).join('\n')}`
  }

  // Produits tendance
  if (/tendance|trend|populaire|mode|moment/i.test(q)) {
    const trending = getTrendingProducts()
    if (!trending.length) return "Pas assez de données pour les tendances."
    return `🔥 Produits tendance :\n${trending.map((t, i) => `${i + 1}. ${t.produit.nom} (${t.unites7j} u. cette semaine, ${t.tendance})`).join('\n')}`
  }

  // Sécurité
  if (/securite|fraude|anomal|alerte.*secu/i.test(q)) {
    const sec = getSecurityScore()
    const anomalies = detectSalesAnomalies()
    const critCount = anomalies.filter(a => a.severity === 'critique').length
    return `🛡️ Score sécurité : ${sec.score}/100 (${sec.rating})\n• ${anomalies.length} anomalie(s)\n• ${critCount} critique(s)`
  }

  // Segmentation clients
  if (/client|fidel|vip|segment/i.test(q)) {
    const segments = getSegmentStats()
    return `👥 Clients :\n${segments.filter(s => s.count > 0).map(s => `• ${s.segment}: ${s.count} (${s.pourcentage}%) — ${s.totalDepense.toLocaleString('fr-FR')} FCFA`).join('\n')}`
  }

  // Prédiction
  if (/predict|prevision|avenir|prochain|demain|forecast/i.test(q)) {
    const pred = predictGlobalSales(7)
    return `📈 Prédiction 7 jours :\n• CA prévu: ~${pred.prediction.toLocaleString('fr-FR')} FCFA\n• Tendance: ${pred.trend}\n• Confiance: ${(pred.confidence * 100).toFixed(0)}%`
  }

  // Revenu / Bénéfice
  if (/revenu|benefice|profit|marge/i.test(q)) {
    const last30 = new Date(now - 30 * 86400000)
    const ca = ventes.filter(v => new Date(v.dateVente) >= last30).reduce((s, v) => s + v.total, 0)
    const depenses = getDepenses().filter(d => new Date(d.date) >= last30).reduce((s, d) => s + d.montant, 0)
    const benefice = ca - depenses
    const marge = ca > 0 ? ((benefice / ca) * 100).toFixed(1) : 0
    return `💰 30 derniers jours :\n• CA: ${ca.toLocaleString('fr-FR')} FCFA\n• Dépenses: ${depenses.toLocaleString('fr-FR')} FCFA\n• Bénéfice: ${benefice.toLocaleString('fr-FR')} FCFA\n• Marge: ${marge}%`
  }

  // Dépenses
  if (/depense|charge/i.test(q)) {
    const last30 = new Date(now - 30 * 86400000)
    const recent = getDepenses().filter(d => new Date(d.date) >= last30)
    const total = recent.reduce((s, d) => s + d.montant, 0)
    return `📋 Dépenses (30j) : ${recent.length} dépenses, ${total.toLocaleString('fr-FR')} FCFA`
  }

  // Paiement
  if (/paiement|mobile.*money|espece|carte/i.test(q)) {
    const last30 = new Date(now - 30 * 86400000)
    const modes = {}
    ventes.filter(v => new Date(v.dateVente) >= last30).forEach(v => { const m = v.modePaiement || 'especes'; modes[m] = (modes[m] || 0) + v.total })
    return `💳 Paiements (30j) :\n${Object.entries(modes).sort((a, b) => b[1] - a[1]).map(([m, t]) => `• ${m}: ${t.toLocaleString('fr-FR')} FCFA`).join('\n') || 'Aucune donnée'}`
  }

  // Prix / optimisation
  if (/prix|optim|tarif|cout/i.test(q)) {
    const optims = getPriceOptimization().filter(o => o.score > 30).slice(0, 3)
    if (!optims.length) return "✅ Pas d'optimisation de prix nécessaire actuellement."
    return `💡 Suggestions de prix :\n${optims.map(o => `• ${o.produit.nom}: ${o.suggestion}`).join('\n')}`
  }

  // Churn
  if (/churn|depart|risque|perdre.*client/i.test(q)) {
    const customers = segmentCustomers()
    const atRisk = customers.filter(c => predictChurn(c).churnScore >= 60)
    if (!atRisk.length) return "✅ Aucun client fidèle en risque de départ."
    return `⚠️ ${atRisk.length} client(s) à risque :\n${atRisk.slice(0, 5).map(c => {
      const churn = predictChurn(c)
      return `• ${c.nom}: ${churn.churnScore}/100 (${churn.label}) — ${c.totalDepense.toLocaleString('fr-FR')} FCFA`
    }).join('\n')}`
  }

  // Date / heure
  if (/heure|date|jour|temps/i.test(q)) {
    return `🕐 ${now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${now.toLocaleTimeString('fr-FR')}`
  }

  // Nombre de produits
  if (/combien.*produit|nb.*produit|total.*produit/i.test(q)) {
    return `📦 ${products.length} produits\n• ${products.filter(p => p.type === 'bouteille').length} bouteille(s)\n• ${products.filter(p => p.type === 'canette').length} canette(s)`
  }

  // Fournisseurs
  if (/fournisseur|supplier/i.test(q)) {
    const fournisseurs = getFournisseurs()
    return `🚚 ${fournisseurs.length} fournisseur(s)\n${fournisseurs.slice(0, 5).map(f => `• ${f.nom}`).join('\n')}`
  }

  // Alertes proactives
  if (/alerte|proactif|notification/i.test(q)) {
    const alerts = getProactiveAlerts()
    if (!alerts.length) return "✅ Aucune alerte proactive."
    return `🔔 ${alerts.length} alerte(s) :\n${alerts.slice(0, 5).map(a => `• ${a.title}`).join('\n')}`
  }

  // Pattern journalier
  if (/meilleur.*jour|jour.*fort|pattern|saisonnier/i.test(q)) {
    const pattern = detectWeeklyPattern(ventes)
    if (!pattern.length) return "Pas assez de données pour analyser les patterns."
    const best = [...pattern].sort((a, b) => b.caMoyen - a.caMoyen)[0]
    const worst = [...pattern].sort((a, b) => a.caMoyen - b.caMoyen)[0]
    return `📅 Pattern hebdomadaire :\n• Meilleur jour: ${best.jour} (${best.caMoyen.toLocaleString('fr-FR')} FCFA)\n• Plus faible: ${worst.jour} (${worst.caMoyen.toLocaleString('fr-FR')} FCFA)`
  }

  // Default
  return "Je ne suis pas sûr de comprendre. Essayez :\n• « Aide » pour voir les commandes\n• « Stock de [produit] »\n• « Ventes aujourd'hui »\n• « Bénéfice du mois »\n• « Risque de churn »\n• « Optimisation prix »"
}

// ═══════════════════════════════════════════════════════
// 9. CHIFFRES CLÉS POUR LE DASHBOARD
// ═══════════════════════════════════════════════════════

export function getAIKeyMetrics() {
  const ventes = getVentes()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const month = now.toISOString().slice(0, 7)

  const todaySales = ventes.filter(v => v.dateVente.slice(0, 10) === today)
  const monthSales = ventes.filter(v => v.dateVente.startsWith(month))

  const alerts = predictStockout()
  const critical = alerts.filter(a => a.severity === 'critique')
  const security = getSecurityScore()
  const proactive = getProactiveAlerts()
  const customers = segmentCustomers()
  const churnRisks = customers.filter(c => predictChurn(c).churnScore >= 60)

  return {
    todayCA: todaySales.reduce((s, v) => s + v.total, 0),
    todayCount: todaySales.length,
    monthCA: monthSales.reduce((s, v) => s + v.total, 0),
    monthCount: monthSales.length,
    stockCritical: critical.length,
    stockAlerts: alerts.length,
    securityScore: security.score,
    anomalies: security.anomalies,
    proactiveAlerts: proactive.length,
    criticalAlerts: proactive.filter(a => a.severity === 'critique').length,
    churnRisks: churnRisks.length,
    totalClients: customers.length,
  }
}
