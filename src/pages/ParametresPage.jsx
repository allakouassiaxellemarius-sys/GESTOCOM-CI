import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useDevice } from '../context/DeviceContext'
import {
  getCompanySettings, saveCompanySettings,
  getStockSettings, saveStockSettings,
  getVentesSettings, saveVentesSettings,
  getClientsSettings, saveClientsSettings,
  getRapportsSettings, saveRapportsSettings,
  changerMotDePasse, getUsers, getUsersForAdmin, addUser, deleteUser, isDefaultAdmin,
  getLogs, clearLogs, exportLogs, addLog,
  configurerTwilio, testerTwilio, configurerSMTP, testerSMTP,
} from '../lib/db'
import { getSoundSettings, saveSoundSettings, playTestSound, playStockAlert, playPaymentError, playSuspiciousAlert, playSaleComplete } from '../lib/sounds'
import { enable2FA, confirm2FA, disable2FA, is2FAEnabled, get2FAInfo, getTOTPCountdown } from '../lib/tfa'
import { getVerificationStatus, isEmailVerified, isPhoneVerified, envoyerEmailOTP, envoyerSMSOTP, verifierOTP, isOTPEnabled, setOTPEnabled, getOTPChannel, setOTPChannel, getIdentityVerification, submitIdentityVerification, approveIdentityVerification, rejectIdentityVerification } from '../lib/verification'
import { setMasterKey, hasMasterKey } from '../lib/crypto'
import { exportAccountData, parseImportFile, importAccountData } from '../lib/cloudSync'
import { pushToFirestore } from '../lib/firebaseSync'
import {
  Building2, Users, Package, ShoppingCart, Heart, BarChart3, Shield,
  Save, CheckCircle, Trash2, AlertTriangle, Search, Sun, Moon,
  Minus, Plus, Lock, MapPin, Phone, Mail, Tag, Eye, EyeOff,
  FileText, Download, Upload, RefreshCw, Percent, CreditCard,
  Star, UserPlus, Settings, Volume2, VolumeX,
  Bell, Smartphone, Key, ShieldCheck, MessageSquare, Layers,
} from 'lucide-react'

const CATEGORIES = [
  { key: 'general', label: 'Général', icon: Building2 },
  { key: 'utilisateurs', label: 'Utilisateurs & rôles', icon: Users },
  { key: 'produits', label: 'Produits & stock', icon: Package },
  { key: 'ventes', label: 'Ventes & paiements', icon: ShoppingCart },
  { key: 'clients', label: 'Clients & fidélité', icon: Heart },
  { key: 'rapports', label: 'Rapports & export', icon: BarChart3 },
  { key: 'securite', label: 'Sécurité & sauvegarde', icon: Shield },
  { key: 'modules', label: 'Modules & Secteurs', icon: Layers },
  { key: 'audit', label: 'Journalisation', icon: FileText },
  { key: 'sync', label: 'Synchronisation', icon: Smartphone },
  { key: 'update', label: 'Mise à jour', icon: RefreshCw },
]

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

