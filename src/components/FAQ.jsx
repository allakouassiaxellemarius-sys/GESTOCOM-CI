import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Puis-je changer de secteur après inscription ?',
    answer:
      'Oui, vous pouvez modifier vos secteurs et modules à tout moment depuis les paramètres de votre application. L\'ajout ou retrait de modules est immédiat.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'Oui. Toutes vos données sont stockées localement sur votre appareil (localStorage pour le web, SQLite pour le desktop). Aucune donnée n\'est envoyée vers un serveur externe. Vous êtes le seul propriétaire.',
  },
  {
    question: 'Le logiciel fonctionne-t-il sans internet ?',
    answer:
      'Oui, le logiciel fonctionne entièrement hors ligne. Une connexion internet n\'est nécessaire que pour télécharger l\'application.',
  },
  {
    question: 'Y a-t-il une application mobile ?',
    answer:
      'GESTOCOM CI est disponible en application Android (APK) et desktop (Windows, Mac, Linux). La version web est également accessible depuis n\'importe quel navigateur.',
  },
  {
    question: 'Combien d\'utilisateurs puis-je ajouter ?',
    answer:
      'Il n\'a pas de limite. Vous pouvez créer autant d\'utilisateurs que nécessaire avec des rôles distincts (admin, comptable, vendeur). Les données restent locales sur l\'appareil.',
  },
  {
    question: 'Le logiciel génère-t-il des reçus ?',
    answer:
      'Oui, des reçus PDF sont générés instantanément à chaque vente. Vous pouvez les imprimer, les partager par WhatsApp ou email, et les retrouver dans l\'historique.',
  },
  {
    question: 'J\'ai oublié mon mot de passe, que faire ?',
    answer:
      'Rendez-vous sur la page "Mot de passe oublié" depuis l\'écran de connexion. Le compte administrateur peut être réinitialisé directement. Pour les autres comptes, contactez le support WhatsApp.',
  },
  {
    question: 'Comment fonctionne l\'alerte de stock ?',
    answer:
      'Le logiciel surveille automatiquement vos niveaux de stock. Quand un produit atteint le seuil que vous avez défini, une alerte s\'affiche sur le tableau de bord. Pas d\'intelligence artificielle — juste des règles simples et efficaces.',
  },
]

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border border-dark-200 rounded-xl overflow-hidden hover:border-brand-200 transition-colors">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-base font-semibold text-dark-900 pr-4">
          {faq.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-dark-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-5 pb-5 text-sm text-dark-500 leading-relaxed">
          {faq.answer}
        </p>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="faq" className="section-padding bg-dark-50/50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-brand-500 bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-lg text-dark-500">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
