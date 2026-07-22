import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUserByEmail, setNewPassword, addLog, validatePassword } from '../lib/db'
import { envoyerEmailOTP, verifierOTP } from '../lib/verification'
import { normalizePhone, isPhoneValid, formatPhoneDisplay } from '../lib/phone'
import AuthLayout from '../components/auth/AuthLayout'
import PasswordInput from '../components/auth/PasswordInput'
import PasswordStrength from '../components/auth/PasswordStrength'
import OTPInput from '../components/auth/OTPInput'
import StepIndicator from '../components/auth/StepIndicator'
import AuthError from '../components/auth/AuthError'
import SuccessScreen from '../components/auth/SuccessScreen'
import { Mail, MessageSquare, Check, CheckCircle, ArrowRight, RefreshCw, Lock, AlertTriangle } from 'lucide-react'

const STEP_LABELS = ['Identifiant', 'Vérification', 'Nouveau mot de passe']

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [userId, setUserId] = useState(null)
  const [found, setFound] = useState(null)
  const [verificationMethod, setVerificationMethod] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(60)
  const [otpResendable, setOtpResendable] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isEmailValid, setIsEmailValid] = useState(false)

  const isPhoneOk = phone.length === 0 ? null : isPhoneValid(phone)
  const pwMatch = confirmPassword.length > 0 && newPassword === confirmPassword

  useEffect(() => {
    if (!email.includes('@') || !email.includes('.') || email.length < 5) { setIsEmailValid(false); return }
    setIsEmailValid(true)
    const user = getUserByEmail(email.trim().toLowerCase())
    if (user && user.id) { setUserId(user.id); setFound(true); return }
    setFound(false)
  }, [email])

  useEffect(() => {
    if (step !== 2) return
    setOtpCountdown(60)
    setOtpResendable(false)
    const iv = setInterval(() => setOtpCountdown(p => { if (p <= 1) { setOtpResendable(true); return 0 } return p - 1 }), 1000)
    return () => clearInterval(iv)
  }, [step])

  const handleSendOTP = async (method) => {
    setVerificationMethod(method); setError(''); setLoading(true)
    try {
      const result = await envoyerEmailOTP(userId, email.trim().toLowerCase(), method === 'sms' ? phone : null)
      setLoading(false)
      if (result?.success) { setStep(2); setOtpCode(''); setOtpError('') }
      else setError(result?.error || 'Erreur lors de l\'envoi.')
    } catch { setLoading(false); setError('Erreur lors de l\'envoi.') }
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault()
    setOtpError('')
    if (otpCode.length !== 6) return
    const result = verifierOTP(userId, verificationMethod, otpCode, verificationMethod === 'sms' ? phone : null)
    if (result?.valid) { setStep(3); setNewPassword(''); setConfirmPassword(''); setOtpCode('') }
    else { setOtpError(result?.error || 'Code incorrect ou expiré'); setOtpCode('') }
  }

  const handleResendOTP = async () => {
    setOtpSending(true)
    const result = await envoyerEmailOTP(userId, email.trim().toLowerCase(), verificationMethod === 'sms' ? phone : null)
    setOtpSending(false)
    if (result?.success) { setOtpResendable(false); setOtpCountdown(60); setOtpError('') }
    else setOtpError('Erreur lors du renvoi.')
  }

  const handleResetPassword = async (e) => {
    e.preventDefault(); setError('')
    if (loading) return
    if (!newPassword) { setError('Veuillez entrer un nouveau mot de passe.'); return }
    const pwErrors = validatePassword(newPassword)
    if (pwErrors.length > 0) { setError(`Mot de passe trop faible : ${pwErrors.join(', ')}`); return }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    try {
      const user = getUserByEmail(email.trim().toLowerCase())
      if (user && user.id) {
        const r = await setNewPassword(user.id, newPassword)
        if (r?.error) { setError(r.error); return }
      } else { setError('Utilisateur introuvable.'); return }
      addLog('Mot de passe réinitialisé', email.trim().toLowerCase())
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch { setError('Erreur lors de la réinitialisation.') }
    finally { setLoading(false) }
  }

  const handleBackToStep1 = () => { setStep(1); setError(''); setVerificationMethod(null); setOtpCode(''); setOtpError('') }
  const handleBackToLogin = () => navigate('/login')

  if (success) return <SuccessScreen title="Mot de passe réinitialisé !" subtitle="Redirection vers la connexion..." />

  return (
    <AuthLayout backTo="/login">
      <StepIndicator steps={STEP_LABELS} current={step} />

      {/* STEP 1: Identify */}
      {step === 1 && (
        <form onSubmit={e => e.preventDefault()} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
          <AuthError message={error} />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <div className="relative">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" autoFocus
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white ${isEmailValid ? 'border-green-400 dark:border-green-600' : 'border-gray-300 dark:border-dark-600'}`} />
                {isEmailValid && <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle className="w-4 h-4 text-green-500" /></div>}
              </div>
            </div>
            {isEmailValid && found === false && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Email introuvable</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Aucun compte n'est associé à cet email.</p>
                <button type="button" onClick={() => { setStep(1); setError(''); setVerificationMethod(null); setOtpCode(''); setOtpError('') }}
                  className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-2 underline hover:no-underline">Réessayer</button>
              </div>
            )}
            {isEmailValid && found === true && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Compte trouvé !</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Choisissez votre méthode de récupération :</p>
                <div className="space-y-2 mt-3">
                  <button type="button" onClick={() => handleSendOTP('email')} disabled={loading}
                    className="w-full flex items-center gap-3 p-3 bg-white dark:bg-dark-700 rounded-xl border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Code à 6 chiffres</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                  <button type="button" onClick={() => handleSendOTP('sms')} disabled={loading}
                    className="w-full flex items-center gap-3 p-3 bg-white dark:bg-dark-700 rounded-xl border border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center"><MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">SMS</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Code par message</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <button type="button" onClick={handleBackToLogin} className="w-full mt-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
            ← Retour à la connexion
          </button>
        </form>
      )}

      {/* STEP 2: OTP Verification */}
      {step === 2 && (
        <form onSubmit={handleVerifyOTP} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              {verificationMethod === 'email' ? <Mail className="w-6 h-6 text-green-600 dark:text-green-400" /> : <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />}
            </div>
            <h2 className="text-lg font-semibold dark:text-white">
              {verificationMethod === 'email' ? 'Code envoyé par email' : 'Code envoyé par SMS'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {verificationMethod === 'email' ? 'Vérifiez votre boîte de réception' : 'Vérifiez vos messages'}
            </p>
          </div>
          <AuthError message={otpError} />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Code à 6 chiffres</label>
            <div className="relative">
              <OTPInput value={otpCode} onChange={setOtpCode} onSubmit={handleVerifyOTP} />
              {otpCountdown > 0 && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{otpCountdown}s</div>}
            </div>
          </div>
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2" disabled={otpCode.length !== 6}>
            <Check className="w-4 h-4" /> Vérifier
          </button>
          <div className="flex items-center justify-between mt-3">
            <button type="button" onClick={handleBackToStep1} className="text-sm text-gray-500 hover:text-gray-700 py-2">Retour</button>
            <button type="button" onClick={handleResendOTP} disabled={!otpResendable || otpSending}
              className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-50 flex items-center gap-1 py-2">
              <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
              {otpSending ? 'Envoi...' : otpResendable ? 'Renvoyer' : `Renvoyer (${otpCountdown}s)`}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-dark-700 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold dark:text-white">Nouveau mot de passe</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choisissez un mot de passe sécurisé</p>
          </div>
          <AuthError message={error} />
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe *</label>
              <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="8+ car., 1 majuscule, 1 chiffre" showToggle />
              <PasswordStrength password={newPassword} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe *</label>
              <div className="relative">
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Retapez le mot de passe"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white transition-all ${
                    confirmPassword.length > 0 ? (pwMatch ? 'border-green-400 dark:border-green-600' : 'border-red-300 dark:border-red-600') : 'border-gray-300 dark:border-dark-600'
                  }`} />
              </div>
              {confirmPassword && !pwMatch && <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>}
              {confirmPassword && pwMatch && <p className="text-xs text-green-500 mt-1">Les mots de passe correspondent ✓</p>}
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 mt-4 flex items-center justify-center gap-2">
            {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Réinitialisation...</>) : (<>Réinitialiser <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
