import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUsers, isLocked, getLockRemaining } from '../lib/db'
import { getTOTPCountdown } from '../lib/tfa'
import AuthLayout from '../components/auth/AuthLayout'
import PasswordInput from '../components/auth/PasswordInput'
import OTPInput from '../components/auth/OTPInput'
import AuthError from '../components/auth/AuthError'
import AuthDivider from '../components/auth/AuthDivider'
import { Shield, Smartphone, MessageSquare, Mail, RefreshCw, User, CheckCircle, ArrowRight, RefreshCw as CloudIcon } from 'lucide-react'

const REMEMBER_KEY = 'gestocom_remember_email'

export default function LoginPage() {
  const { login, pending2FA, verify2FA, cancel2FA, pendingOTP, verifyOTP, resendOTP, cancelOTP, otpChannel } = useAuth()
  const navigate = useNavigate()

  const [nom, setNom] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState('')
  const [noUsers, setNoUsers] = useState(false)
  const [locked, setLocked] = useState(false)
  const [lockTime, setLockTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [inputType, setInputType] = useState(null)
  const inputRef = useRef(null)

  const [show2FA, setShow2FA] = useState(false)
  const [tfaCode, setTfaCode] = useState('')
  const [tfaCountdown, setTfaCountdown] = useState(30)
  const [tfaError, setTfaError] = useState('')

  const [showOTP, setShowOTP] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(60)
  const [otpResendable, setOtpResendable] = useState(false)
  const [otpSending, setOtpSending] = useState(false)

  useEffect(() => {
    setNoUsers(getUsers().length === 0)
    if (isLocked()) {
      setLocked(true)
      setLockTime(Math.ceil(getLockRemaining() / 1000))
    }
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setNom(saved)
      setRemember(true)
      setInputType(saved.includes('@') ? 'email' : 'username')
    }
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (nom.includes('@')) setInputType('email')
    else if (nom.length > 0) setInputType('username')
    else setInputType(null)
  }, [nom])

  useEffect(() => {
    if (!show2FA) return
    const iv = setInterval(() => setTfaCountdown(getTOTPCountdown()), 1000)
    return () => clearInterval(iv)
  }, [show2FA])

  useEffect(() => {
    if (!showOTP) return
    setOtpCountdown(60)
    setOtpResendable(false)
    const iv = setInterval(() => {
      setOtpCountdown(p => { if (p <= 1) { setOtpResendable(true); return 0 } return p - 1 })
    }, 1000)
    return () => clearInterval(iv)
  }, [showOTP])

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
      } else if (result === true) {
        if (remember) localStorage.setItem(REMEMBER_KEY, nom)
        else localStorage.removeItem(REMEMBER_KEY)
        navigate('/app')
      } else {
        setError('Email/nom ou mot de passe incorrect')
      }
    } finally { setLoading(false) }
  }

  const handle2FA = async (e) => {
    e.preventDefault()
    setTfaError('')
    if (tfaCode.length !== 6) { setTfaError('Code à 6 chiffres requis'); return }
    const result = await verify2FA(tfaCode)
    if (result === true) navigate('/app')
    else if (result?.requireOTP) { setShow2FA(false); setShowOTP(true); setOtpCode(''); setOtpError('') }
    else { setTfaError('Code incorrect. Réessayez.'); setTfaCode('') }
  }

  const handleOTP = useCallback(async () => {
    setOtpError('')
    if (otpCode.length !== 6) return
    const ok = await verifyOTP(otpCode)
    if (ok) {
      if (remember) localStorage.setItem(REMEMBER_KEY, nom)
      else localStorage.removeItem(REMEMBER_KEY)
      navigate('/app')
    } else { setOtpError('Code incorrect ou expiré.'); setOtpCode('') }
  }, [otpCode, remember, nom, verifyOTP, navigate])

  const handleResendOTP = async () => {
    setOtpSending(true)
    const ok = await resendOTP()
    setOtpSending(false)
    if (ok) { setOtpResendable(false); setOtpCountdown(60); setOtpError('') }
    else setOtpError('Erreur lors du renvoi.')
  }

  const handleCancel2FA = () => { setShow2FA(false); setTfaCode(''); setTfaError(''); cancel2FA() }
  const handleCancelOTP = () => { setShowOTP(false); setOtpCode(''); setOtpError(''); cancelOTP() }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const channelIcon = otpChannel === 'email' ? Mail : MessageSquare
  const channelLabel = otpChannel === 'email' ? 'email' : 'SMS'

  return (
    <AuthLayout backTo="/">
      {/* OTP View */}
      {showOTP && pendingOTP ? (
        <form onSubmit={e => { e.preventDefault(); handleOTP() }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              {(() => { const I = channelIcon; return <I className="w-6 h-6 text-green-600 dark:text-green-400" /> })()}
            </div>
            <h2 className="text-lg font-semibold dark:text-white">Vérification OTP</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Code à 6 chiffres envoyé par <span className="font-semibold text-green-600 dark:text-green-400">{channelLabel}</span>
            </p>
          </div>
          <AuthError message={otpError} />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code de vérification</label>
            <div className="relative">
              <OTPInput value={otpCode} onChange={setOtpCode} onSubmit={handleOTP} />
              {otpCountdown > 0 && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{otpCountdown}s</div>}
            </div>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2" disabled={otpCode.length !== 6}>
            <Shield className="w-4 h-4" /> Vérifier
          </button>
          <div className="flex items-center justify-between mt-3">
            <button type="button" onClick={handleCancelOTP} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2">Annuler</button>
            <button type="button" onClick={handleResendOTP} disabled={!otpResendable || otpSending}
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-50 flex items-center gap-1 py-2">
              <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
              {otpSending ? 'Envoi...' : otpResendable ? 'Renvoyer' : `Renvoyer (${otpCountdown}s)`}
            </button>
          </div>
        </form>

      /* 2FA View */
      ) : show2FA && pending2FA ? (
        <form onSubmit={handle2FA}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold dark:text-white">Authentification 2FA</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Code de votre application d'authentification</p>
          </div>
          <AuthError message={tfaError} />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code à 6 chiffres</label>
            <div className="relative">
              <OTPInput value={tfaCode} onChange={setTfaCode} autoFocus />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{tfaCountdown}s</div>
            </div>
          </div>
          <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center gap-2" disabled={tfaCode.length !== 6}>
            <Shield className="w-4 h-4" /> Vérifier
          </button>
          <button type="button" onClick={handleCancel2FA} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2">Annuler</button>
        </form>

      /* Login Form */
      ) : (
        <form onSubmit={handleSubmit}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Connexion</h2>

          {noUsers && (
            <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
              <span>Aucun compte existant.</span>
              <Link to="/inscription" className="font-semibold underline flex items-center gap-1">Créer <ArrowRight className="w-3 h-3" /></Link>
            </div>
          )}

          {locked && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <div>
                <div className="font-semibold">Compte verrouillé</div>
                <div>Attendez {formatTime(lockTime)} avant de réessayer.</div>
              </div>
            </div>
          )}

          <AuthError message={error && !locked ? error : null} />

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email ou Nom d'utilisateur</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {inputType === 'email' ? <Mail className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <input ref={inputRef} type="text" value={nom} onChange={e => setNom(e.target.value)} disabled={locked}
                placeholder="email@exemple.com ou votre nom"
                className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white disabled:opacity-50 transition-all ${
                  inputType === 'email' ? 'border-blue-300 dark:border-blue-600' : inputType === 'username' ? 'border-brand-300 dark:border-brand-600' : 'border-gray-300 dark:border-dark-600'
                }`} required />
              {inputType === 'email' && nom.includes('@') && nom.includes('.') && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-4 h-4 text-green-500" /></div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mot de passe</label>
            <PasswordInput value={motDePasse} onChange={e => setMotDePasse(e.target.value)} disabled={locked} />
          </div>

          <div className="flex items-center mb-5">
            <input type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={locked}
              className="w-4 h-4 text-brand-600 bg-white dark:bg-dark-700 border-gray-300 dark:border-dark-600 rounded focus:ring-brand-500 cursor-pointer" />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Se souvenir de moi</label>
          </div>

          <button type="submit" className="w-full btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2 transition-all" disabled={locked || loading}>
            {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connexion...</>) : (<>Se connecter <ArrowRight className="w-4 h-4" /></>)}
          </button>

          <AuthDivider />

          <div className="space-y-2.5">
            <Link to="/inscription" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all">
              Créer un compte
            </Link>
            <Link to="/mot-de-passe-oublie" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all">
              Mot de passe oublié ?
            </Link>
            <Link to="/sync" className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
              <RefreshCw className="w-3.5 h-3.5" /> Restaurer depuis le cloud
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
