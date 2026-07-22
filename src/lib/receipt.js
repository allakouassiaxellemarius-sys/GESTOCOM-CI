import jsPDF from 'jspdf'
import { getCompanySettings, getVentesSettings, saveReceipt } from './db'
import { qrToDataURL } from './qrcode'

function hr(doc, y, x1, x2) {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.2)
  doc.line(x1, y, x2, y)
}

function dashedHr(doc, y, x1, x2) {
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.15)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(x1, y, x2, y)
  doc.setLineDashPattern([], 0)
}

function centerText(doc, text, y, size = 7) {
  doc.setFontSize(size)
  doc.text(text, 40, y, { align: 'center' })
}

function boldText(doc, text, x, y, size = 6) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(size)
  doc.text(text, x, y)
  doc.setFont('helvetica', 'normal')
}

export async function generateReceipt(ventes, total, options = {}) {
  const {
    modePaiement = 'Espèces',
    remise = 0,
    remiseType = 'montant',
    caissier = 'Inconnu',
    client = null,
    telephone = null,
    fidélite = null,
    referencePaiement = null,
    sousTotal = null,
  } = options

  const company = getCompanySettings()
  const ventesSettings = getVentesSettings()
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] })
  const W = 80
  const M = 4
  let y = 4

  // ═══════ 1. EN-TÊTE ═══════
  // Bandeau coloré
  doc.setFillColor(26, 115, 232)
  doc.rect(0, 0, W, 18, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  centerText(doc, company.nomCommercial || 'GESTOCOM CI', 8, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(220, 235, 255)
  centerText(doc, company.nom || 'LES RETROUVAILLES CEZ LUICI', 13, 7)

  y = 22

  // Coordonnées
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(6)
  if (company.adresse) { centerText(doc, company.adresse, y, 6); y += 3 }
  if (company.telephone) { centerText(doc, 'Tél: ' + company.telephone, y, 6); y += 3 }
  if (company.email) { centerText(doc, company.email, y, 6); y += 3 }

  dashedHr(doc, y, M, W - M)
  y += 4

  // ═══════ 2. INFORMATIONS TRANSACTION ═══════
  const receiptNumero = `RC${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  // Boîte info
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(M, y, W - M * 2, 14, 1, 1, 'F')

  doc.setTextColor(26, 115, 232)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('REÇU DE VENTE', M + 3, y + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(100, 100, 100)
  doc.text(receiptNumero, W - M - 3, y + 4, { align: 'right' })

  doc.text(`${dateStr}  •  ${timeStr}`, M + 3, y + 8)
  doc.text(`Caissier: ${caissier}`, W - M - 3, y + 8, { align: 'right' })

  doc.setFontSize(5.5)
  doc.setTextColor(140, 140, 140)
  doc.text(`${ventes.length} article${ventes.length > 1 ? 's' : ''}`, M + 3, y + 12)

  y += 18

  // ═══════ 3. CLIENT (optionnel) ═══════
  if (client || telephone || fidélite) {
    doc.setFillColor(240, 253, 244)
    doc.roundedRect(M, y, W - M * 2, client && telephone ? 10 : 7, 1, 1, 'F')

    doc.setTextColor(22, 163, 74)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.text('CLIENT', M + 3, y + 3.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(60, 60, 60)
    if (client) doc.text(client, M + 3, y + 7)
    if (telephone) doc.text('Tél: ' + telephone, W - M - 3, y + 7, { align: 'right' })
    if (fidélite) doc.text('Fidélité: ' + fidélite, W - M - 3, y + 7, { align: 'right' })

    y += (client && telephone ? 13 : 10)
  }

  // ═══════ 4. DÉTAILS DE LA VENTE ═══════
  // En-tête tableau
  doc.setFillColor(26, 115, 232)
  doc.roundedRect(M, y, W - M * 2, 5, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.5)
  doc.setTextColor(255, 255, 255)
  doc.text('Article', M + 3, y + 3.5)
  doc.text('Qte', 47, y + 3.5)
  doc.text('P.U.', 54, y + 3.5)
  doc.text('Total', W - M - 3, y + 3.5, { align: 'right' })
  y += 7

  // Lignes produits
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  let totalCalc = 0

  ventes.forEach((v, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(M, y - 2, W - M * 2, 4, 'F')
    }

    doc.setTextColor(30, 30, 30)
    const nom = v.nomProduit.length > 18 ? v.nomProduit.slice(0, 16) + '..' : v.nomProduit
    doc.text(nom, M + 3, y + 0.5)
    doc.setTextColor(80, 80, 80)
    doc.text(`${v.quantite}`, 47, y + 0.5)
    doc.text(`${v.prixUnitaire.toLocaleString('fr-FR')}`, 54, y + 0.5)
    doc.setTextColor(26, 115, 232)
    doc.text(`${v.total.toLocaleString('fr-FR')}`, W - M - 3, y + 0.5, { align: 'right' })
    totalCalc += v.total
    y += 4
  })

  y += 1
  dashedHr(doc, y, M, W - M)
  y += 4

  // ═══════ 5. SOUS-TOTAL, REMISE, TOTAL ═══════
  const st = sousTotal || totalCalc

  doc.setFontSize(6)
  doc.setTextColor(100, 100, 100)

  doc.text('Sous-total:', M + 3, y)
  doc.text(`${st.toLocaleString('fr-FR')} FCFA`, W - M - 3, y, { align: 'right' })
  y += 4

  if (remise > 0) {
    doc.setTextColor(220, 50, 50)
    const remLabel = remiseType === 'pourcentage' ? `Remise (${remise}%)` : 'Remise:'
    doc.text(remLabel, M + 3, y)
    doc.text(`-${(remiseType === 'pourcentage' ? Math.round(st * remise / 100) : remise).toLocaleString('fr-FR')} FCFA`, W - M - 3, y, { align: 'right' })
    y += 4
  }

  // Total box
  doc.setFillColor(26, 115, 232)
  doc.roundedRect(M, y - 1, W - M * 2, 8, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL', M + 4, y + 4)
  doc.text(`${total.toLocaleString('fr-FR')} FCFA`, W - M - 4, y + 4, { align: 'right' })

  y += 12

  // ═══════ 6. PAIEMENT ═══════
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(M, y, W - M * 2, 10, 1, 1, 'F')

  doc.setTextColor(26, 115, 232)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.text('PAIEMENT', M + 3, y + 3.5)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.text(`Mode: ${modePaiement}`, M + 3, y + 7.5)
  if (referencePaiement) {
    doc.text(`Réf: ${referencePaiement}`, W - M - 3, y + 7.5, { align: 'right' })
  }

  y += 14

  // ═══════ 7. QR CODE ═══════
  try {
    const verificationUrl = `https://gestocom.ci/verify/${receiptNumero}`
    const qrDataUrl = qrToDataURL(verificationUrl, 100)
    doc.addImage(qrDataUrl, 'SVG', 30, y, 20, 20)
    y += 3
    doc.setFontSize(5)
    doc.setTextColor(140, 140, 140)
    centerText(doc, 'Scannez pour vérifier', y, 5)
    y += 3
    doc.setFontSize(4.5)
    doc.setTextColor(180, 180, 180)
    centerText(doc, receiptNumero, y, 4.5)
    y += 10
  } catch {
    y += 2
  }

  // ═══════ 8. PIED DE PAGE ═══════
  dashedHr(doc, y, M, W - M)
  y += 4

  const messageFooter = ventesSettings.messageRecu || 'Merci de votre confiance !'
  const politiqueRetour = ventesSettings.politiqueRetour || 'Échanges sous 7 jours avec reçu'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(26, 115, 232)
  centerText(doc, messageFooter, y, 7)
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(160, 160, 160)
  centerText(doc, politiqueRetour, y, 5)
  y += 3

  doc.setFontSize(4.5)
  doc.setTextColor(190, 190, 190)
  centerText(doc, `© ${new Date().getFullYear()} ${company.nom || 'LES RETROUVAILLES CEZ LUICI'}`, y, 4.5)

  // ═══════ SAUVEGARDE EN BASE ═══════
  const receipt = await saveReceipt({
    numero: receiptNumero,
    client,
    telephone,
    fidélite,
    ventes: ventes.map(v => ({
      produitId: v.produitId,
      nomProduit: v.nomProduit,
      quantite: v.quantite,
      prixUnitaire: v.prixUnitaire,
      total: v.total,
    })),
    sousTotal: st,
    remise: remiseType === 'pourcentage' ? Math.round(st * remise / 100) : remise,
    remiseType,
    total,
    modePaiement,
    referencePaiement,
    caissier,
  })

  return { doc, receipt, numero: receiptNumero }
}

