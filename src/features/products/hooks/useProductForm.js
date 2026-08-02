// Hook : gestion de l'état du formulaire produit.
// Encapsule l'état, les suggestions de nom, la marge auto et le prix suggéré.

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { productToForm, toNumber } from '../domain/productBuilder'
import { computeMargin, suggestedSellingPrice } from '../domain/productPricing'
import { searchProductsV2 } from '../../../lib/stockDb'

export function useProductForm(product) {
  const isEdit = !!product?.id
  const [form, setForm] = useState(() => productToForm(product))
  const [errors, setErrors] = useState({})
  const [showScanner, setShowScanner] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState([])
  const nameRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Met à jour un champ du formulaire.
  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  // Met à jour un champ de specifications.
  const setSpecification = useCallback((key, value) => {
    setForm(prev => ({ ...prev, specifications: { ...prev.specifications, [key]: value } }))
  }, [])

  // Réinitialise les erreurs à l'ouverture.
  useEffect(() => { setErrors({}) }, [product?.id])

  // Suggestions de nom à partir des produits existants.
  useEffect(() => {
    if (form.nom && form.nom.length >= 2 && !isEdit) {
      const results = searchProductsV2(form.nom)
      const filtered = results.filter(p => String(p.nom).toLowerCase() !== String(form.nom).toLowerCase())
      setNameSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setNameSuggestions([])
      setShowSuggestions(false)
    }
  }, [form.nom, isEdit])

  // Fermer les suggestions au clic extérieur.
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) && nameRef.current && !nameRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Marge et bénéfice calculés en direct.
  const marginInfo = useMemo(() => {
    return computeMargin(toNumber(form.prixAchat), toNumber(form.prixVente), toNumber(form.margeMinimum))
  }, [form.prixAchat, form.prixVente, form.margeMinimum])

  // Suggère un prix de vente quand on saisit le prix d'achat (si prix de vente vide).
  const handleCostPriceChange = useCallback((value) => {
    const cost = toNumber(value)
    setForm(prev => {
      const updated = { ...prev, prixAchat: cost }
      if (cost > 0 && (!prev.prixVente || prev.prixVente === 0)) {
        updated.prixVente = suggestedSellingPrice(cost)
      }
      return updated
    })
  }, [])

  // Pré-remplit le formulaire depuis un produit existant.
  const handleQuickFill = useCallback((p) => {
    setForm(prev => ({
      ...prev,
      nom: p.nom,
      secteur: p.secteur || 'detail',
      categorie: p.categorie || '',
      unite: p.unite || 'pièce',
      prixAchat: toNumber(p.prixAchat),
      prixVente: toNumber(p.prixVente),
      margeMinimum: toNumber(p.margeMinimum, 10),
      emplacement: p.emplacement || '',
      entrepot: p.entrepot || 'Principal',
      description: p.description || '',
    }))
    setShowSuggestions(false)
  }, [])

  // Code-barres scanné dans le formulaire.
  const handleScan = useCallback((code) => {
    setForm(prev => ({ ...prev, barcode: code }))
    setShowScanner(false)
  }, [])

  const setErrorsAll = useCallback((errs) => setErrors(errs || {}), [])

  return {
    form, setForm, setField, setSpecification, errors, setErrorsAll,
    isEdit,
    marginInfo, handleCostPriceChange,
    nameSuggestions, showSuggestions, setShowSuggestions,
    nameRef, suggestionsRef, handleQuickFill,
    showScanner, setShowScanner, handleScan,
  }
}
