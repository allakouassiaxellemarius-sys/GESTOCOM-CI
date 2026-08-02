// Barrel : module produits (secteur commerce).
// Exporte la config déclarative, le domaine pur, le hook et les composants.

export * from './config'
export * from './domain'
export { useProductForm } from './hooks/useProductForm'
export { default as FormField } from './components/FormField'
export { default as ProductFormModal } from './components/ProductFormModal'
export { default as StockMovementModal } from './components/StockMovementModal'
