import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, LayoutDashboard, Rocket, BarChart3 } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Créez votre compte',
    description:
      'Inscrivez-vous gratuitement en choisissant votre secteur d\'activité. Pas de carte bancaire, pas d\'abonnement.',
  },
  {
    number: '02',
    icon: LayoutDashboard,
    title: 'Choisissez vos modules',
    description:
      'Activez les modules adaptés à votre commerce : stock, ventes, comptabilité, et plus encore.',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Configurez votre activité',
    description:
      'Ajoutez vos produits, services et paramètres en quelques clics. Le logiciel s\'adapte à vous.',
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Gérez au quotidien',
    description:
      'Ventes, stocks, dépenses, rapports — tout est accessible directement depuis votre tableau de bord.',
  },
]

export default function HowItWorks() {
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
      { threshold: 0.15 }
    )

    const items = sectionRef.current?.querySelectorAll('.step-item')
    items?.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return (
    <section id="how-it-works" className="section-padding">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-gold-600 bg-gold-50 px-4 py-1.5 rounded-full mb-4">
            Démarrage
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-4">
            Prêt en 4 étapes simples
          </h2>
          <p className="text-lg text-dark-500 max-w-2xl mx-auto">
            De l'inscription à la gestion quotidienne, tout est pensé pour être simple et rapide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-brand-200 via-gold-200 to-brand-200" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="step-item relative text-center opacity-0"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 bg-white border-4 border-brand-500 rounded-2xl shadow-lg shadow-brand-500/20 mb-6">
                <step.icon className="w-7 h-7 text-brand-500" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-6xl font-black text-brand-100 -z-0 select-none">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-dark-900 mb-3 mt-2">
                {step.title}
              </h3>
              <p className="text-sm text-dark-500 leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/inscription" className="btn-primary inline-flex items-center gap-2">
            Commencer maintenant
          </Link>
        </div>
      </div>
    </section>
  )
}
