import { Zap, Mail, MapPin, Phone, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const footerLinks = {
  Produit: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Secteurs', href: '#sectors' },
    { label: 'FAQ', href: '#faq' },
  ],
  Entreprise: [
    { label: 'Accueil', href: '/' },
    { label: 'Contact', href: '#cta' },
    { label: 'Télécharger', href: '/download' },
    { label: 'Se connecter', href: '/login' },
  ],
  Légal: [
    { label: 'Mentions légales', href: '/mentions-legales' },
    { label: 'CGU', href: '/cgu' },
    { label: 'Politique de confidentialité', href: '/confidentialite' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-dark-950 text-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                GESTOCOM <span className="text-brand-400">CI</span>
              </span>
            </Link>
            <p className="text-sm text-dark-400 leading-relaxed mb-6 max-w-xs">
              Logiciel de gestion commerciale professionnelle pour les PME en Côte d'Ivoire.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:contact@gestocom.ci" className="flex items-center gap-2 text-dark-400 hover:text-brand-400 transition-colors">
                <Mail className="w-4 h-4" />
                contact@gestocom.ci
              </a>
              <a href="tel:+2250707070707" className="flex items-center gap-2 text-dark-400 hover:text-brand-400 transition-colors">
                <Phone className="w-4 h-4" />
                +225 07 07 07 07 07
              </a>
              <a href="https://wa.me/2250707070707" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-dark-400 hover:text-green-400 transition-colors">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <div className="flex items-center gap-2 text-dark-400">
                <MapPin className="w-4 h-4" />
                Abidjan, Côte d'Ivoire
              </div>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        to={link.href}
                        className="text-sm text-dark-400 hover:text-brand-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-dark-400 hover:text-brand-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-dark-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-500">
            &copy; {new Date().getFullYear()} GESTOCOM CI. Tous droits réservés.
          </p>

          <div className="flex items-center gap-4 text-xs text-dark-500">
            <span>Fait avec ❤️ en Côte d'Ivoire</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
