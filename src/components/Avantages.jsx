import { useEffect, useRef } from 'react'
import { Smartphone, Shield, HeadphonesIcon, Globe, Puzzle, Clock } from 'lucide-react'

const avantages = [
  {
    icon: Puzzle,
    title: 'Modules activables',
    description: 'Ne payez que ce dont vous avez besoin. Activez les modules par secteur, quand vous voulez.',
  },
  {
    icon: Globe,
    title: 'Interface en français',
    description: 'Tout est en français, conçu pour les entrepreneurs ivoiriens. Pas de barrière linguistique.',
  },
  {
    icon: Smartphone,
    title: 'Accessible sur mobile',
    description: 'Utilisez GESTOCOM CI depuis votre smartphone, tablette ou ordinateur. Partout, tout le temps.',
  },
  {
    icon: Shield,
    title: 'Données sécurisées',
    description: 'Vos données restent sur votre appareil. Aucune fuite, aucun serveur externe. Vous êtes propriétaire.',
  },
  {
    icon: Clock,
    title: 'Fonctionne hors ligne',
    description: 'Pas besoin d\'internet au quotidien. Le logiciel fonctionne entièrement en local sur votre appareil.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Support local',
    description: 'Une question ? Un problème ? Notre équipe est joignable par WhatsApp pour vous accompagner.',
  },
]

export default function Avantages() {
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

    const cards = sectionRef.current?.querySelectorAll('.avantage-card')
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section id="avantages" className="section-padding bg-dark-50/50">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-gold-600 bg-gold-50 px-4 py-1.5 rounded-full mb-4">
            Pourquoi GESTOCOM
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-4">
            Conçu pour les PME ivoiriennes
          </h2>
          <p className="text-lg text-dark-500 max-w-2xl mx-auto">
            GESTOCOM CI est un logiciel local, simple et adapté à la réalité des commerces en Côte d'Ivoire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {avantages.map((item, index) => (
            <div
              key={item.title}
              className="avantage-card text-center opacity-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 bg-white rounded-2xl shadow-md border border-dark-100 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-7 h-7 text-brand-500" />
              </div>
              <h3 className="text-lg font-bold text-dark-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-dark-500 leading-relaxed max-w-xs mx-auto">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