function Input({ value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300 ${className}`} />
  )
}

function VerificationSection({ user, addLog }) {
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
    setEmailSending(true)
    setEmailMsg('')
    try {
      const result = await envoyerEmailOTP(user.id, user.email)
      if (result.success) {
        setEmailPending(true)
        setEmailCountdown(600)
        setEmailMsg('Code envoyé à ' + user.email)
        addLog('OTP email envoyé', user.email, user.id, user.nom)
      } else {
        setEmailMsg(result.error || 'Erreur lors de l\'envoi')
      }
    } catch { setEmailMsg('Erreur lors de l\'envoi') }
    setEmailSending(false)
  }

  const handleVerifyEmail = () => {
    if (emailCode.length !== 6) { setEmailMsg('Code à 6 chiffres requis'); return }
    const result = verifierOTP(user.id, 'email', emailCode)
    if (result.valid) {
      setEmailMsg('Email vérifié avec succès !')
      setEmailPending(false)
      setEmailCode('')
      addLog('Email vérifié', user.email, user.id, user.nom)
    } else {
      setEmailMsg(result.error || 'Code incorrect')
    }
  }

  const handleSendPhoneOTP = async () => {
    if (!user?.telephone) { setPhoneMsg('Aucun téléphone configuré'); return }
    setPhoneSending(true)
    setPhoneMsg('')
    try {
      const result = await envoyerSMSOTP(user.id, user.telephone)
      if (result.success) {
        setPhonePending(true)
        setPhoneCountdown(600)
        setPhoneMsg('Code envoyé au ' + user.telephone)
        addLog('OTP SMS envoyé', user.telephone, user.id, user.nom)
      } else {
        setPhoneMsg(result.error || 'Erreur lors de l\'envoi')
      }
    } catch { setPhoneMsg('Erreur lors de l\'envoi') }
    setPhoneSending(false)
  }

  const handleVerifyPhone = () => {
    if (phoneCode.length !== 6) { setPhoneMsg('Code à 6 chiffres requis'); return }
    const result = verifierOTP(user.id, 'phone', phoneCode)
    if (result.valid) {
      setPhoneMsg('Téléphone vérifié avec succès !')
      setPhonePending(false)
      setPhoneCode('')
      addLog('Téléphone vérifié', user.telephone, user.id, user.nom)
    } else {
      setPhoneMsg(result.error || 'Code incorrect')
    }
  }

  const handleToggleOTP = (enabled) => {
    setOTPEnabled(user.id, enabled)
    setOtpEnabledState(enabled)
    addLog(enabled ? 'OTP activé' : 'OTP désactivé', '', user.id, user.nom)
  }

  const handleChangeOTPChannel = (ch) => {
    setOTPChannel(user.id, ch)
    setOtpChannelState(ch)
    addLog('Canal OTP modifié', ch, user.id, user.nom)
  }

  const emailOk = isEmailVerified(user?.id)
  const phoneOk = isPhoneVerified(user?.id)

  return (
    <div className="space-y-4">
      {/* Statut */}
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

      {/* OTP Settings */}
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

      {/* Email Verification */}
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
        {emailMsg && <p className={`text-xs mt-2 ${emailMsg.includes('succès') || emailMsg.includes('envoyé') ? 'text-green-600' : 'text-red-500'}`}>{emailMsg}</p>}
      </div>

      {/* Phone Verification */}
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
        {phoneMsg && <p className={`text-xs mt-2 ${phoneMsg.includes('succès') || phoneMsg.includes('envoyé') ? 'text-green-600' : 'text-red-500'}`}>{phoneMsg}</p>}
      </div>
    </div>
  )
}

function IdentityVerificationPanel({ user, addLog }) {
  const [showSubmit, setShowSubmit] = useState(false)
  const [nomComplet, setNomComplet] = useState('')
  const [numeroPiece, setNumeroPiece] = useState('')
  const [typePiece, setTypePiece] = useState('cni')
  const [msg, setMsg] = useState('')

  const identity = getIdentityVerification(user?.id)
  const status = getVerificationStatus(user?.id)

  const handleSubmit = () => {
    if (!nomComplet.trim() || !numeroPiece.trim()) { setMsg('Tous les champs sont requis'); return }
    submitIdentityVerification(user.id, { nomComplet, numeroPiece, typePiece })
    addLog('Demande vérification identité soumise', `${typePiece}: ${numeroPiece}`, user.id, user.nom)
    setMsg('Demande soumise ! En attente de validation par un administrateur.')
    setShowSubmit(false)
    setNomComplet('')
    setNumeroPiece('')
  }

  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
      <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
        <ShieldCheck className="w-5 h-5 text-purple-500" /> Vérification d'identité
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Vérifiez votre identité pour obtenir un badge de confiance sur votre profil.
      </p>

      {status.identity ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 text-sm">
          <CheckCircle className="w-4 h-4" /> Identité vérifiée
        </div>
      ) : identity ? (
        <div className="space-y-3">
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            identity.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
            identity.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
            'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400'
          }`}>
            {identity.status === 'pending' ? <AlertTriangle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {identity.status === 'pending' ? 'En attente de validation' :
             identity.status === 'rejected' ? `Rejeté : ${identity.rejectionReason || 'Non précisé'}` :
             'Statut inconnu'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Type : {identity.typePiece === 'cni' ? 'CNI' : identity.typePiece === 'passeport' ? 'Passeport' : 'Autre'}</p>
            <p>N° : {identity.numeroPiece}</p>
            <p>Soumis le : {new Date(identity.submittedAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      ) : showSubmit ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
            <input type="text" value={nomComplet} onChange={e => setNomComplet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type de pièce</label>
            <select value={typePiece} onChange={e => setTypePiece(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="cni">Carte Nationale d'Identité</option>
              <option value="passeport">Passeport</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro de la pièce</label>
            <input type="text" value={numeroPiece} onChange={e => setNumeroPiece(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition">Soumettre</button>
            <button onClick={() => setShowSubmit(false)} className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 transition">Annuler</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowSubmit(true)} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Soumettre une vérification d'identité
        </button>
      )}

      {msg && <p className={`text-xs mt-2 ${msg.includes('soumise') || msg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
    </div>
  )
}

export default function ParametresPage() {
  const { fontScale, setFontScale, darkMode, setDarkMode } = useTheme()
  const { user } = useAuth()
  const { isMobile } = useDevice()
  const navigate = useNavigate()

  const [cat, setCat] = useState('general')
  const [search, setSearch] = useState('')
  const [saved, setSaved] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetConfirm, setResetConfirm] = useState('')

  // ── States ──
  const [company, setCompany] = useState(getCompanySettings)
  const [stock, setStock] = useState(getStockSettings)
  const [ventes, setVentes] = useState(getVentesSettings)
  const [clients, setClients] = useState(getClientsSettings)
  const [rapports, setRapports] = useState(getRapportsSettings)

  // Mot de passe
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [msgPw, setMsgPw] = useState('')

  // Nouvel utilisateur
  const [newUser, setNewUser] = useState({ nom: '', motDePasse: '', role: 'vendeur' })
  const [showNewUser, setShowNewUser] = useState(false)

  // Sons
  const [sounds, setSounds] = useState(getSoundSettings)

  // 2FA
  const [tfaEnabled, setTfaEnabled] = useState(() => is2FAEnabled(user?.id))
  const [tfaSetup, setTfaSetup] = useState(null) // { secret, otpauthUrl }
  const [tfaCode, setTfaCode] = useState('')
  const [tfaMsg, setTfaMsg] = useState('')
  const [tfaCountdown, setTfaCountdown] = useState(30)
  const [tfaBackupCodes, setTfaBackupCodes] = useState(null)

  // Chiffrement
  const [encPassword, setEncPassword] = useState('')
  const [encMsg, setEncMsg] = useState('')

  // Mise à jour
  const [updateStatus, setUpdateStatus] = useState('idle') // idle | checking | available | downloading | installing | latest | error
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [updateError, setUpdateError] = useState('')

  // Twilio
  const [twilioSid, setTwilioSid] = useState('')
  const [twilioToken, setTwilioToken] = useState('')
  const [twilioFrom, setTwilioFrom] = useState('')
  const [twilioTestPhone, setTwilioTestPhone] = useState('')
  const [twilioMsg, setTwilioMsg] = useState('')
  const [twilioLoading, setTwilioLoading] = useState(false)

  // SMTP
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPass, setSmtpPass] = useState('')
  const [smtpFrom, setSmtpFrom] = useState('')
  const [smtpTestEmail, setSmtpTestEmail] = useState('')
  const [smtpMsg, setSmtpMsg] = useState('')
  const [smtpLoading, setSmtpLoading] = useState(false)

  // ── Recherche ──
  const allSettings = useMemo(() => [
    { cat: 'general', keys: ['entreprise', 'nom commercial', 'adresse', 'téléphone', 'email', 'devise', 'langue', 'thème', 'police', 'mode nuit', 'jour', 'logo'] },
    { cat: 'utilisateurs', keys: ['utilisateurs', 'rôles', 'comptes', 'permissions', 'admin', 'vendeur', 'comptable', 'mot de passe', 'sécurité'] },
    { cat: 'produits', keys: ['produits', 'stock', 'catégories', 'seuil alerte', 'code-barres', 'bouteille', 'canette', 'approvisionnement'] },
    { cat: 'ventes', keys: ['ventes', 'paiements', 'remises', 'tickets', 'espèces', 'mobile money', 'carte', 'crédit'] },
    { cat: 'clients', keys: ['clients', 'fidélité', 'points', 'segmentation', 'vip', 'fichier'] },
    { cat: 'rapports', keys: ['rapports', 'export', 'pdf', 'excel', 'sauvegarde', 'backup'] },
    { cat: 'securite', keys: ['sécurité', 'sauvegarde', 'mots de passe', 'chiffrement', 'restauration', 'réinitialiser', 'données', 'otp', 'twilio', 'sms', 'smtp', 'email', '2fa', 'vérification', 'verification', 'vérifier', 'code'] },
    { cat: 'modules', keys: ['modules', 'secteurs', 'commerce', 'finance', 'industrie', 'transport', 'santé', 'éducation', 'ong', 'activer', 'désactiver'] },
    { cat: 'audit', keys: ['journal', 'logs', 'audit', 'historique', 'actions', 'traçabilité'] },
    { cat: 'update', keys: ['mise à jour', 'update', 'version', 'télécharger', 'installer'] },
  ], [])

  const filteredCat = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const match = allSettings.find(s => s.keys.some(k => k.includes(q)))
    return match ? match.cat : null
  }, [search, allSettings])

  const activeCat = filteredCat || cat

  const save = (section) => {
    if (section === 'general') saveCompanySettings(company)
    else if (section === 'produits') saveStockSettings(stock)
    else if (section === 'ventes') saveVentesSettings(ventes)
    else if (section === 'clients') saveClientsSettings(clients)
    else if (section === 'rapports') saveRapportsSettings(rapports)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setCompany({ ...company, logo: ev.target.result }); save('general') }
    reader.readAsDataURL(file)
  }

  const handlePassword = () => {
    setMsgPw('')
    if (!ancien || !nouveau) { setMsgPw('Remplissez les deux champs'); return }
    const ok = changerMotDePasse(user.id, ancien, nouveau)
    if (ok) { setMsgPw('Mot de passe modifié'); setAncien(''); setNouveau('') }
    else setMsgPw('Ancien mot de passe incorrect')
  }

  const handleAddUser = () => {
    if (!newUser.nom || !newUser.motDePasse) return
    const r = addUser(newUser.nom, newUser.motDePasse, newUser.role)
    if (r) { setNewUser({ nom: '', motDePasse: '', role: 'vendeur' }); setShowNewUser(false) }
  }

  const handleDeleteUser = (id) => {
    if (confirm('Supprimer cet utilisateur ?')) deleteUser(id)
  }

  const handleExportData = () => {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('gestocom_')) data[key] = localStorage.getItem(key)
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `gestocom_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v))
        window.location.reload()
      } catch { alert('Fichier invalide') }
    }
    reader.readAsText(file)
  }

  const users = user?.role === 'admin' ? getUsersForAdmin(user.id) : getUsers()

  // ── 2FA countdown ──
  useEffect(() => {
    if (!tfaSetup) return
    const iv = setInterval(() => setTfaCountdown(getTOTPCountdown()), 1000)
    return () => clearInterval(iv)
  }, [tfaSetup])

  // ── 2FA handlers ──
  const handleEnable2FA = async () => {
    const result = await enable2FA(user.id)
    setTfaSetup(result)
    setTfaCode('')
    setTfaMsg('')
    setTfaBackupCodes(null)
  }

  const handleConfirm2FA = async () => {
    if (tfaCode.length !== 6) { setTfaMsg('Code à 6 chiffres requis'); return }
    const ok = await confirm2FA(user.id, tfaCode)
    if (ok) {
      setTfaEnabled(true)
      const info = get2FAInfo(user.id)
      setTfaBackupCodes(info?.backupCodes)
      setTfaMsg('2FA activé avec succès !')
      setTfaSetup(null)
      addLog('2FA activé', '', user.id, user.nom)
    } else {
      setTfaMsg('Code incorrect')
    }
  }

  const handleDisable2FA = () => {
    if (confirm('Désactiver le 2FA ?')) {
      disable2FA(user.id)
      setTfaEnabled(false)
      setTfaMsg('2FA désactivé')
      addLog('2FA désactivé', '', user.id, user.nom)
    }
  }

  // ── Sound handlers ──
  const updateSound = (key, value) => {
    const next = { ...sounds, [key]: value }
    setSounds(next)
    saveSoundSettings(next)
  }

  // ── Twilio handlers ──
  const handleSaveTwilio = async () => {
    setTwilioLoading(true)
    setTwilioMsg('')
    try {
      const result = await configurerTwilio({ accountSid: twilioSid, authToken: twilioToken, fromNumber: twilioFrom })
      setTwilioMsg(result?.success ? 'Configuration Twilio enregistrée !' : (result?.error || 'Erreur'))
    } catch { setTwilioMsg('Erreur de connexion') }
    setTwilioLoading(false)
  }

  const handleTestTwilio = async () => {
    if (!twilioTestPhone.trim()) { setTwilioMsg('Numéro requis'); return }
    setTwilioLoading(true)
    setTwilioMsg('')
    try {
      const result = await testerTwilio(twilioTestPhone.trim())
      setTwilioMsg(result?.success ? 'SMS de test envoyé !' : (result?.error || 'Échec'))
    } catch { setTwilioMsg('Erreur') }
    setTwilioLoading(false)
  }

  // ── SMTP handlers ──
  const handleSaveSMTP = async () => {
    setSmtpLoading(true)
    setSmtpMsg('')
    try {
      const result = await configurerSMTP({ host: smtpHost, port: +smtpPort, user: smtpUser, pass: smtpPass, from: smtpFrom })
      setSmtpMsg(result?.success ? 'Configuration SMTP enregistrée !' : (result?.error || 'Erreur'))
    } catch { setSmtpMsg('Erreur de connexion') }
    setSmtpLoading(false)
  }

  const handleTestSMTP = async () => {
    if (!smtpTestEmail.trim()) { setSmtpMsg('Email requis'); return }
    setSmtpLoading(true)
    setSmtpMsg('')
    try {
      const result = await testerSMTP(smtpTestEmail.trim())
      setSmtpMsg(result?.success ? 'Email de test envoyé !' : (result?.error || 'Échec'))
    } catch { setSmtpMsg('Erreur') }
    setSmtpLoading(false)
  }

  // ── Render ──
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
        <Settings className="w-6 h-6 text-brand-500" /> Paramètres
      </h1>

      <div className="flex gap-6 params-layout">
        {/* ── Sidebar gauche ── */}
        <div className="w-56 flex-shrink-0 params-sidebar">
          {/* Recherche */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>

          {/* Menu */}
          <nav className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
            {CATEGORIES.map(c => {
              const active = activeCat === c.key
              return (
                <button key={c.key} onClick={() => { setCat(c.key); setSearch('') }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    active ? 'bg-brand-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'
                  }`}>
                  <c.icon className="w-4 h-4" />
                  {c.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* ── Contenu principal ── */}
        <div className="flex-1 min-w-0">
          {saved && (
            <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Enregistré
            </div>
          )}

          {/* ═══ GÉNÉRAL ═══ */}
          {activeCat === 'general' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Building2 className="w-5 h-5 text-brand-500" /> Entreprise
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom de l'entreprise</label>
                    <Input value={company.nom} onChange={v => setCompany({ ...company, nom: v })} placeholder="LES RETROUVAILLES CEZ LUICI" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom commercial</label>
                    <Input value={company.nomCommercial} onChange={v => setCompany({ ...company, nomCommercial: v })} placeholder="GESTOCOM CI" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</label>
                    <Input value={company.adresse} onChange={v => setCompany({ ...company, adresse: v })} placeholder="Conakry, Kaloum" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</label>
                    <div className="flex items-center">
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-gray-100 dark:bg-dark-600 border border-gray-300 dark:border-dark-600 border-r-0 rounded-l-lg px-1.5 py-2">+225</span>
                      <input value={company.telephone} onChange={e => setCompany({ ...company, telephone: e.target.value })} placeholder="XX XX XX XX XX"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-r-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                    <Input type="email" value={company.email} onChange={v => setCompany({ ...company, email: v })} placeholder="contact@gestoci.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Devise</label>
                    <Input value={company.devise} onChange={v => setCompany({ ...company, devise: v })} placeholder="FCFA" />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Logo</label>
                  <div className="flex items-center gap-4">
                    {company.logo ? (
                      <img src={company.logo} alt="" className="w-16 h-16 rounded-lg border dark:border-dark-600 object-contain bg-gray-50 dark:bg-dark-700 p-1" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-600 flex items-center justify-center text-gray-400"><Tag className="w-6 h-6 opacity-30" /></div>
                    )}
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-lg text-xs font-medium dark:text-gray-300 transition-colors">
                        Choisir <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      </label>
                      {company.logo && <button onClick={() => { setCompany({ ...company, logo: '' }); save('general') }} className="ml-2 text-xs text-red-500">Supprimer</button>}
                    </div>
                  </div>
                </div>

                <button onClick={() => save('general')} className="btn-primary text-sm py-2 px-5 mt-4 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Enregistrer
                </button>
              </div>

              {/* Affichage */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Palette className="w-5 h-5 text-brand-500" /> Affichage
                </h3>
                <SettingRow label="Taille de la police" desc={`${Math.round(fontScale * 100)}%`}>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setFontScale(Math.max(0.7, fontScale - 0.1))} className="w-7 h-7 rounded border dark:border-dark-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700"><Minus className="w-3 h-3" /></button>
                    <input type="range" min={0.7} max={1.5} step={0.1} value={fontScale} onChange={e => setFontScale(+e.target.value)} className="w-32" />
                    <button onClick={() => setFontScale(Math.min(1.5, fontScale + 0.1))} className="w-7 h-7 rounded border dark:border-dark-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700"><Plus className="w-3 h-3" /></button>
                  </div>
                </SettingRow>
                <SettingRow label="Mode sombre">
                  <div className="flex gap-2">
                    <button onClick={() => setDarkMode(false)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!darkMode ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 dark:border-dark-600 hover:border-brand-400 dark:text-gray-300'}`}><Sun className="w-3.5 h-3.5" /> Jour</button>
                    <button onClick={() => setDarkMode(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${darkMode ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 dark:border-dark-600 hover:border-brand-400 dark:text-gray-300'}`}><Moon className="w-3.5 h-3.5" /> Nuit</button>
                  </div>
                </SettingRow>
                <SettingRow label="Langue" desc="Français">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Français</span>
                </SettingRow>
              </div>
            </div>
          )}

          {/* ═══ UTILISATEURS & RÔLES ═══ */}
          {activeCat === 'utilisateurs' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2 dark:text-white">
                    <Users className="w-5 h-5 text-brand-500" /> Comptes utilisateurs
                  </h3>
                  <button onClick={() => setShowNewUser(!showNewUser)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600">
                    <UserPlus className="w-3.5 h-3.5" /> Ajouter
                  </button>
                </div>

                {showNewUser && (
                  <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input value={newUser.nom} onChange={v => setNewUser({ ...newUser, nom: v })} placeholder="Nom" />
                      <Input type="password" value={newUser.motDePasse} onChange={v => setNewUser({ ...newUser, motDePasse: v })} placeholder="Mot de passe" />
                      <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                        <option value="vendeur">Vendeur</option>
                        <option value="comptable">Comptable</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddUser} className="btn-primary text-xs py-1.5 px-4">Créer</button>
                      <button onClick={() => setShowNewUser(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">Annuler</button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                        <th className="pb-2 font-medium">ID</th>
                        <th className="pb-2 font-medium">Nom</th>
                        <th className="pb-2 font-medium">Rôle</th>
                        <th className="pb-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => user?.role === 'admin' ? u.role !== 'admin' || u.id === user?.id : true).map(u => {
                        const isDefault = isDefaultAdmin(u)
                        return (
                        <tr key={u.id} className={`border-b border-gray-50 dark:border-dark-700 last:border-0 ${isDefault ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                          <td className="py-2 text-gray-400">#{u.id}</td>
                          <td className="py-2 dark:text-white font-medium">
                            {u.nom}
                            {isDefault && <span className="ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-[10px] font-medium">Principal</span>}
                          </td>
                          <td className="py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                              u.role === 'comptable' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>{u.role}</span>
                          </td>
                          <td className="py-2">
                            {!isDefault && u.id !== user?.id && (
                              <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun utilisateur</p>}
              </div>

              {/* Permissions */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Shield className="w-5 h-5 text-gold-500" /> Permissions par rôle
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                        <th className="pb-2 font-medium">Action</th>
                        <th className="pb-2 font-medium text-center">Admin</th>
                        <th className="pb-2 font-medium text-center">Comptable</th>
                        <th className="pb-2 font-medium text-center">Vendeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Tableau de bord', true, true, true],
                        ['Gestion stock', true, false, true],
                        ['Ventes', true, false, true],
                        ['Dépenses', true, true, false],
                        ['Rapports', true, true, false],
                        ['Paramètres', true, false, false],
                      ].map(([action, a, c, v]) => (
                        <tr key={action} className="border-b border-gray-50 dark:border-dark-700 last:border-0">
                          <td className="py-2 dark:text-white">{action}</td>
                          <td className="py-2 text-center">{a ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300 dark:text-dark-600">—</span>}</td>
                          <td className="py-2 text-center">{c ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300 dark:text-dark-600">—</span>}</td>
                          <td className="py-2 text-center">{v ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-gray-300 dark:text-dark-600">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ PRODUITS & STOCK ═══ */}
          {activeCat === 'produits' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Package className="w-5 h-5 text-brand-500" /> Paramètres stock
                </h3>
                <SettingRow label="Seuil d'alerte par défaut" desc="Stock minimum avant alerte">
                  <Input type="number" value={stock.seuilAlerteDefaut} onChange={v => setStock({ ...stock, seuilAlerteDefaut: +v })} className="w-24 text-center" />
                </SettingRow>
                <SettingRow label="Préfixe code-barres" desc="Ex: GCI000001">
                  <Input value={stock.prefixeCodeBarres} onChange={v => setStock({ ...stock, prefixeCodeBarres: v })} className="w-24 text-center" />
                </SettingRow>
                <button onClick={() => save('produits')} className="btn-primary text-sm py-2 px-5 mt-4 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Enregistrer
                </button>
              </div>

              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Tag className="w-5 h-5 text-gold-500" /> Catégories de produits
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {stock.categories.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full text-sm">
                      {c}
                      <button onClick={() => {
                        const next = stock.categories.filter((_, j) => j !== i)
                        setStock({ ...stock, categories: next })
                      }} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <AddChip onAdd={(val) => setStock({ ...stock, categories: [...stock.categories, val] })} placeholder="Nouvelle catégorie..." />
              </div>
            </div>
          )}

          {/* ═══ VENTES & PAIEMENTS ═══ */}
          {activeCat === 'ventes' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <ShoppingCart className="w-5 h-5 text-brand-500" /> Modes de paiement
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {ventes.modesPaiement.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-full text-sm">
                    {m}
                    <button onClick={() => setVentes({ ...ventes, modesPaiement: ventes.modesPaiement.filter((_, j) => j !== i) })} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <AddChip onAdd={(val) => setVentes({ ...ventes, modesPaiement: [...ventes.modesPaiement, val] })} placeholder="Nouveau mode..." />

              <div className="mt-6">
                <SettingRow label="Activer les remises" desc="Permettre les remises sur les ventes">
                  <Toggle value={ventes.remisesActivees} onChange={v => { setVentes({ ...ventes, remisesActivees: v }); save('ventes') }} />
                </SettingRow>
                <SettingRow label="Générer des tickets" desc="Imprimer un reçu après chaque vente">
                  <Toggle value={ventes.ticketsActivees} onChange={v => { setVentes({ ...ventes, ticketsActivees: v }); save('ventes') }} />
                </SettingRow>
                <SettingRow label="Préfixe ticket">
                  <Input value={ventes.prefixeTicket} onChange={v => setVentes({ ...ventes, prefixeTicket: v })} className="w-24 text-center" />
                </SettingRow>
              </div>

              <div className="mt-6 pt-4 border-t dark:border-dark-600">
                <h4 className="text-sm font-medium dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-brand-500" /> TVA & remises
                </h4>
                <SettingRow label="TVA active" desc="Appliquer la TVA sur les ventes">
                  <Toggle value={ventes.tvaActivee} onChange={v => { setVentes({ ...ventes, tvaActivee: v }); save('ventes') }} />
                </SettingRow>
                {ventes.tvaActivee && (
                  <SettingRow label="Taux TVA (%)" desc="Taux de TVA appliqué">
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={100} step={0.5} value={ventes.tvaTaux}
                        onChange={e => setVentes({ ...ventes, tvaTaux: +e.target.value })}
                        className="w-20 text-center px-2 py-1 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-sm dark:text-white" />
                      <Percent className="w-4 h-4 text-gray-400" />
                    </div>
                  </SettingRow>
                )}
                <SettingRow label="Remise maximale (%)" desc="Seuil d'alerte si la remise dépasse ce taux">
                  <div className="flex items-center gap-2">
                    <input type="number" min={0} max={100} step={5} value={ventes.remiseMaxTaux}
                      onChange={e => setVentes({ ...ventes, remiseMaxTaux: +e.target.value })}
                      className="w-20 text-center px-2 py-1 rounded-lg border dark:border-dark-600 bg-white dark:bg-dark-700 text-sm dark:text-white" />
                    <Percent className="w-4 h-4 text-gray-400" />
                  </div>
                </SettingRow>
              </div>

              <div className="mt-6 pt-4 border-t dark:border-dark-600">
                <h4 className="text-sm font-medium dark:text-gray-300 mb-3">Pied de page des reçus</h4>
                <SettingRow label="Message personnalisé" desc="Affiché en bas du reçu">
                  <Input value={ventes.messageRecu || ''} onChange={v => setVentes({ ...ventes, messageRecu: v })} className="w-64" placeholder="Merci de votre confiance !" />
                </SettingRow>
                <SettingRow label="Politique de retour" desc="Affichée sur le reçu">
                  <Input value={ventes.politiqueRetour || ''} onChange={v => setVentes({ ...ventes, politiqueRetour: v })} className="w-64" placeholder="Échanges sous 7 jours avec reçu" />
                </SettingRow>
              </div>

              {/* Alertes sonores */}
              <div className="mt-6 pt-4 border-t dark:border-dark-600">
                <h4 className="text-sm font-medium dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gold-500" /> Alertes sonores
                </h4>
                <SettingRow label="Sons activés" desc="Activer/désactiver tous les sons">
                  <div className="flex items-center gap-2">
                    {sounds.enabled ? <Volume2 className="w-4 h-4 text-brand-500" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                    <Toggle value={sounds.enabled} onChange={v => updateSound('enabled', v)} />
                  </div>
                </SettingRow>
                {sounds.enabled && (
                  <>
                    <SettingRow label="Volume" desc={`${Math.round(sounds.volume * 100)}%`}>
                      <div className="flex items-center gap-2">
                        <VolumeX className="w-3 h-3 text-gray-400" />
                        <input type="range" min={0} max={1} step={0.1} value={sounds.volume}
                          onChange={e => updateSound('volume', +e.target.value)} className="w-24" />
                        <Volume2 className="w-3 h-3 text-brand-500" />
                      </div>
                    </SettingRow>
                    <SettingRow label="Rupture de stock" desc="Sonner quand un produit est en rupture">
                      <Toggle value={sounds.stockAlert} onChange={v => updateSound('stockAlert', v)} />
                    </SettingRow>
                    <SettingRow label="Erreur de paiement" desc="Sonner en cas d'erreur">
                      <Toggle value={sounds.paymentError} onChange={v => updateSound('paymentError', v)} />
                    </SettingRow>
                    <SettingRow label="Tentative suspecte" desc="Alarme en cas de fraude détectée">
                      <Toggle value={sounds.suspiciousAttempt} onChange={v => updateSound('suspiciousAttempt', v)} />
                    </SettingRow>
                    <SettingRow label="Vente complète" desc="Son de confirmation après validation">
                      <Toggle value={sounds.saleComplete} onChange={v => updateSound('saleComplete', v)} />
                    </SettingRow>
                    <SettingRow label="Remise importante" desc="Alerte sonore quand une remise > 20% est appliquée">
                      <Toggle value={sounds.discountAlert} onChange={v => updateSound('discountAlert', v)} />
                    </SettingRow>
                    <SettingRow label="Quantité dépassée" desc="Alerte si la quantité demandée dépasse le stock">
                      <Toggle value={sounds.quantityExceeded} onChange={v => updateSound('quantityExceeded', v)} />
                    </SettingRow>
                    <div className="mt-2">
                      <button onClick={playTestSound} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
                        <Volume2 className="w-3.5 h-3.5" /> Tester le son
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button onClick={() => save('ventes')} className="btn-primary text-sm py-2 px-5 mt-4 flex items-center gap-2">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          )}

          {/* ═══ CLIENTS & FIDÉLITÉ ═══ */}
          {activeCat === 'clients' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <Heart className="w-5 h-5 text-brand-500" /> Fidélité & segmentation
              </h3>
              <SettingRow label="Programme de fidélité" desc="Attribuer des points à chaque achat">
                <Toggle value={clients.fideliteActivee} onChange={v => { setClients({ ...clients, fideliteActivee: v }); save('clients') }} />
              </SettingRow>
              {clients.fideliteActivee && (
                <>
                  <SettingRow label="Points par 1 000 FCFA" desc="Nombre de points pour 1 000 FCFA dépensés">
                    <Input type="number" value={clients.pointsParFCFA} onChange={v => setClients({ ...clients, pointsParFCFA: +v })} className="w-24 text-center" />
                  </SettingRow>
                  <SettingRow label="Seuil VIP" desc="CA minimum pour statut VIP (FCFA)">
                    <Input type="number" value={clients.seuilVIP} onChange={v => setClients({ ...clients, seuilVIP: +v })} className="w-32 text-center" />
                  </SettingRow>
                </>
              )}
              <SettingRow label="Segmentation clients" desc="Classifier les clients par catégorie">
                <Toggle value={clients.segmentationActivee} onChange={v => { setClients({ ...clients, segmentationActivee: v }); save('clients') }} />
              </SettingRow>

              <button onClick={() => save('clients')} className="btn-primary text-sm py-2 px-5 mt-4 flex items-center gap-2">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          )}

          {/* ═══ RAPPORTS & EXPORT ═══ */}
          {activeCat === 'rapports' && (
            <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <BarChart3 className="w-5 h-5 text-brand-500" /> Export & rapports
              </h3>
              <SettingRow label="Format d'export par défaut" desc="Format pour les rapports">
                <select value={rapports.formatExport} onChange={e => setRapports({ ...rapports, formatExport: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </SettingRow>
              <SettingRow label="Sauvegarde automatique" desc="Exporter les données automatiquement">
                <Toggle value={rapports.autoBackup} onChange={v => { setRapports({ ...rapports, autoBackup: v }); save('rapports') }} />
              </SettingRow>
              {rapports.autoBackup && (
                <SettingRow label="Périodicité">
                  <select value={rapports.periodiciteBackup} onChange={e => setRapports({ ...rapports, periodiciteBackup: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
                    <option value="quotidienne">Quotidienne</option>
                    <option value="hebdomadaire">Hebdomadaire</option>
                    <option value="mensuelle">Mensuelle</option>
                  </select>
                </SettingRow>
              )}

              <div className="mt-6 flex gap-3">
                <button onClick={handleExportData} className="flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                  <Download className="w-4 h-4" /> Exporter les données
                </button>
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" /> Importer
                  <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                </label>
              </div>

              <button onClick={() => save('rapports')} className="btn-primary text-sm py-2 px-5 mt-4 flex items-center gap-2">
                <Save className="w-4 h-4" /> Enregistrer
              </button>
            </div>
          )}

          {/* ═══ SÉCURITÉ & SAUVEGARDE ═══ */}
          {activeCat === 'securite' && (
            <div className="space-y-6">
              {/* Mot de passe */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Lock className="w-5 h-5 text-gold-500" /> Changer le mot de passe
                </h3>
                <div className="space-y-3 max-w-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mot de passe actuel</label>
                    <Input type="password" value={ancien} onChange={setAncien} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nouveau mot de passe</label>
                    <Input type="password" value={nouveau} onChange={setNouveau} />
                  </div>
                  {msgPw && <p className={`text-sm ${msgPw.includes('modifié') ? 'text-green-600' : 'text-red-500'}`}>{msgPw}</p>}
                  <button onClick={handlePassword} className="btn-primary text-sm py-2 px-4">Modifier</button>
                </div>
              </div>

              {/* 2FA */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Smartphone className="w-5 h-5 text-brand-500" /> Authentification à deux facteurs (2FA)
                </h3>
                <SettingRow label="2FA activé" desc="Sécurité renforcée : code de vérification à la connexion">
                  <div className="flex items-center gap-2">
                    {tfaEnabled ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <Shield className="w-4 h-4 text-gray-400" />}
                    <span className={`text-xs font-medium ${tfaEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {tfaEnabled ? 'Activé' : 'Désactivé'}
                    </span>
                  </div>
                </SettingRow>

                {!tfaEnabled && !tfaSetup && (
                  <button onClick={handleEnable2FA} className="mt-3 flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-sm font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                    <Key className="w-4 h-4" /> Activer le 2FA
                  </button>
                )}

                {tfaSetup && (
                  <div className="mt-4 bg-gray-50 dark:bg-dark-700 rounded-lg p-4 space-y-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      1. Scannez ce QR code avec Google Authenticator ou entrez la clé manuellement :
                    </p>
                    <div className="bg-white dark:bg-dark-800 rounded-lg p-3 text-center">
                      <div className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all mb-2">{tfaSetup.secret}</div>
                      <a href={tfaSetup.otpauthUrl} target="_blank" rel="noopener"
                        className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                        Ouvrir le lien TOTP
                      </a>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      2. Entrez le code à 6 chiffres de votre application :
                    </p>
                    <div className="flex gap-2">
                      <input value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000" maxLength={6}
                        className="w-32 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm font-mono text-center bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
                      <span className="text-xs text-gray-400 self-center">{tfaCountdown}s</span>
                      <button onClick={handleConfirm2FA} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Confirmer</button>
                    </div>
                    {tfaMsg && <p className={`text-sm ${tfaMsg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>{tfaMsg}</p>}
                  </div>
                )}

                {tfaEnabled && !tfaSetup && (
                  <button onClick={handleDisable2FA} className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 className="w-4 h-4" /> Désactiver le 2FA
                  </button>
                )}

                {tfaBackupCodes && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-2">Codes de secours (à conserver) :</p>
                    <div className="grid grid-cols-2 gap-1">
                      {tfaBackupCodes.map((c, i) => (
                        <code key={i} className="text-xs font-mono dark:text-yellow-200">{c}</code>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vérification du compte */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Mail className="w-5 h-5 text-blue-500" /> Vérification du compte
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Vérifiez votre email et téléphone pour sécuriser votre compte.
                </p>
                <VerificationSection user={user} addLog={addLog} />
              </div>

              {/* Vérification identité */}
              <IdentityVerificationPanel user={user} addLog={addLog} />

              {/* Twilio SMS */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <MessageSquare className="w-5 h-5 text-green-500" /> OTP par SMS (Twilio)
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Configurez Twilio pour envoyer les codes OTP par SMS. Canal principal de vérification.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Account SID</label>
                    <Input value={twilioSid} onChange={setTwilioSid} placeholder="ACxxxxxxxx" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Auth Token</label>
                    <Input type="password" value={twilioToken} onChange={setTwilioToken} placeholder="Token Twilio" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Numéro expéditeur</label>
                    <Input value={twilioFrom} onChange={setTwilioFrom} placeholder="+225 XX XX XX XX XX" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSaveTwilio} disabled={twilioLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
                    {twilioLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <div className="flex gap-2 flex-1">
                    <input value={twilioTestPhone} onChange={e => setTwilioTestPhone(e.target.value)} placeholder="Numéro de test (XX XX XX XX XX)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                    <button onClick={handleTestTwilio} disabled={twilioLoading}
                      className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-600 transition disabled:opacity-50">
                      Tester
                    </button>
                  </div>
                </div>
                {twilioMsg && <p className={`text-sm mt-2 ${twilioMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>{twilioMsg}</p>}
              </div>

              {/* SMTP Email */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Mail className="w-5 h-5 text-blue-500" /> OTP par Email (SMTP)
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Fallback email si Twilio n'est pas configuré. Les codes OTP seront envoyés par email.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Serveur SMTP</label>
                    <Input value={smtpHost} onChange={setSmtpHost} placeholder="smtp.gmail.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Port</label>
                    <Input value={smtpPort} onChange={setSmtpPort} placeholder="587" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Utilisateur</label>
                    <Input value={smtpUser} onChange={setSmtpUser} placeholder="votre@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mot de passe</label>
                    <Input type="password" value={smtpPass} onChange={setSmtpPass} placeholder="Mot de passe SMTP" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email expéditeur</label>
                    <Input type="email" value={smtpFrom} onChange={setSmtpFrom} placeholder="noreply@gestoci.com" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSaveSMTP} disabled={smtpLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                    {smtpLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                  <div className="flex gap-2 flex-1">
                    <input value={smtpTestEmail} onChange={e => setSmtpTestEmail(e.target.value)} placeholder="Email de test"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white" />
                    <button onClick={handleTestSMTP} disabled={smtpLoading}
                      className="px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-600 transition disabled:opacity-50">
                      Tester
                    </button>
                  </div>
                </div>
                {smtpMsg && <p className={`text-sm mt-2 ${smtpMsg.includes('!') ? 'text-green-600' : 'text-red-500'}`}>{smtpMsg}</p>}
              </div>

              {/* Chiffrement */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
                <h3 className="font-semibold mb-4 flex items-center gap-2 dark:text-white">
                  <Lock className="w-5 h-5 text-purple-500" /> Chiffrement AES-256
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Chiffrez les données sensibles (reçus, infos clients) avec AES-256-GCM.
                </p>
                <SettingRow label="Clé de chiffrement" desc={hasMasterKey() ? 'Clé active' : 'Non configurée'}>
                  <div className="flex items-center gap-2">
                    {hasMasterKey() ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <Shield className="w-4 h-4 text-gray-400" />}
                  </div>
                </SettingRow>
                <div className="flex gap-2 mt-3">
                  <input type="password" value={encPassword} onChange={e => setEncPassword(e.target.value)}
                    placeholder="Clé de chiffrement..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  <button onClick={() => {
                    if (encPassword.length < 8) { setEncMsg('Minimum 8 caractères'); return }
                    setMasterKey(encPassword)
                    setEncMsg('Clé de chiffrement activée !')
                    setEncPassword('')
                    addLog('Chiffrement activé', '', user.id, user.nom)
                  }} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600">
                    Activer
                  </button>
                </div>
                {encMsg && <p className={`text-sm mt-2 ${encMsg.includes('activée') ? 'text-green-600' : 'text-red-500'}`}>{encMsg}</p>}
              </div>

              {/* Réinitialiser */}
              <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-red-200 dark:border-red-900/50">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Trash2 className="w-5 h-5" /> Zone dangereuse
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Réinitialiser toutes les données. Irréversible.</p>

                {!showReset ? (
                  <button onClick={() => setShowReset(true)} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    Réinitialiser les données
                  </button>
                ) : (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">Confirmer la réinitialisation</p>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Tous les produits, ventes, dépenses, fournisseurs et utilisateurs seront supprimés.</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Tapez <span className="font-mono font-bold">SUPPRIMER</span> pour confirmer :</p>
                    <input value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} placeholder="SUPPRIMER"
                      className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-300" />
                    <div className="flex gap-2">
                      <button onClick={() => { setShowReset(false); setResetConfirm('') }} className="px-4 py-2 bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-500">Annuler</button>
                      <button onClick={() => { if (resetConfirm !== 'SUPPRIMER') return; localStorage.clear(); navigate('/login'); window.location.reload() }}
                        disabled={resetConfirm !== 'SUPPRIMER'}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${resetConfirm === 'SUPPRIMER' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-200 dark:bg-red-900/30 text-red-400 cursor-not-allowed'}`}>
                        Tout supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ MODULES & SECTEURS ═══ */}
          {activeCat === 'modules' && (
            <ModulesSection />
          )}

          {/* ═══ JOURNALISATION ═══ */}
          {activeCat === 'audit' && (
            <AuditSection />
          )}

          {/* ═══ SYNCHRONISATION ═══ */}
          {activeCat === 'sync' && (
            <SyncSection user={user} />
          )}

          {/* ═══ MISE À JOUR ═══ */}
          {activeCat === 'update' && (
            <UpdateSection
              updateStatus={updateStatus}
              setUpdateStatus={setUpdateStatus}
              updateInfo={updateInfo}
              setUpdateInfo={setUpdateInfo}
              updateProgress={updateProgress}
              setUpdateProgress={setUpdateProgress}
              updateError={updateError}
              setUpdateError={setUpdateError}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Composant Synchronisation ──
function SyncSection({ user }) {
  const [syncMsg, setSyncMsg] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [importData, setImportData] = useState(null)
  const fileRef = null

  const handleExport = () => {
    try {
      exportAccountData(user.id)
      setSyncMsg('Fichier de sauvegarde téléchargé !')
      setTimeout(() => setSyncMsg(''), 3000)
    } catch (e) {
      setSyncMsg('Erreur lors de l\'export : ' + e.message)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await parseImportFile(file)
      setImportData(data)
      setSyncMsg(`Fichier chargé : ${data.users?.length || 0} utilisateur(s), ${data.productsV2?.length || data.products?.length || 0} produit(s)`)
    } catch (err) {
      setSyncMsg('❌ ' + err.message)
      setImportData(null)
    }
  }

  const handleImport = () => {
    if (!importData) return
    try {
      const result = importAccountData(importData)
      setSyncMsg(`✅ Import terminé : ${result.productCount} produit(s), ${result.venteCount} vente(s)`)
      setImportData(null)
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setSyncMsg('Erreur lors de l\'import : ' + e.message)
    }
  }

  const handleCloudSync = async () => {
    setSyncing(true)
    setSyncMsg('Synchronisation en cours...')
    try {
      await pushToFirestore(user.email || user.nom, user.id)
      setSyncMsg('✅ Données synchronisées dans le cloud !')
    } catch (e) {
      setSyncMsg('❌ Erreur de synchronisation : ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
          <Download className="w-5 h-5 text-brand-500" /> Sauvegarder les données
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Téléchargez un fichier contenant toutes vos données (utilisateurs, produits, ventes, paramètres) pour les transférer sur un autre appareil.
        </p>
        <button onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition">
          <Download className="w-4 h-4" /> Télécharger la sauvegarde
        </button>
      </div>

      {/* Import */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
          <Upload className="w-5 h-5 text-brand-500" /> Restaurer les données
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Importez un fichier de sauvegarde GESTOCOM pour restaurer vos données sur cet appareil.
        </p>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-600 transition cursor-pointer text-gray-700 dark:text-gray-300">
            <Upload className="w-4 h-4" /> Choisir un fichier
            <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          </label>
          {importData && (
            <button onClick={handleImport}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition">
              <CheckCircle className="w-4 h-4" /> Importer maintenant
            </button>
          )}
        </div>
      </div>

      {/* Cloud sync */}
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold mb-3 flex items-center gap-2 dark:text-white">
          <RefreshCw className="w-5 h-5 text-brand-500" /> Synchronisation cloud
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Synchronisez vos données avec le cloud pour y accéder depuis n'importe quel appareil connecté à internet.
        </p>
        <button onClick={handleCloudSync} disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
        </button>
      </div>

      {syncMsg && (
        <p className={`text-sm mt-2 ${syncMsg.startsWith('✅') || syncMsg.startsWith('Téléchargé') ? 'text-green-600 dark:text-green-400' : syncMsg.startsWith('❌') ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {syncMsg}
        </p>
      )}

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Important</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              L'import remplace toutes les données de cet appareil. Assurez-vous d'avoir une sauvegarde avant d'importer.
              La synchronisation cloud écrase les données distantes avec les données de cet appareil.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Composant Modules & Secteurs ──
function ModulesSection() {
  const [settings, setSettings] = useState(getCompanySettings)
  const enabled = settings.enabledSectors || ['commerce']

  const SECTORS = [
    { id: 'commerce', nom: 'Commerce & Distribution', icon: '🛒', desc: 'Stocks, ventes, fournisseurs' },
    { id: 'finance', nom: 'Finance & Comptabilité', icon: '🏦', desc: 'Comptabilité OHADA, trésorerie' },
    { id: 'industrie', nom: 'Industrie & Artisanat', icon: '🏭', desc: 'Production, traçabilité, coûts' },
    { id: 'transport', nom: 'Transport & Logistique', icon: '🚛', desc: 'Livraisons, véhicules, itinéraires' },
    { id: 'sante', nom: 'Santé & Pharmacies', icon: '💊', desc: 'Médicaments, patients, ordonnances' },
    { id: 'education', nom: 'Éducation & Formation', icon: '🎓', desc: 'Inscriptions, notes, emplois du temps' },
    { id: 'ong', nom: 'ONG & Associations', icon: '🤝', desc: 'Projets, bénéficiaires, rapports' },
  ]

  const toggle = (id) => {
    const newEnabled = enabled.includes(id) ? enabled.filter(s => s !== id) : [...enabled, id]
    const newSettings = { ...settings, enabledSectors: newEnabled }
    setSettings(newSettings)
    saveCompanySettings(newSettings)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Activez ou désactivez les secteurs adaptés à votre activité.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTORS.map(s => {
          const active = enabled.includes(s.id)
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                active ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-dark-700 hover:border-gray-300'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg mr-2">{s.icon}</span>
                  <span className={`font-semibold text-sm ${active ? 'text-brand-700 dark:text-brand-300' : 'dark:text-white'}`}>{s.nom}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">{s.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${active ? 'bg-brand-500' : 'bg-gray-300 dark:bg-dark-600'}`}>
                  {active && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Composant Audit ──
function AuditSection() {
  const [logs, setLogs] = useState(getLogs)
  const [filter, setFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')

  const filtered = logs.filter(l => {
    if (filter && !l.action.toLowerCase().includes(filter.toLowerCase()) && !l.detail.toLowerCase().includes(filter.toLowerCase())) return false
    if (userFilter && l.userNom !== userFilter) return false
    return true
  }).reverse()

  const uniqueUsers = [...new Set(logs.map(l => l.userNom).filter(Boolean))]

  const handleClear = () => {
    if (confirm('Supprimer tous les logs ?')) { clearLogs(); setLogs([]) }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2 dark:text-white">
            <FileText className="w-5 h-5 text-brand-500" /> Journal des actions
          </h3>
          <div className="flex gap-2">
            <button onClick={exportLogs} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/30">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30">
              <Trash2 className="w-3.5 h-3.5" /> Effacer
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Rechercher une action..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
          </div>
          {uniqueUsers.length > 0 && (
            <select value={userFilter} onChange={e => setUserFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white">
              <option value="">Tous les utilisateurs</option>
              {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-dark-700">
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-dark-600">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Détail</th>
                <th className="px-3 py-2 font-medium">Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-400">Aucun log</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="border-b border-gray-50 dark:border-dark-700 last:border-0">
                  <td className="px-3 py-2 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleDateString('fr-FR')} {new Date(l.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      l.action.includes('supprimé') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      l.action.includes('ajouté') || l.action.includes('créé') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      l.action.includes('modifié') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      l.action.includes('échouée') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      l.action.includes('Connexion') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-gray-100 text-gray-700 dark:bg-dark-600 dark:text-gray-300'
                    }`}>{l.action}</span>
                  </td>
                  <td className="px-3 py-2 text-xs dark:text-gray-300 max-w-xs truncate">{l.detail}</td>
                  <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{l.userNom || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-400 mt-3">{filtered.length} action{filtered.length > 1 ? 's' : ''}</div>
      </div>
    </div>
  )
}

// ── Composant helper pour ajouter un tag ──
function AddChip({ onAdd, placeholder }) {
  const [val, setVal] = useState('')
  const handle = () => { if (val.trim()) { onAdd(val.trim()); setVal('') } }
  return (
    <div className="flex gap-2 max-w-xs">
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} placeholder={placeholder}
        className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
      <button onClick={handle} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600">+</button>
    </div>
  )
}

function Palette({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
}

function UpdateSection({ updateStatus, setUpdateStatus, updateInfo, setUpdateInfo, updateProgress, setUpdateProgress, updateError, setUpdateError }) {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.checkUpdate

  const checkUpdate = async () => {
    if (!isElectron) { setUpdateStatus('error'); setUpdateError('Disponible uniquement sur l\'application desktop'); return }
    setUpdateStatus('checking')
    setUpdateError('')
    try {
      const info = await window.electronAPI.checkUpdate()
      if (info.error) { setUpdateStatus('error'); setUpdateError(info.error); return }
      if (info.hasUpdate) {
        setUpdateStatus('available')
        setUpdateInfo(info)
      } else {
        setUpdateStatus('latest')
      }
    } catch (e) {
      setUpdateStatus('error')
      setUpdateError(e.message || 'Erreur lors de la vérification')
    }
  }

  const downloadUpdate = async () => {
    if (!updateInfo?.zipUrl) return
    setUpdateStatus('downloading')
    setUpdateProgress(0)
    try {
      const unsub = window.electronAPI.onUpdateProgress((data) => {
        setUpdateProgress(data.percent || 0)
        if (data.status?.includes('redémarrer') || data.status?.includes('Préparation')) setUpdateStatus('installing')
      })
      await window.electronAPI.downloadUpdate(updateInfo.zipUrl)
      unsub()
    } catch (e) {
      setUpdateStatus('error')
      setUpdateError(e.message || 'Erreur lors du téléchargement')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-800 rounded-xl p-6 border border-gray-100 dark:border-dark-700">
        <h3 className="font-semibold flex items-center gap-2 dark:text-white mb-4">
          <RefreshCw className="w-5 h-5 text-brand-500" /> Mise à jour de l'application
        </h3>

        {!isElectron ? (
          <div className="text-center py-8">
            <Smartphone className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">La mise à jour automatique est disponible uniquement sur l'application desktop.</p>
            <Link to="/download" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition">
              <Download className="w-4 h-4" /> Télécharger la dernière version
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-dark-700">
              {updateStatus === 'idle' && <><Settings className="w-5 h-5 text-gray-400" /><span className="text-sm dark:text-gray-300">Cliquez sur "Vérifier" pour rechercher une mise à jour.</span></>}
              {updateStatus === 'checking' && <><RefreshCw className="w-5 h-5 text-brand-500 animate-spin" /><span className="text-sm dark:text-gray-300">Vérification en cours...</span></>}
              {updateStatus === 'available' && <><AlertTriangle className="w-5 h-5 text-amber-500" /><span className="text-sm dark:text-gray-300">Nouvelle version <strong>{updateInfo?.version}</strong> disponible ! La mise à jour se fera automatiquement.</span></>}
              {updateStatus === 'downloading' && (
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-brand-500 animate-pulse" />
                    <span className="text-sm dark:text-gray-300">Téléchargement... {updateProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-dark-600 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full transition-all duration-300" style={{ width: updateProgress + '%' }} />
                  </div>
                </div>
              )}
              {updateStatus === 'installing' && <><RefreshCw className="w-5 h-5 text-green-500 animate-spin" /><span className="text-sm dark:text-gray-300">Mise à jour en cours... L'application va redémarrer automatiquement.</span></>}
              {updateStatus === 'latest' && <><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-sm dark:text-gray-300">Votre application est à jour.</span></>}
              {updateStatus === 'error' && <><AlertTriangle className="w-5 h-5 text-red-500" /><span className="text-sm text-red-600 dark:text-red-400">{updateError}</span></>}
            </div>

            {/* Changelog */}
            {updateInfo?.changelog && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Nouveautés :</p>
                <p className="text-sm text-blue-600 dark:text-blue-200">{updateInfo.changelog}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              {(updateStatus === 'idle' || updateStatus === 'latest' || updateStatus === 'error') && (
                <button onClick={checkUpdate} disabled={updateStatus === 'checking'}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                  {updateStatus === 'checking' ? 'Vérification...' : 'Vérifier'}
                </button>
              )}
              {updateStatus === 'available' && (
                <button onClick={downloadUpdate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition">
                  <Download className="w-4 h-4" /> Mettre à jour
                </button>
              )}
              {updateStatus === 'available' && (
                <button onClick={() => { setUpdateStatus('idle'); setUpdateInfo(null) }}
                  className="px-4 py-2 bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-dark-500 transition">
                  Plus tard
                </button>
              )}
            </div>

            {/* Version info */}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Version actuelle : {window.electronAPI?.getVersion ? 'desktop' : 'web'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
