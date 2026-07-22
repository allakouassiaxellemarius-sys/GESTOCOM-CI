import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inscrire, validatePassword, getCompanySettings, saveCompanySettings, addLog, setCurrentAdminId } from '../lib/db'
import { isFirebaseReady } from '../lib/firebase'
import { pushToFirestore } from '../lib/firebaseSync'
import { normalizePhone, isPhoneValid, formatPhoneDisplay } from '../lib/phone'
import { envoyerEmailOTP, verifierOTP } from '../lib/verification'
import { useAuth } from '../context/AuthContext'
import { SECTORS, MODULE_LABELS } from '../lib/modules'
import { ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart, Check, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle, Shield, Mail, RefreshCw, ArrowRight, Circle, CircleDot } from 'lucide-react'

const ICONS = { ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart }

const COLOR_CLASSES = {
  brand: 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600',
  emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
  amber: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600',
  sky: 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600',
  rose: 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600',
  violet: 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600',
  teal: 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-600',
}

const roles = [
  { value: 'vendeur', label: 'Vendeur', desc: 'Ventes, stock' },
  { value: 'comptable', label: 'Comptable', desc: 'Rapports, dépenses' },
  { value: 'admin', label: 'Admin', desc: 'Accès total' },
]

const STEP_LABELS = ['Modules', 'Compte', 'Email']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-5 px-4">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < current
        const active = stepNum === current
        return (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div className={`h-0.5 w-8 sm:w-12 transition-colors duration-300 ${done ? 'bg-green-500' : 'bg-gray-200 dark:bg-dark-600'}`} />
            )}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done ? 'bg-green-500 text-white' : active ? 'bg-brand-500 text-white ring-2 ring-brand-200 dark:ring-brand-800' : 'bg-gray-200 dark:bg-dark-600 text-gray-500 dark:text-gray-400'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span className={`text-[10px] mt-1 font-medium ${active ? 'text-brand-600 dark:text-brand-400' : done ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const level = score <= 2 ? 1 : score <= 3 ? 2 : 3
  const color = level === 1 ? 'bg-red-500' : level === 2 ? 'bg-amber-500' : 'bg-green-500'
  const label = level === 1 ? 'Faible' : level === 2 ? 'Moyen' : 'Fort'
  const textColor = level === 1 ? 'text-red-500' : level === 2 ? 'text-amber-500' : 'text-green-500'

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${level >= i ? color : 'bg-gray-200 dark:bg-dark-600'}`} />
        ))}
      </div>
      <p className={`text-[11px] mt-1 ${textColor}`}>{label}</p>
    </div>
  )
}

