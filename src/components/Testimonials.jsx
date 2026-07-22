import { useEffect, useRef, useState } from 'react'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Aminata K.',
    role: 'Gérante de boutique, Abidjan',
    content:
      "GESTOCOM CI a transformé ma façon de gérer mon stock. Je sais exactement ce qu'il me reste et quand réapprovisionner. Les reçus PDF sont un vrai plus pour mes clients.",
    rating: 5,
    avatar: 'AK',
  },
  {
    name: 'Moussa D.',
    role: 'Pharmacien, Bouaké',
    content:
      "Le module santé est parfait pour ma pharmacie. Je suis les péremptions, je gère les ordonnances et je suis les ventes de médicaments. Tout est en français, c'est simple.",
    rating: 5,
    avatar: 'MD',
  },
  {
    name: 'Fatou B.',
      role: "Directrice d'école, Yamoussoukro",
    content:
      "La partie éducation me permet de gérer les inscriptions, les notes et les emplois du temps. Mes enseignants y accèdent directement depuis leurs téléphones.",
    rating: 5,
    avatar: 'FB',
  },
  {
    name: 'Ibrahim T.',
    role: 'Transporteur, San-Pédro',
    content:
      "Le suivi des véhicules, des chauffeurs et des livraisons est exactement ce dont j'avais besoin. Les coûts logistiques sont calculés automatiquement.",
    rating: 5,
    avatar: 'IT',
  },
  {
    name: 'Consouo A.',
    role: 'Commerçante, Cocody',
    content:
      "Je peux enfin suivre mes ventes, mes dépenses et mon profit sans perdre des heures. Le mode hors ligne est génial quand je n'ai pas de connexion.",
    rating: 5,
    avatar: 'CA',
  },
  {
    name: 'Kouadio M.',
    role: 'Directeur financier, Abidjan',
    content:
      "La comptabilité OHADA est bien implémentée. Les rapports financiers, le bilan et la balance sont générés automatiquement. Un gain de temps énorme.",
    rating: 5,
    avatar: 'KM',
  },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setVisibleCount(mq.matches ? 1 : mq.matches ? 2 : 3)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const maxIndex = testimonials.length - visibleCount

  useEffect(() => {
    if (!autoplay) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [autoplay, maxIndex])

  const prev = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  const next = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  return (
    <section id="testimonials" className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block text-sm font-semibold text-brand-500 bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            Témoignages
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-dark-500 max-w-2xl mx-auto">
            Découvrez ce que nos utilisateurs disent de GESTOCOM CI.
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${current * (100 / visibleCount)}%)` }}
            >
              {testimonials.map((t, i) => (
                <div
                  key={i}
                  className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-3"
                >
                  <div className="card h-full flex flex-col">
                    <Quote className="w-8 h-8 text-brand-200 mb-4" />
                    <p className="text-dark-600 leading-relaxed mb-6 flex-1 text-sm">
                      "{t.content}"
                    </p>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-gold-500 text-gold-500" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-4 border-t border-dark-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-dark-900">{t.name}</div>
                        <div className="text-xs text-dark-400">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border-2 border-dark-200 flex items-center justify-center 
                         hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {[...Array(maxIndex + 1)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); setAutoplay(false) }}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === current ? 'bg-brand-500 w-8' : 'bg-dark-200 hover:bg-dark-300'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border-2 border-dark-200 flex items-center justify-center 
                         hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
