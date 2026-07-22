import { Link } from 'react-router-dom'
import { ArrowLeft, Zap } from 'lucide-react'

const content = {
  'mentions-legales': {
    title: 'Mentions légales',
    sections: [
      { heading: 'Éditeur du site', text: 'GESTOCOM CI — Logiciel de gestion commerciale professionnelle. Contact : contact@gestocom.ci' },
      { heading: 'Hébergement', text: 'Le site est hébergé par Vercel, Inc., San Francisco, CA 94107, États-Unis.' },
      { heading: 'Propriété intellectuelle', text: 'L\'ensemble du contenu de ce site (textes, images, logos) est la propriété exclusive de GESTOCOM CI. Toute reproduction est interdite sans autorisation.' },
    ],
  },
  cgu: {
    title: 'Conditions Générales d\'Utilisation',
    sections: [
      { heading: 'Objet', text: 'Les présentes CGU régissent l\'utilisation du logiciel GESTOCOM CI. En utilisant le logiciel, vous acceptez ces conditions.' },
      { heading: 'Services', text: 'GESTOCOM CI met à disposition un logiciel de gestion commerciale accessible via le web, le bureau (desktop) et les appareils mobiles.' },
      { heading: 'Compte utilisateur', text: 'Vous êtes responsable de la sécurité de votre compte. Chaque utilisateur doit disposer de identifiants uniques.' },
      { heading: 'Données', text: 'Vos données sont stockées localement sur votre appareil. GESTOCOM CI n\'a pas accès à vos données de gestion.' },
    ],
  },
  confidentialite: {
    title: 'Politique de confidentialité',
    sections: [
      { heading: 'Collecte de données', text: 'GESTOCOM CI ne collecte aucune donnée personnelle de gestion. Les données de votre commerce restent sur votre appareil.' },
      { heading: 'Données de connexion', text: 'Nous pouvons collecter des informations de connexion (adresse IP, navigateur) à des fins de sécurité et d\'amélioration du service.' },
      { heading: 'Cookies', text: 'Le site utilise des cookies techniques nécessaires au fonctionnement. Aucun cookie publicitaire n\'est utilisé.' },
      { heading: 'Vos droits', text: 'Conformément à la législation ivoirienne, vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données.' },
    ],
  },
}

export default function LegalPage({ type }) {
  const data = content[type] || content['mentions-legales']

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-dark-500 hover:text-brand-500 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-dark-900">GESTOCOM CI</span>
        </div>

        <h1 className="text-3xl font-bold text-dark-900 mb-8">{data.title}</h1>

        <div className="space-y-8">
          {data.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="text-xl font-semibold text-dark-900 mb-3">{section.heading}</h2>
              <p className="text-dark-600 leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-dark-200 text-sm text-dark-400">
          <p>Dernière mise à jour : Janvier 2026</p>
        </div>
      </div>
    </div>
  )
}
