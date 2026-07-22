import { useEffect, useRef } from 'react'
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  Receipt,
  TrendingUp,
  Shield,
  Bell,
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Tableau de bord',
    description: "Vue d'ensemble du chiffre d'affaires, des alertes stock et des indicateurs clés en temps réel.",
    color: 'from-brand-500 to-brand-600',
    bgColor: 'bg-brand-50',
    iconColor: 'text-brand-500',
  },
  {
    icon: Package,
    title: 'Gestion de stock',
    description: 'Produits, catégories, mouvements de stock, seuils d\'alerte et inventaire. Adapté à votre secteur.',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  {
    icon: ShoppingCart,
    title: 'Ventes & facturation',
    description: 'Enregistrement des ventes, calcul automatique du total, reçus PDF et historique complet.',
    color: 'from-gold-500 to-gold-600',
    bgColor: 'bg-gold-50',
    iconColor: 'text-gold-600',
  },
  {
    icon: Receipt,
    title: 'Dépenses',
    description: 'Suivi des dépenses par catégorie, consultation et rapports. Tout est traçable.',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-500',
  },
  {
    icon: TrendingUp,
    title: 'Profit & rapports',
    description: 'Bénéfice calculé automatiquement : ventes moins dépenses. Rapports PDF exportables.',
    color: 'from-emerald-500 to-green-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Users,
    title: 'Fournisseurs',
    description: 'Répertoire complet avec contacts, historique d\'approvisionnement et suivi des commandes.',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  {
    icon: Shield,
    title: 'Multi-utilisateurs',
    description: 'Trois rôles : admin, comptable, vendeur. Chacun accède à ses fonctionnalités. Sécurisé.',
    color: 'from-dark-700 to-dark-900',
    bgColor: 'bg-dark-50',
    iconColor: 'text-dark-700',
  },
  {
    icon: Bell,
    title: 'Alertes automatiques',
    description: 'Notifications pour les stocks bas, les péremptions et les anomalies de marge. Règles simples, pas d\'IA.',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-500',
  },
]

export default function Features() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up')
            entry.target.style.opacity = '1'
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const cards = sectionRef.current?.querySelectorAll('.feature-card')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="section-padding bg-dark-50/50">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-brand-500 bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            Fonctionnalités
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-4">
            Tout ce qu'il faut pour gérer votre commerce
          </h2>
          <p className="text-lg text-dark-500 max-w-2xl mx-auto">
            Une suite complète d'outils pour piloter votre activité au quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card card group cursor-default opacity-0"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 
                group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-dark-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-dark-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