export function downloadReceipt(doc, numero) {
  doc.save(`Recu_${numero || Date.now()}.pdf`)
}

export function printReceipt(doc) {
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.onload = () => { win.print(); URL.revokeObjectURL(url) }
  }
}

export function shareReceiptByWhatsApp(numero, total, client) {
  const text = encodeURIComponent(
    `Reçu GESTOCOM CI\n` +
    `N°: ${numero}\n` +
    `Total: ${total.toLocaleString('fr-FR')} FCFA\n` +
    `Vérifier: https://gestocom.ci/verify/${numero}`
  )
  const phone = client?.telephone?.replace(/[\s\-\(\)\.]/g, '') || ''
  window.open(`https://wa.me/${phone ? phone.replace(/^\+/, '') : ''}?text=${text}`, '_blank')
}

export function shareReceiptByEmail(numero, total, email) {
  const subject = encodeURIComponent(`Reçu GESTOCOM CI N°${numero}`)
  const body = encodeURIComponent(
    `Bonjour,\n\nVoici votre reçu GESTOCOM CI :\n\n` +
    `Numéro: ${numero}\n` +
    `Total: ${total.toLocaleString('fr-FR')} FCFA\n` +
    `Vérification: https://gestocom.ci/verify/${numero}\n\n` +
    `Cordialement,\n${getCompanySettings().nom || 'LES RETROUVAILLES CEZ LUICI'}`
  )
  window.open(`mailto:${email || ''}?subject=${subject}&body=${body}`, '_blank')
}
