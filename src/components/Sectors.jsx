import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart, ArrowRight, ChevronRight } from 'lucide-react'
import { SECTORS } from '../lib/modules'

const ICON_MAP = {
  ShoppingCart,
  Landmark,
  Factory,
  Truck,
  Heart,
  GraduationCap,
  HandHeart,
}

const COLOR_MAP = {
  brand: {
    bg: 'bg-brand-50',
    icon: 'text-brand-500',
    border: 'hover:border-brand-300',
    badge: 'bg-brand-100 text-brand-700',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-500',
    border: 'hover:border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-500',
    border: 'hover:border-amber-300',
    badge: 'bg-amber-100 text-amber-700',
  },
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-500',
    border: 'hover:border-sky-300',
    badge: 'bg-sky-100 text-sky-700',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-500',
    border: 'hover:border-rose-300',
    badge: 'bg-rose-100 text-rose-700',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-500',
    border: 'hover:border-violet-300',
    badge: 'bg-violet-100 text-violet-700',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-500',
    border: 'hover:border-teal-300',
    badge: 'bg-teal-100 text-teal-700',
  },
}

export default function Sectors() {
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

    const cards = sectionRef.current?.querySelectorAll('.sector-card')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  const sectors = Object.values(SECTORS)

  return (
    <section id="sectors" className="section-padding">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-brand-500 bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            Secteurs d'activité
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-4">
            Adapté à votre secteur
          </h2>
          <p className="text-lg text-dark-500 max-w-2xl mx-auto">
            Choisissez votre secteur et activez les modules qui vous correspondent.
            <br className="hidden sm:block" />
            Chaque secteur dispose d'outils sur mesure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sectors.map((sector, index) => {
            const IconComp = ICON_MAP[sector.icon] || ShoppingCart
            const colors = COLOR_MAP[sector.color] || COLOR_MAP.brand

            return (
              <Link
                key={sector.id}
                to={`/inscription?secteur=${sector.id}`}
                className={`sector-card card group opacity-0 ${colors.border}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <IconComp className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                    {sector.modules.length} modules
                  </span>
                </div>

                <h3 className="text-lg font-bold text-dark-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {sector.nom}
                </h3>
                <p className="text-sm text-dark-500 leading-relaxed mb-4">
                  {sector.description}
                </p>

                <div className="flex items-center gap-1 text-sm font-medium text-brand-500 group-hover:text-brand-600 transition-colors mt-auto">
                  Commencer
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
