import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-scale-in')
          entry.target.style.opacity = '1'
        }
      },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="cta" className="section-padding">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-dark-900 px-4 py-12 sm:px-8 sm:py-16 md:px-16 md:py-20 text-center opacity-0">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
              Prêt à simplifier la gestion<br className="hidden sm:block" /> de votre commerce ?
            </h2>

            <p className="text-lg text-brand-100 max-w-2xl mx-auto mb-10 leading-relaxed">
              GESTOCOM CI est un logiciel local, gratuit et adapté aux PME ivoiriennes. Vos données restent chez vous.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/inscription"
                className="btn-gold text-sm sm:text-base px-5 py-3 sm:px-8 sm:py-4 shadow-xl shadow-gold-500/30 hover:shadow-2xl hover:shadow-gold-500/40 inline-flex items-center gap-2"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <p className="text-sm text-brand-200 mt-6">
              100% gratuit · Données locales · Pas de serveur
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