export default function InscriptionPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', motDePasse: '', confirmation: '', role: 'vendeur' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enabledSectors, setEnabledSectors] = useState(['commerce'])
  const [showModules, setShowModules] = useState(null)
  const [pendingUserId, setPendingUserId] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(60)
  const [otpResendable, setOtpResendable] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const emailRef = useRef(null)
  const phoneRef = useRef(null)
  const pwRef = useRef(null)
  const confirmRef = useRef(null)

  const update = (key, val) => setForm({ ...form, [key]: val })

  const isEmailValid = form.email.includes('@') && form.email.includes('.') && form.email.length > 5
  const isPhoneOk = form.telephone.length === 0 ? null : isPhoneValid(form.telephone)
  const pwMatch = form.confirmation.length > 0 && form.motDePasse === form.confirmation

  const toggleSector = (sectorId) => {
    setEnabledSectors(prev =>
      prev.includes(sectorId)
        ? prev.filter(s => s !== sectorId)
        : [...prev, sectorId]
    )
  }

  const handleModules = () => {
    if (enabledSectors.length === 0) return
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (loading) return

    if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim() || !form.motDePasse) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    if (!isEmailValid) {
      setError('Adresse email invalide')
      return
    }
    if (!isPhoneValid(form.telephone)) {
      setError('Numéro de téléphone invalide (10 chiffres requis)')
      return
    }
    const pwErrors = validatePassword(form.motDePasse)
    if (pwErrors.length > 0) {
      setError(`Mot de passe trop faible : ${pwErrors.join(', ')}`)
      return
    }
    if (form.motDePasse !== form.confirmation) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const result = await inscrire(form.nom.trim(), form.motDePasse, form.email.trim(), normalizePhone(form.telephone.trim()), form.role)
      if (result.error) {
        setError(result.error)
        return
      }

      if (result.user?.id) {
        setCurrentAdminId(result.user.id)
      }

      const settings = getCompanySettings()
      saveCompanySettings({ ...settings, enabledSectors, modulesConfigured: true })
      addLog('Modules configurés', enabledSectors.join(', '))

      if (isFirebaseReady() && result.user?.id) {
        const email = form.email.trim() || form.nom.trim()
        pushToFirestore(email, result.user.id).catch(() => {})
      }

      if (result.user?.id) {
        setPendingUserId(result.user.id)
        const otpResult = await envoyerEmailOTP(result.user.id, form.email.trim())
        if (otpResult?.success) {
          setStep(3)
          setOtpCountdown(60)
          setOtpResendable(false)
        } else {
          setSuccess(true)
          setTimeout(async () => {
            try {
              const loginResult = await login(form.nom.trim(), form.motDePasse)
              if (loginResult === true) navigate('/app')
              else { setSuccess(false); setError('Compte créé mais connexion échouée.') }
            } catch { setSuccess(false); setError('Compte créé mais connexion échouée.') }
          }, 1500)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (step !== 3) return
    setOtpCountdown(60)
    setOtpResendable(false)
    const iv = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) { setOtpResendable(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [step])

  // Auto-submit OTP when 6 digits entered
  useEffect(() => {
    if (otpCode.length === 6 && step === 3) {
      const timer = setTimeout(() => {
        const form = document.getElementById('otp-form')
        if (form) form.requestSubmit()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [otpCode, step])

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setOtpError('')
    if (otpCode.length !== 6) { setOtpError('Code à 6 chiffres requis'); return }

    const result = verifierOTP(pendingUserId, 'email', otpCode)
    if (result?.valid) {
      setSuccess(true)
      setTimeout(async () => {
        try {
          const loginResult = await login(form.nom.trim(), form.motDePasse)
          if (loginResult === true) navigate('/app')
          else { setSuccess(false); setError('Vérification réussie mais connexion échouée.') }
        } catch { setSuccess(false); setError('Vérification réussie mais connexion échouée.') }
      }, 1500)
    } else {
      setOtpError(result?.error || 'Code incorrect ou expiré')
      setOtpCode('')
    }
  }

  const handleResendOTP = async () => {
    setOtpSending(true)
    const result = await envoyerEmailOTP(pendingUserId, form.email.trim())
    setOtpSending(false)
    if (result?.success) {
      setOtpResendable(false)
      setOtpCountdown(60)
      setOtpError('')
    } else {
      setOtpError('Erreur lors du renvoi. Réessayez.')
    }
  }

  if (success) {
    return (
      <div className="h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-brand-900/20 dark:via-dark-800 dark:to-gold-900/20 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-dark-700 text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 dark:text-white">Compte créé !</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connexion en cours...</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-brand-900/20 dark:via-dark-800 dark:to-gold-900/20 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md max-h-full overflow-y-auto">
        <div className="text-center mb-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-orange-500/30 overflow-hidden">
            <div className="flex items-end gap-0.5 h-5">
              <div className="w-1.5 h-2 bg-green-300 rounded-sm"></div>
              <div className="w-1.5 h-3.5 bg-orange-300 rounded-sm"></div>
              <div className="w-1.5 h-5 bg-green-300 rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-xl font-bold dark:text-white">GESTOCOM CI</h1>
        </div>

        <StepIndicator current={step} />

        {step === 1 && (
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Sélectionnez les secteurs d'activité de votre commerce. Vous pouvez en choisir plusieurs.
            </p>

            <div className="space-y-3 mb-5">
              {Object.values(SECTORS).map(sector => {
                const Icon = ICONS[sector.icon] || ShoppingCart
                const enabled = enabledSectors.includes(sector.id)
                return (
                  <div key={sector.id}>
                    <button
                      type="button"
                      onClick={() => toggleSector(sector.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        enabled
                          ? `${COLOR_CLASSES[sector.color]} border-current shadow-md`
                          : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            enabled ? 'bg-white/80 dark:bg-white/10' : 'bg-gray-100 dark:bg-dark-700'
                          }`}>
                            <Icon className={`w-4 h-4 ${enabled ? 'text-current' : 'text-gray-500 dark:text-gray-400'}`} />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${enabled ? '' : 'dark:text-white'}`}>{sector.nom}</div>
                            <div className={`text-[11px] ${enabled ? 'opacity-70' : 'text-gray-400 dark:text-gray-500'}`}>
                              {sector.modules.length} modules
                            </div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${enabled ? 'bg-current' : 'bg-gray-200 dark:bg-dark-600'}`}>
                          {enabled && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </button>

                    {showModules === sector.id && (
                      <div className="mt-2 ml-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        {sector.modules.map(mod => (
                          <div key={mod} className="flex items-center gap-2 py-1 text-xs text-gray-600 dark:text-gray-400">
                            <Check className="w-3 h-3 text-green-500" />
                            {MODULE_LABELS[mod]}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Link to="/login" className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-center">
                J'ai déjà un compte
              </Link>
              <button
                onClick={handleModules}
                disabled={enabledSectors.length === 0}
                className="flex-1 btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Suivant ({enabledSectors.length} secteur{enabledSectors.length > 1 ? 's' : ''})
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur *</label>
                <input type="text" value={form.nom} onChange={e => update('nom', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white transition-all"
                  placeholder="Ex: moussa" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <div className="relative">
                  <input ref={emailRef} type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); phoneRef.current?.focus() } }}
                    className={`w-full px-3 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white transition-all ${
                      isEmailValid ? 'border-green-400 dark:border-green-600 focus:border-green-500' : 'border-gray-300 dark:border-dark-600 focus:border-brand-500'
                    }`}
                    placeholder="moussa@email.com" required />
                  {isEmailValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-600 dark:text-green-400">+225</span>
                  <input ref={phoneRef} type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); pwRef.current?.focus() } }}
                    className={`w-full pl-14 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white transition-all ${
                      isPhoneOk === true ? 'border-green-400 dark:border-green-600 focus:border-green-500' : isPhoneOk === false ? 'border-amber-400 dark:border-amber-600 focus:border-amber-500' : 'border-gray-300 dark:border-dark-600 focus:border-brand-500'
                    }`}
                    placeholder="XX XX XX XX XX" required />
                  {isPhoneOk === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                  {isPhoneOk === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </div>
                {form.telephone && isPhoneOk === false && (
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">10 chiffres requis</p>
                )}
                {form.telephone && isPhoneOk === true && (
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">{formatPhoneDisplay(form.telephone)}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rôle</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(r => (
                    <button key={r.value} type="button" onClick={() => update('role', r.value)}
                      className={`px-3 py-2.5 rounded-xl border text-center transition-all ${
                        form.role === r.value
                          ? 'border-brand-400 dark:border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-200 dark:ring-brand-800'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                      }`}>
                      <div className={`text-sm font-semibold ${form.role === r.value ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>{r.label}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe *</label>
                <div className="relative">
                  <input ref={pwRef} type={showPw ? 'text' : 'password'} value={form.motDePasse} onChange={e => update('motDePasse', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmRef.current?.focus() } }}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none pr-10 bg-white dark:bg-dark-700 dark:text-white transition-all"
                    placeholder="8+ car., 1 majuscule, 1 chiffre" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={form.motDePasse} />
                {form.motDePasse && (
                  <div className="mt-1.5 space-y-0">
                    {[
                      [form.motDePasse.length >= 8, '8 caractères minimum'],
                      [/[A-Z]/.test(form.motDePasse), '1 majuscule'],
                      [/[0-9]/.test(form.motDePasse), '1 chiffre'],
                    ].map(([ok, label]) => (
                      <div key={label} className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-green-600' : 'text-red-400'}`}>
                        {ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe *</label>
                <div className="relative">
                  <input ref={confirmRef} type="password" value={form.confirmation} onChange={e => update('confirmation', e.target.value)}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white transition-all ${
                      form.confirmation.length > 0
                        ? pwMatch ? 'border-green-400 dark:border-green-600 focus:border-green-500' : 'border-red-300 dark:border-red-600 focus:border-red-500'
                        : 'border-gray-300 dark:border-dark-600 focus:border-brand-500'
                    }`}
                    placeholder="Retapez le mot de passe" required />
                  {form.confirmation.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {pwMatch ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    </div>
                  )}
                </div>
                {form.confirmation && !pwMatch && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                )}
                {form.confirmation && pwMatch && (
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">Les mots de passe correspondent</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
              >
                Retour
              </button>
              <button type="submit" className="flex-1 btn-primary py-2.5 disabled:opacity-50 flex items-center justify-center gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-2 text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Déjà un compte ? </span>
              <Link to="/login" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">Se connecter</Link>
            </div>
          </form>
        )}

        {step === 3 && (
          <form id="otp-form" onSubmit={handleVerifyOTP} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold dark:text-white">Vérifiez votre email</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Un code à 6 chiffres a été envoyé à<br />
                <span className="font-medium text-gray-700 dark:text-gray-300">{form.email}</span>
              </p>
            </div>

            {otpError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {otpError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code de vérification</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onPaste={e => {
                    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
                    if (text) setOtpCode(text)
                  }}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg text-2xl font-mono text-center tracking-[0.5em] focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {otpCountdown > 0 ? `${otpCountdown}s` : ''}
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2" disabled={otpCode.length !== 6}>
              <Shield className="w-4 h-4" />
              Vérifier mon email
            </button>

            <div className="flex items-center justify-between mt-3">
              <button type="button" onClick={() => setStep(2)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2">
                Retour
              </button>
              <button type="button" onClick={handleResendOTP} disabled={!otpResendable || otpSending}
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 py-2">
                <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
                {otpSending ? 'Envoi...' : otpResendable ? 'Renvoyer' : `Renvoyer (${otpCountdown}s)`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}