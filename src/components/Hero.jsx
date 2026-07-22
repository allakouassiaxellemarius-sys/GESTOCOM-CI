import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Play } from 'lucide-react'

export default function Hero() {
  const heroRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up')
          setLoaded(true)
        }
      },
      { threshold: 0.1 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-50/80 via-white to-gold-50/40" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-200/20 rounded-full blur-3xl" />

      {/* Floating particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-brand-400 rounded-full animate-float opacity-40" />
      <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-gold-400 rounded-full animate-float opacity-30" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-brand-300 rounded-full animate-float opacity-50" style={{ animationDelay: '4s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div ref={heroRef} className="text-center max-w-4xl mx-auto opacity-0">

          {/* Badge */}
          <div className={`inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 mb-8 transition-all duration-700 ${loaded ? 'animate-fade-in-down' : 'opacity-0'}`}>
            <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
            <span className="text-sm font-medium text-brand-700">
              100% gratuit — Données locales, pas de serveur
            </span>
          </div>

          {/* Main title */}
          <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight transition-all duration-1000 delay-300 ${loaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-gold-500 bg-clip-text text-transparent">
              Gérez votre commerce
            </span>
            <br />
            <span className="text-dark-900 dark:text-white">
              avec GESTOCOM CI
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg sm:text-xl text-dark-600 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-1000 delay-500 ${loaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            Gérez votre commerce, votre stock et votre comptabilité — adapté à votre secteur, en français, pour la Côte d'Ivoire.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-1000 delay-700 ${loaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <Link to="/inscription" className="group btn-primary text-base px-8 py-4 w-full sm:w-auto flex items-center justify-center gap-2">
              Créer un compte
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="group flex items-center gap-2 text-base px-8 py-4 w-full sm:w-auto justify-center rounded-xl border-2 border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-all font-semibold">
              Se connecter
            </Link>
          </div>

          {/* App Preview */}
          <div className={`relative max-w-3xl mx-auto transition-all duration-1000 delay-1000 ${loaded ? 'animate-scale-in' : 'opacity-0'}`}>
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/20 to-gold-500/20 rounded-3xl blur-2xl" />
            <div className="relative bg-dark-950 rounded-2xl shadow-2xl overflow-hidden border border-dark-200">
              <div className="flex items-center gap-2 px-4 py-3 bg-dark-900 border-b border-dark-800">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 hover:scale-110 transition-transform cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-gold-500 hover:scale-110 transition-transform cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-green-500 hover:scale-110 transition-transform cursor-pointer" />
                </div>
                <span className="text-xs text-dark-400 ml-2 font-mono">GESTOCOM CI</span>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-green-400">Analyses actives</span>
                </div>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-dark-900 rounded-xl p-3 sm:p-4 border border-dark-800 hover:border-brand-500/30 transition-colors">
                  <div className="text-xs text-dark-400 mb-1">Chiffre d'affaires</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">2.5M FCFA</div>
                  <div className="text-[10px] sm:text-xs text-green-400 mt-1 flex items-center gap-1">
                    <span className="inline-block w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-green-400" />
                    +12%
                  </div>
                </div>
                <div className="bg-dark-900 rounded-xl p-3 sm:p-4 border border-dark-800 hover:border-gold-500/30 transition-colors">
                  <div className="text-xs text-dark-400 mb-1">Alertes Stock</div>
                  <div className="text-xl sm:text-2xl font-bold text-gold-400">3</div>
                  <div className="text-[10px] sm:text-xs text-gold-400 mt-1">1 critique · 2 moyennes</div>
                </div>
                <div className="bg-dark-900 rounded-xl p-3 sm:p-4 border border-dark-800 hover:border-green-500/30 transition-colors">
                  <div className="text-xs text-dark-400 mb-1">Profit net</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-400">850K FCFA</div>
                  <div className="text-[10px] sm:text-xs text-green-400 mt-1">+8%</div>
                </div>
                <div className="col-span-2 sm:col-span-3 bg-dark-900 rounded-xl p-4 border border-dark-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-dark-400">Multi-secteurs</span>
                    <span className="text-xs text-brand-400 font-medium">7 secteurs disponibles</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-left">
                    <div className="text-xs text-dark-500">
                      <span className="text-dark-300">📦 Commerce</span> — stocks, ventes, facturation
                    </div>
                    <div className="text-xs text-dark-500">
                      <span className="text-dark-300">💰 Finance</span> — comptabilité OHADA
                    </div>
                    <div className="text-xs text-dark-500">
                      <span className="text-dark-300">🏭 Industrie</span> — production, traçabilité
                    </div>
                    <div className="text-xs text-dark-500">
                      <span className="text-dark-300">🚚 Transport</span> — livraisons, véhicules
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
