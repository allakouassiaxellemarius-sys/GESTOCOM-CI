import { useState, useEffect } from 'react'
import { isEmailVerified, isPhoneVerified, envoyerEmailOTP, envoyerSMSOTP, verifierOTP, isOTPEnabled, setOTPEnabled, getOTPChannel, setOTPChannel } from '../../lib/verification'
import { CheckCircle, Mail, Phone, MessageSquare } from 'lucide-react'

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-brand-500' : 'bg-gray-300 dark:bg-dark-600'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-dark-700 last:border-0">
      <div>
        <div className="text-sm font-medium dark:text-white">{label}</div>
        {desc && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function VerificationSection({ user, addLog }) {
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [phoneSending, setPhoneSending] = useState(false)
  const [emailMsg, setEmailMsg] = useState('')
  const [phoneMsg, setPhoneMsg] = useState('')
  const [emailPending, setEmailPending] = useState(false)
  const [phonePending, setPhonePending] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)
  const [phoneCountdown, setPhoneCountdown] = useState(0)
  const [otpEnabled, setOtpEnabledState] = useState(() => isOTPEnabled(user?.id))
  const [otpChannel, setOtpChannelState] = useState(() => getOTPChannel(user?.id))

  useEffect(() => {
    if (!emailPending) return
    const iv = setInterval(() => {
      setEmailCountdown(prev => {
        if (prev <= 1) { setEmailPending(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [emailPending])

  useEffect(() => {
    if (!phonePending) return
    const iv = setInterval(() => {
      setPhoneCountdown(prev => {
        if (prev <= 1) { setPhonePending(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [phonePending])

  const handleSendEmailOTP = async () => {
    if (!user?.email) { setEmailMsg('Aucun email configuré'); return }
    setEmailSending(true); setEmailMsg('')
    try {
      const result = await envoyerEmailOTP(user.id, user.email)
      if (result.success) {
        setEmailPending(true); setEmailCountdown(600)
        setEmailMsg('Code envoyé à ' + user.email + (result.code ? ' — Code: ' + result.code : ''))
        addLog('OTP email envoyé', user.email, user.id, user.nom)
      } else { setEmailMsg(result.error || 'Erreur') }
    } catch { setEmailMsg('Erreur') }
    setEmailSending(false)
  }

  const handleVerifyEmail = () => {
    if (emailCode.length !== 6) { setEmailMsg('Code à 6 chiffres requis'); return }
    const result = verifierOTP(user.id, 'email', emailCode)
    if (result.valid) {
      setEmailMsg('Email vérifié !'); setEmailPending(false); setEmailCode('')
      addLog('Email vérifié', user.email, user.id, user.nom)
    } else { setEmailMsg(result.error || 'Code incorrect') }
  }

  const handleSendPhoneOTP = async () => {
    if (!user?.telephone) { setPhoneMsg('Aucun téléphone configuré'); return }
    setPhoneSending(true); setPhoneMsg('')
    try {
      const result = await envoyerSMSOTP(user.id, user.telephone)
      if (result.success) {
        setPhonePending(true); setPhoneCountdown(600)
        setPhoneMsg('Code envoyé au ' + user.telephone)
        addLog('OTP SMS envoyé', user.telephone, user.id, user.nom)
      } else { setPhoneMsg(result.error || 'Erreur') }
    } catch { setPhoneMsg('Erreur') }
    setPhoneSending(false)
  }

  const handleVerifyPhone = () => {
    if (phoneCode.length !== 6) { setPhoneMsg('Code à 6 chiffres requis'); return }
    const result = verifierOTP(user.id, 'phone', phoneCode)
    if (result.valid) {
      setPhoneMsg('Téléphone vérifié !'); setPhonePending(false); setPhoneCode('')
      addLog('Téléphone vérifié', user.telephone, user.id, user.nom)
    } else { setPhoneMsg(result.error || 'Code incorrect') }
  }

  const handleToggleOTP = (enabled) => {
    setOTPEnabled(user.id, enabled); setOtpEnabledState(enabled)
    addLog(enabled ? 'OTP activé' : 'OTP désactivé', '', user.id, user.nom)
  }

  const handleChangeOTPChannel = (ch) => {
    setOTPChannel(user.id, ch); setOtpChannelState(ch)
    addLog('Canal OTP modifié', ch, user.id, user.nom)
  }

  const emailOk = isEmailVerified(user?.id)
  const phoneOk = isPhoneVerified(user?.id)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${emailOk ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400'}`}>
          {emailOk ? <CheckCircle className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          Email {emailOk ? 'vérifié' : 'non vérifié'}
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${phoneOk ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400'}`}>
          {phoneOk ? <CheckCircle className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
          Téléphone {phoneOk ? 'vérifié' : 'non vérifié'}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
        <h4 className="text-sm font-medium dark:text-white mb-3">Configuration OTP</h4>
        <SettingRow label="Vérification OTP à la connexion" desc="Demander un code à chaque connexion">
          <Toggle value={otpEnabled} onChange={handleToggleOTP} />
        </SettingRow>
        {otpEnabled && (
          <SettingRow label="Canal préféré" desc="Email ou SMS pour les codes">
            <div className="flex gap-2">
              <button onClick={() => handleChangeOTPChannel('email')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${otpChannel === 'email' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400'}`}>
                <Mail className="w-3 h-3 inline mr-1" /> Email
              </button>
              <button onClick={() => handleChangeOTPChannel('sms')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${otpChannel === 'sms' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400'}`}>
                <MessageSquare className="w-3 h-3 inline mr-1" /> SMS
              </button>
            </div>
          </SettingRow>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
        <h4 className="text-sm font-medium dark:text-white mb-2">Vérification email</h4>
        {user?.email ? (
          emailOk ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" /> {user.email} — vérifié
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              {!emailPending ? (
                <button onClick={handleSendEmailOTP} disabled={emailSending}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50">
                  {emailSending ? 'Envoi...' : 'Envoyer le code'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Code envoyé ({Math.floor(emailCountdown / 60)}:{String(emailCountdown % 60).padStart(2, '0')})</p>
                  <div className="flex gap-2">
                    <input value={emailCode} onChange={e => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" maxLength={6}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-mono text-center bg-white dark:bg-dark-700 dark:text-white" />
                    <button onClick={handleVerifyEmail} disabled={emailCode.length !== 6}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50">
                      Vérifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">Aucun email configuré. Ajoutez un email dans votre profil.</p>
        )}
        {emailMsg && <p className={`text-xs mt-2 ${emailMsg.includes('succès') || emailMsg.includes('envoyé') || emailMsg.includes('vérifié') ? 'text-green-600' : 'text-red-500'}`}>{emailMsg}</p>}
      </div>

      <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4">
        <h4 className="text-sm font-medium dark:text-white mb-2">Vérification téléphone</h4>
        {user?.telephone ? (
          phoneOk ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" /> {user.telephone} — vérifié
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">+225 {user.telephone}</p>
              {!phonePending ? (
                <button onClick={handleSendPhoneOTP} disabled={phoneSending}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50">
                  {phoneSending ? 'Envoi...' : 'Envoyer le code'}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Code envoyé ({Math.floor(phoneCountdown / 60)}:{String(phoneCountdown % 60).padStart(2, '0')})</p>
                  <div className="flex gap-2">
                    <input value={phoneCode} onChange={e => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" maxLength={6}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-mono text-center bg-white dark:bg-dark-700 dark:text-white" />
                    <button onClick={handleVerifyPhone} disabled={phoneCode.length !== 6}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition disabled:opacity-50">
                      Vérifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">Aucun téléphone configuré. Ajoutez un téléphone dans votre profil.</p>
        )}
        {phoneMsg && <p className={`text-xs mt-2 ${phoneMsg.includes('succès') || phoneMsg.includes('envoyé') || phoneMsg.includes('vérifié') ? 'text-green-600' : 'text-red-500'}`}>{phoneMsg}</p>}
      </div>
    </div>
  )
}
