import { useNavigate } from 'react-router-dom'
import { useDevice } from '../context/DeviceContext'
import { LogIn, UserPlus, Zap } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { isMobile } = useDevice()

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-[#0a0a1a] via-[#111] to-[#0a0a1a] text-white overflow-hidden relative">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo icône */}
        <div className="w-20 h-20 mb-6 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30 animate-fade-in-down">
          <Zap className="w-10 h-10 text-white" />
        </div>

        {/* Nom */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider animate-fade-in-down" style={{ animationDelay: '100ms' }}>
          GESTOCOM
        </h1>
        <p className="text-brand-400 text-sm tracking-[0.3em] mt-1 animate-fade-in-down" style={{ animationDelay: '200ms' }}>
          CI
        </p>

        {/* Tagline */}
        <p className="text-gray-400 text-xs sm:text-sm text-center mt-6 max-w-xs leading-relaxed animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          Gestion commerciale professionnelle pour les PME ivoiriennes
        </p>

        {/* Séparateur */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent mt-8 animate-fade-in" style={{ animationDelay: '400ms' }} />
      </div>

      {/* Boutons */}
      <div className="w-full max-w-sm px-6 pb-8 relative z-10 space-y-3 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-brand-500/25"
        >
          <LogIn className="w-4 h-4" />
          Connexion
        </button>
        <button
          onClick={() => navigate('/inscription')}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all active:scale-[0.97]"
        >
          <UserPlus className="w-4 h-4" />
          Créer un compte
        </button>
      </div>

      {/* Version */}
      <p className="text-[10px] text-gray-600 pb-4 relative z-10">v1.4.0</p>
    </div>
  )
}
