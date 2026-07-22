import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: 7, suffix: '', label: 'Secteurs d\'activité', duration: 1500 },
  { value: 43, suffix: '+', label: 'Modules disponibles', duration: 2000 },
  { value: 3, suffix: '', label: 'Plateformes (Web, Desktop, Mobile)', duration: 1000 },
  { value: 0, suffix: ' FCFA', label: 'Prix — 100% gratuit', duration: 1500 },
]

function useCountUp(end, duration, start) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, start])

  return count
}

function StatItem({ stat, inView }) {
  const count = useCountUp(stat.value, stat.duration, inView)

  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2">
        {count}
        <span className="text-gold-400">{stat.suffix}</span>
      </div>
      <p className="text-sm sm:text-base text-dark-300 font-medium">
        {stat.label}
      </p>
    </div>
  )
}

export default function Stats() {
  const [inView, setInView] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
        }
      },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900 via-dark-950 to-dark-900" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-500 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}
