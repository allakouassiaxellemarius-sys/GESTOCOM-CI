import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inscrire, validatePassword, addLog, setCurrentAdminId } from '../lib/db'
import { isFirebaseReady } from '../lib/firebase'
import { pushToFirestore } from '../lib/firebaseSync'
import { normalizePhone, isPhoneValid, formatPhoneDisplay } from '../lib/phone'
import { envoyerEmailOTP, verifierOTP } from '../lib/verification'
import { useAuth } from '../context/AuthContext'
import { SECTORS, MODULE_LABELS } from '../lib/modules'
import AuthLayout from '../components/auth/AuthLayout'
import PasswordInput from '../components/auth/PasswordInput'
import PasswordStrength from '../components/auth/PasswordStrength'
import OTPInput from '../components/auth/OTPInput'
import StepIndicator from '../components/auth/StepIndicator'
import AuthError from '../components/auth/AuthError'
import AuthDivider from '../components/auth/AuthDivider'
import SuccessScreen from '../components/auth/SuccessScreen'
import { ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart, CheckCircle, AlertTriangle, ArrowRight, Mail, RefreshCw } from 'lucide-react'

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
const STEP_LABELS = ['Secteur', 'Compte', 'Email']

export default function InscriptionPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', motDePasse: '', confirmation: '', role: 'vendeur' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedSector, setSelectedSector] = useState('commerce')
  const [pendingUserId, setPendingUserId] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(60)
  const [otpResendable, setOtpResendable] = useState(false)
  const [otpSending, setOtpSending] = useState(false)

  const phoneRef = useRef(null)
  const pwRef = useRef(null)
  const confirmRef = useRef(null)

  const update = (key, val) => setForm({ ...form, [key]: val })
  const isEmailValid = form.email.includes('@') && form.email.includes('.') && form.email.length > 5
  const isPhoneOk = form.telephone.length === 0 ? null : isPhoneValid(form.telephone)
  const pwMatch = form.confirmation.length > 0 && form.motDePasse === form.confirmation

  const selectSector = (id) => setSelectedSector(id)

  useEffect(() => {
    if (step !== 3) return
    setOtpCountdown(60)
    setOtpResendable(false)
    const iv = setInterval(() => setOtpCountdown(p => { if (p <= 1) { setOtpResendable(true); return 0 } return p - 1 }), 1000)
    return () => clearInterval(iv)
  }, [step])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (loading) return
    if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim() || !form.motDePasse) {
      setError('Veuillez remplir tous les champs obligatoires'); return
    }
    if (!isEmailValid) { setError('Adresse email invalide'); return }
    if (!isPhoneValid(form.telephone)) { setError('Numéro de téléphone invalide (10 chiffres requis)'); return }
    const pwErrors = validatePassword(form.motDePasse)
    if (pwErrors.length > 0) { setError(`Mot de passe trop faible : ${pwErrors.join(', ')}`); return }
    if (form.motDePasse !== form.confirmation) { setError('Les mots de passe ne correspondent pas'); return }

    setLoading(true)
    try {
      const result = await inscrire(form.nom.trim(), form.motDePasse, form.email.trim(), normalizePhone(form.telephone.trim()), form.role, selectedSector)
      if (result.error) { setError(result.error); return }
      if (result.user?.id) setCurrentAdminId(result.user.id)

      addLog('Secteur sélectionné', selectedSector)

      if (isFirebaseReady() && result.user?.id) {
        pushToFirestore(form.email.trim(), result.user.id).catch(() => {})
      }

      if (result.user?.id) {
        setPendingUserId(result.user.id)
        const otpResult = await envoyerEmailOTP(result.user.id, form.email.trim())
        if (otpResult?.success) { setStep(3); return }
      }
      setSuccess(true)
      setTimeout(async () => {
        try { const lr = await login(form.nom.trim(), form.motDePasse); if (lr === true) navigate('/app') }
        catch { setSuccess(false); setError('Compte créé mais connexion échouée.') }
      }, 1500)
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setOtpError('')
    if (otpCode.length !== 6) return
    const result = verifierOTP(pendingUserId, 'email', otpCode)
    if (result?.valid) {
      setSuccess(true)
      setTimeout(async () => {
        try { const lr = await login(form.nom.trim(), form.motDePasse); if (lr === true) navigate('/app') }
        catch { setSuccess(false); setError('Vérification réussie mais connexion échouée.') }
      }, 1500)
    } else { setOtpError(result?.error || 'Code incorrect ou expiré'); setOtpCode('') }
  }

  const handleResendOTP = async () => {
    setOtpSending(true)
    const result = await envoyerEmailOTP(pendingUserId, form.email.trim())
    setOtpSending(false)
    if (result?.success) { setOtpResendable(false); setOtpCountdown(60); setOtpError('') }
    else setOtpError('Erreur lors du renvoi.')
  }

  if (success) return <SuccessScreen title="Compte créé !" subtitle="Connexion en cours..." />

  return (
    <AuthLayout backTo="/">
      <StepIndicator steps={STEP_LABELS} current={step} />

      {/* STEP 1: Sector (single-select) */}
      {step === 1 && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Choisissez votre secteur d'activité. Chaque compte est lié à un seul secteur.</p>
          <div className="space-y-3 mb-5">
            {Object.values(SECTORS).map(sector => {
              const Icon = ICONS[sector.icon] || ShoppingCart
              const selected = selectedSector === sector.id
              return (
                <button key={sector.id} type="button" onClick={() => selectSector(sector.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selected ? `${COLOR_CLASSES[sector.color]} border-current shadow-md` : 'border-gray-200 dark:border-dark-700 hover:border-gray-300 dark:hover:border-dark-600'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-white/80 dark:bg-white/10' : 'bg-gray-100 dark:bg-dark-700'}`}>
                        <Icon className={`w-4 h-4 ${selected ? 'text-current' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${selected ? '' : 'dark:text-white'}`}>{sector.nom}</div>
                        <div className={`text-[11px] ${selected ? 'opacity-70' : 'text-gray-400 dark:text-gray-500'}`}>{sector.modules.length} modules</div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border-2 ${selected ? 'border-current bg-current' : 'border-gray-300 dark:border-dark-600'}`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 text-center">
              J'ai déjà un compte
            </Link>
            <button onClick={() => setStep(2)}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
              Suivant <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Account */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
          <AuthError message={error} />
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur *</label>
              <input type="text" value={form.nom} onChange={e => update('nom', e.target.value)} placeholder="Ex: moussa"
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <div className="relative">
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), phoneRef.current?.focus())}
                  className={`w-full px-3 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white ${isEmailValid ? 'border-green-400 dark:border-green-600' : 'border-gray-300 dark:border-dark-600'}`}
                  placeholder="moussa@email.com" required />
                {isEmailValid && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-4 h-4 text-green-500" /></div>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-600 dark:text-green-400">+225</span>
                <input ref={phoneRef} type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), pwRef.current?.focus())}
                  className={`w-full pl-14 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white ${
                    isPhoneOk === true ? 'border-green-400 dark:border-green-600' : isPhoneOk === false ? 'border-amber-400 dark:border-amber-600' : 'border-gray-300 dark:border-dark-600'
                  }`} placeholder="XX XX XX XX XX" required />
                {isPhoneOk === true && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-4 h-4 text-green-500" /></div>}
                {isPhoneOk === false && <div className="absolute right-3 top-1/2 -translate-y-1/2"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>}
              </div>
              {form.telephone && isPhoneOk === false && <p className="text-xs text-amber-500 mt-1">10 chiffres requis</p>}
              {form.telephone && isPhoneOk === true && <p className="text-xs text-green-500 mt-1">{formatPhoneDisplay(form.telephone)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rôle</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <button key={r.value} type="button" onClick={() => update('role', r.value)}
                    className={`px-3 py-2.5 rounded-xl border text-center transition-all ${form.role === r.value ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-200' : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'}`}>
                    <div className={`text-sm font-semibold ${form.role === r.value ? 'text-brand-700 dark:text-brand-300' : 'text-gray-700 dark:text-gray-300'}`}>{r.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.motDePasse} onChange={e => update('motDePasse', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), confirmRef.current?.focus())}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none pr-10 bg-white dark:bg-dark-700 dark:text-white"
                  placeholder="8+ car., 1 majuscule, 1 chiffre" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              <PasswordStrength password={form.motDePasse} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe *</label>
              <input ref={confirmRef} type="password" value={form.confirmation} onChange={e => update('confirmation', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white transition-all ${
                  form.confirmation.length > 0 ? (pwMatch ? 'border-green-400 dark:border-green-600' : 'border-red-300 dark:border-red-600') : 'border-gray-300 dark:border-dark-600'
                }`} placeholder="Retapez le mot de passe" required />
              {form.confirmation && !pwMatch && <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>}
              {form.confirmation && pwMatch && <p className="text-xs text-green-500 mt-1">Les mots de passe correspondent ✓</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => setStep(1)} className="py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Retour</button>
            <button type="submit" className="flex-1 btn-primary py-2.5 disabled:opacity-50 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Création...</>) : (<>Créer mon compte <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-500">Déjà un compte ? </span>
            <Link to="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">Se connecter</Link>
          </div>
        </form>
      )}

      {/* STEP 3: Email OTP */}
      {step === 3 && (
        <form onSubmit={handleVerifyOTP} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold dark:text-white">Vérifiez votre email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Code à 6 chiffres envoyé à<br />
              <span className="font-medium text-gray-700 dark:text-gray-300">{form.email}</span>
            </p>
          </div>
          <AuthError message={otpError} />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code de vérification</label>
            <div className="relative">
              <OTPInput value={otpCode} onChange={setOtpCode} onSubmit={handleVerifyOTP} />
              {otpCountdown > 0 && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{otpCountdown}s</div>}
            </div>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2" disabled={otpCode.length !== 6}>
            <Check className="w-4 h-4" /> Vérifier
          </button>
          <div className="flex items-center justify-between mt-3">
            <button type="button" onClick={() => { setStep(2); setOtpCode(''); setOtpError('') }} className="text-sm text-gray-500 hover:text-gray-700 py-2">Retour</button>
            <button type="button" onClick={handleResendOTP} disabled={!otpResendable || otpSending}
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-50 flex items-center gap-1 py-2">
              <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
              {otpSending ? 'Envoi...' : otpResendable ? 'Renvoyer' : `Renvoyer (${otpCountdown}s)`}
            </button>
          </div>
          <button type="button" onClick={() => { setSuccess(true); setTimeout(async () => { try { const lr = await login(form.nom.trim(), form.motDePasse); if (lr === true) navigate('/app') } catch {} }, 1000) }}
            className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2">
            Passer la vérification
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
