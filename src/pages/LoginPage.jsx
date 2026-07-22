import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDevice } from '../context/DeviceContext'
import { getUsers, isLocked, getLockRemaining } from '../lib/db'
import { getTOTPCountdown } from '../lib/tfa'
import { Zap, Eye, EyeOff, ArrowLeft, AlertTriangle, Smartphone, Shield, MessageSquare, Mail, RefreshCw, User, Lock, CheckCircle, ArrowRight } from 'lucide-react'

const REMEMBER_KEY = 'gestocom_remember_email'

export default function LoginPage() {
  const { isMobile } = useDevice()
  const [nom, setNom] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [noUsers, setNoUsers] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockTime, setLockTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [inputType, setInputType] = useState(null) // 'email' | 'username' | null
  const [viewTransition, setViewTransition] = useState(null) // null | 'login' | 'otp' | '2fa'
  const inputRef = useRef(null)

  // 2FA
  const [show2FA, setShow2FA] = useState(false)
  const [tfaCode, setTfaCode] = useState('')
  const [tfaCountdown, setTfaCountdown] = useState(30)
  const [tfaError, setTfaError] = useState('')

  // OTP
  const [showOTP, setShowOTP] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(60)
  const [otpResendable, setOtpResendable] = useState(false)
  const [otpSending, setOtpSending] = useState(false)

  const { login, pending2FA, verify2FA, cancel2FA, pendingOTP, verifyOTP, resendOTP, cancelOTP, otpChannel } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    setNoUsers(getUsers().length === 0)
    checkLock()
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setNom(saved)
      setRemember(true)
      if (saved.includes('@')) setInputType('email')
      else setInputType('username')
    }
  }, [])

  // Detect email vs username
  useEffect(() => {
    if (nom.includes('@')) setInputType('email')
    else if (nom.length > 0) setInputType('username')
    else setInputType(null)
  }, [nom])

  // 2FA countdown
  useEffect(() => {
    if (!show2FA) return
    const iv = setInterval(() => { setTfaCountdown(getTOTPCountdown()) }, 1000)
    return () => { clearInterval(iv) }
  }, [show2FA])

  // OTP countdown
  useEffect(() => {
    if (!showOTP) return
    setOtpCountdown(60)
    setOtpResendable(false)
    const iv = setInterval(() => {
      setOtpCountdown(prev => {
        if (prev <= 1) { setOtpResendable(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { clearInterval(iv) }
  }, [showOTP])

  // Smooth view transitions
  useEffect(() => {
    if (showOTP && pendingOTP) setViewTransition('otp')
    else if (show2FA && pending2FA) setViewTransition('2fa')
    else setViewTransition('login')
  }, [showOTP, show2FA, pendingOTP, pending2FA])

  const checkLock = () => {
    if (isLocked()) {
      setLocked(true)
      setLockTime(Math.ceil(getLockRemaining() / 1000))
    }
  }

  useEffect(() => {
    if (!locked) return
    const iv = setInterval(() => {
      const rem = getLockRemaining()
      if (rem <= 0) { setLocked(false); clearInterval(iv) }
      else setLockTime(Math.ceil(rem / 1000))
    }, 1000)
    return () => clearInterval(iv)
  }, [locked])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (locked || loading) return
    setLoading(true)

    try {
      const result = await login(nom, motDePasse)
      if (result?.error === 'locked') {
        setLocked(true)
        setLockTime(Math.ceil(getLockRemaining() / 1000))
        setError('Trop de tentatives. Compte verrouillé 5 minutes.')
      } else if (result?.require2FA) {
        setShow2FA(true)
        setTfaCountdown(getTOTPCountdown())
        setTfaCode('')
        setTfaError('')
      } else if (result?.requireOTP) {
        setShowOTP(true)
        setOtpCode('')
        setOtpError('')
      } else if (result?.error) {
        setError(result.error)
        checkLock()
      } else if (result === true) {
        if (remember) localStorage.setItem(REMEMBER_KEY, nom)
        else localStorage.removeItem(REMEMBER_KEY)
        navigate('/app')
      } else {
        setError('Email/nom ou mot de passe incorrect')
        checkLock()
      }
    } finally {
      setLoading(false)
    }
  }

  const handle2FA = async (e) => {
    e.preventDefault()
    setTfaError('')
    if (tfaCode.length !== 6) { setTfaError('Code à 6 chiffres requis'); return }

    const result = await verify2FA(tfaCode)
    if (result === true) {
      navigate('/app')
    } else if (result?.requireOTP) {
      setShow2FA(false)
      setShowOTP(true)
      setOtpCode('')
      setOtpError('')
    } else {
      setTfaError('Code incorrect. Réessayez.')
      setTfaCode('')
    }
  }

  const handleOTP = async (e) => {
    e.preventDefault()
    setOtpError('')
    if (otpCode.length !== 6) { setOtpError('Code à 6 chiffres requis'); return }

    const ok = await verifyOTP(otpCode)
    if (ok) {
      if (remember) localStorage.setItem(REMEMBER_KEY, nom)
      else localStorage.removeItem(REMEMBER_KEY)
      navigate('/app')
    } else {
      setOtpError('Code incorrect ou expiré. Réessayez.')
      setOtpCode('')
    }
  }

  const handleResendOTP = async () => {
    setOtpSending(true)
    const ok = await resendOTP()
    setOtpSending(false)
    if (ok) {
      setOtpResendable(false)
      setOtpCountdown(60)
      setOtpError('')
    } else {
      setOtpError('Erreur lors du renvoi. Réessayez.')
    }
  }

  const handleCancel2FA = () => {
    setShow2FA(false)
    setTfaCode('')
    setTfaError('')
    cancel2FA()
  }

  const handleCancelOTP = () => {
    setShowOTP(false)
    setOtpCode('')
    setOtpError('')
    cancelOTP()
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const channelIcon = otpChannel === 'email' ? Mail : MessageSquare
  const channelLabel = otpChannel === 'email' ? 'email' : 'SMS'

  const pwStrength = (() => {
    if (!motDePasse) return { score: 0, label: '', color: '' }
    let s = 0
    if (motDePasse.length >= 8) s++
    if (motDePasse.length >= 12) s++
    if (/[A-Z]/.test(motDePasse)) s++
    if (/[0-9]/.test(motDePasse)) s++
    if (/[^A-Za-z0-9]/.test(motDePasse)) s++
    if (s <= 2) return { score: 1, label: 'Faible', color: 'bg-red-500' }
    if (s <= 3) return { score: 2, label: 'Moyen', color: 'bg-amber-500' }
    return { score: 3, label: 'Fort', color: 'bg-green-500' }
  })()

  return (
    <div className="h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm max-h-full overflow-y-auto">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30 overflow-hidden">
            <div className="flex items-end gap-1 h-7">
              <div className="w-2 h-3 bg-green-300 rounded-sm"></div>
              <div className="w-2 h-5 bg-orange-300 rounded-sm"></div>
              <div className="w-2 h-7 bg-green-300 rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold dark:text-white">GESTOCOM CI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion Commerciale Professionnelle</p>
        </div>

        {/* ═══ FORMULAIRE OTP ═══ */}
        {showOTP && pendingOTP ? (
          <form onSubmit={handleOTP} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                {(() => { const Icon = channelIcon; return <Icon className="w-7 h-7 text-green-600 dark:text-green-400" /> })()}
              </div>
              <h2 className="text-lg font-semibold dark:text-white">Vérification OTP</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Un code à 6 chiffres a été envoyé par <span className="font-semibold text-green-600 dark:text-green-400">{channelLabel}</span>
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
              Vérifier
            </button>

            <div className="flex items-center justify-between mt-3">
              <button type="button" onClick={handleCancelOTP}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2">
                Annuler
              </button>
              <button type="button" onClick={handleResendOTP} disabled={!otpResendable || otpSending}
                className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 py-2">
                <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
                {otpSending ? 'Envoi...' : otpResendable ? 'Renvoyer' : `Renvoyer (${otpCountdown}s)`}
              </button>
            </div>
          </form>
        ) : show2FA && pending2FA ? (
          /* ═══ FORMULAIRE 2FA ═══ */
          <form onSubmit={handle2FA} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <h2 className="text-lg font-semibold dark:text-white">Vérification 2FA</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Entrez le code de votre application d'authentification
              </p>
            </div>

            {tfaError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {tfaError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code de vérification</label>
              <div className="relative">
                <input
                  type="text"
                  value={tfaCode}
                  onChange={e => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onPaste={e => {
                    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
                    if (text) setTfaCode(text)
                  }}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 dark:border-dark-600 rounded-lg text-2xl font-mono text-center tracking-[0.5em] focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {tfaCountdown}s
                </div>
              </div>
            </div>

            <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center gap-2" disabled={tfaCode.length !== 6}>
              <Shield className="w-4 h-4" />
              Vérifier
            </button>

            <button type="button" onClick={handleCancel2FA}
              className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2">
              Annuler
            </button>
          </form>
        ) : (
          /* ═══ FORMULAIRE CONNEXION ═══ */
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-semibold mb-5 dark:text-white">Connexion</h2>

            {noUsers && (
              <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                <span>Aucun compte existant.</span>
                <Link to="/inscription" className="font-semibold underline flex items-center gap-1">
                  Créer <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}

            {locked && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Compte verrouillé</div>
                  <div>Attendez {formatTime(lockTime)} avant de réessayer.</div>
                </div>
              </div>
            )}

            {error && !locked && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2.5 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email ou Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {inputType === 'email' ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  disabled={locked}
                  placeholder="email@exemple.com ou votre nom"
                  className={`w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white disabled:opacity-50 transition-all ${inputType === 'email' ? 'border-blue-300 dark:border-blue-600' : inputType === 'username' ? 'border-brand-300 dark:border-brand-600' : ''}`}
                  required
                />
                {inputType === 'email' && nom.includes('@') && nom.includes('.') && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  disabled={locked}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white disabled:opacity-50 transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" disabled={locked}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {motDePasse && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${pwStrength.score >= i ? pwStrength.color : 'bg-gray-200 dark:bg-dark-600'}`} />
                    ))}
                  </div>
                  <p className={`text-[11px] mt-1 ${pwStrength.score === 1 ? 'text-red-500' : pwStrength.score === 2 ? 'text-amber-500' : 'text-green-500'}`}>
                    {pwStrength.label}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center mb-5">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                disabled={locked}
                className="w-4 h-4 text-brand-600 bg-white dark:bg-dark-700 border-gray-300 dark:border-dark-600 rounded focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                Se souvenir de moi
              </label>
            </div>

            <button type="submit" className="w-full btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2 transition-all" disabled={locked || loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
              <span className="text-xs text-gray-400 dark:text-gray-500">ou</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-dark-600" />
            </div>

            <div className="space-y-2.5">
              <Link to="/inscription" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all">
                Créer un compte
              </Link>
              <Link to="/mot-de-passe-oublie" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all">
                Mot de passe oublié ?
              </Link>
              <Link to="/sync" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                <RefreshCw className="w-3.5 h-3.5" />
                Restaurer depuis le cloud
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}