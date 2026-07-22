import { ChevronLeft, ChevronRight } from 'lucide-react'

function generatePages(currentPage, totalPages, siblingCount) {
  const totalSlots = siblingCount * 2 + 3

  if (totalPages <= totalSlots) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1)
  const rightSibling = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < totalPages - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: totalSlots - 1 }, (_, i) => i + 1)
    return [...leftRange, '...', totalPages]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: totalSlots - 1 },
      (_, i) => totalPages - (totalSlots - 2) + i
    )
    return [1, '...', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  )
  return [1, '...', ...middleRange, '...', totalPages]
}

export default function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1 }) {
  const pages = generatePages(currentPage, totalPages, siblingCount)

  return (
    <nav className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg
          text-dark-600 dark:text-dark-300 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600
          hover:bg-dark-50 dark:hover:bg-dark-700
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-dark-800
          transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="hidden sm:flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-10 h-10 flex items-center justify-center text-sm text-dark-400 dark:text-dark-500"
              >
                ...
              </span>
            )
          }

          const isActive = page === currentPage
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors
                ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                    : 'text-dark-600 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700'
                }`}
            >
              {page}
            </button>
          )
        })}
      </div>

      <span className="sm:hidden w-10 h-10 flex items-center justify-center text-sm font-medium text-brand-500">
        {currentPage}/{totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg
          text-dark-600 dark:text-dark-300 bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-600
          hover:bg-dark-50 dark:hover:bg-dark-700
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-dark-800
          transition-colors"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  )
}
