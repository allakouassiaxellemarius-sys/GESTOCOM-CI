import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDevice } from '../context/DeviceContext'
import { getUsers, isLocked, getLockRemaining } from '../lib/db'
import { getTOTPCountdown } from '../lib/tfa'
import { Zap, Eye, EyeOff, ArrowLeft, AlertTriangle, Smartphone, Shield, MessageSquare, Mail, RefreshCw } from 'lucide-react'

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
  }, [])

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
        navigate('/app')
      } else {
        setError('Nom ou mot de passe incorrect')
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

  return (
    <div className="h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm max-h-full overflow-y-auto">
        <div className="text-center mb-8">
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
          <form onSubmit={handleOTP} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                {(() => { const Icon = channelIcon; return <Icon className="w-7 h-7 text-green-600 dark:text-green-400" /> })()}
              </div>
              <h2 className="text-lg font-semibold dark:text-white">Vérification OTP</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Un code à 6 chiffres a été envoyé par {channelLabel}
              </p>
            </div>

            {otpError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-lg mb-4">{otpError}</div>
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

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all" disabled={otpCode.length !== 6}>
              <Shield className="w-4 h-4 inline mr-2" />
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
          <form onSubmit={handle2FA} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700">
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
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-lg mb-4">{tfaError}</div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code de vérification</label>
              <div className="relative">
                <input
                  type="text"
                  value={tfaCode}
                  onChange={e => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

            <button type="submit" className="w-full btn-primary py-3" disabled={tfaCode.length !== 6}>
              <Shield className="w-4 h-4 inline mr-2" />
              Vérifier
            </button>

            <button type="button" onClick={handleCancel2FA}
              className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2">
              Annuler
            </button>
          </form>
        ) : (
          /* ═══ FORMULAIRE CONNEXION ═══ */
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Connexion</h2>

            {noUsers && (
              <div className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm px-4 py-3 rounded-lg mb-4">
                Aucun compte existant. <Link to="/inscription" className="font-semibold underline">Créer le premier compte</Link>
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
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm px-4 py-2 rounded-lg mb-4">{error}</div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                disabled={locked}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white disabled:opacity-50"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  disabled={locked}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none pr-10 bg-white dark:bg-dark-700 dark:text-white disabled:opacity-50"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" disabled={locked}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full btn-primary py-3 disabled:opacity-50" disabled={locked || loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="mt-4 text-center space-y-2">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Pas encore de compte ? </span>
                <Link to="/inscription" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700">Créer un compte</Link>
              </div>
              <div>
                <Link to="/mot-de-passe-oublie" className="text-sm text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400">Mot de passe oublié ?</Link>
              </div>
              <div>
                <Link to="/sync" className="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Restaurer depuis le cloud
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
