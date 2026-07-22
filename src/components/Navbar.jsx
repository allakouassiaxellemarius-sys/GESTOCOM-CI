import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Zap, Download } from 'lucide-react'

const navLinks = [
  { label: 'Secteurs', href: '#sectors' },
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-dark-900/5 border-b border-dark-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-dark-900">
              GESTOCOM <span className="gradient-text">CI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-dark-600 hover:text-brand-500 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 rounded-full group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!window.electronAPI && (
              <Link to="/download" className="flex items-center gap-1.5 text-sm font-medium text-dark-600 hover:text-brand-500 transition-colors">
                <Download className="w-4 h-4" /> Télécharger
              </Link>
            )}
            <Link to="/login" className="btn-secondary text-sm py-2.5 px-5">
              Se connecter
            </Link>
            <Link to="/inscription" className="btn-primary text-sm py-2.5 px-5">
              Créer un compte
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-dark-50 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-dark-100 animate-fade-in-down">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block text-base font-medium text-dark-700 hover:text-brand-500 transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              {!window.electronAPI && (
                <Link to="/download" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 py-2.5">
                  <Download className="w-4 h-4" /> Télécharger l'application
                </Link>
              )}
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-secondary text-sm py-2.5 text-center">
                Se connecter
              </Link>
              <Link to="/inscription" onClick={() => setIsOpen(false)} className="btn-primary text-sm py-2.5 text-center">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
