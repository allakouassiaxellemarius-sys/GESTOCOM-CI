import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inscrire, validatePassword, getCompanySettings, saveCompanySettings, addLog, setCurrentAdminId } from '../lib/db'
import { isFirebaseReady } from '../lib/firebase'
import { pushToFirestore } from '../lib/firebaseSync'
import { normalizePhone, isPhoneValid, formatPhoneDisplay } from '../lib/phone'
import { useAuth } from '../context/AuthContext'
import { SECTORS, MODULE_LABELS } from '../lib/modules'
import { ShoppingCart, Landmark, Factory, Truck, Heart, GraduationCap, HandHeart, Check, Eye, EyeOff, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react'

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

export default function InscriptionPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', motDePasse: '', confirmation: '', role: 'vendeur' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enabledSectors, setEnabledSectors] = useState(['commerce'])
  const [showModules, setShowModules] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const update = (key, val) => setForm({ ...form, [key]: val })

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

      // Set admin context to new user's ID so settings are saved under correct scope
      if (result.user?.id) {
        setCurrentAdminId(result.user.id)
      }

      const settings = getCompanySettings()
      saveCompanySettings({ ...settings, enabledSectors, modulesConfigured: true })
      addLog('Modules configurés', enabledSectors.join(', '))

      // Push to cloud after registration
      if (isFirebaseReady() && result.user?.id) {
        const email = form.email.trim() || form.nom.trim()
        pushToFirestore(email, result.user.id).catch(() => {})
      }

      setSuccess(true)
      setTimeout(async () => {
        try {
          const loginResult = await login(form.nom.trim(), form.motDePasse)
          if (loginResult === true) {
            navigate('/app')
          } else {
            setSuccess(false)
            setError('Compte créé mais connexion échouée. Veuillez vous connecter manuellement.')
          }
        } catch {
          setSuccess(false)
          setError('Compte créé mais connexion échouée. Veuillez vous connecter manuellement.')
        }
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="h-screen bg-gradient-to-br from-brand-50 via-white to-gold-50 dark:from-brand-900/20 dark:via-dark-800 dark:to-gold-900/20 flex items-center justify-center p-4 overflow-hidden">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-dark-700 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2 dark:text-white">Compte créé !</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Connexion en cours...</p>
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
          {step === 1 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choisir vos modules</p>}
          {step === 2 && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Créer votre compte</p>}
        </div>

        {step === 1 && (
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-dark-700">
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
                        {enabled && (
                          <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
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
                className="flex-1 btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant ({enabledSectors.length} secteur{enabledSectors.length > 1 ? 's' : ''})
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-5 border border-gray-100 dark:border-dark-700">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-2.5 rounded-lg mb-4">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom d'utilisateur *</label>
                <input type="text" value={form.nom} onChange={e => update('nom', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                  placeholder="Ex: moussa" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                  placeholder="moussa@email.com" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-green-600 dark:text-green-400">+225</span>
                  <input type="tel" value={form.telephone} onChange={e => update('telephone', e.target.value)}
                    className="w-full pl-14 pr-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                    placeholder="XX XX XX XX XX" required />
                </div>
                {form.telephone && !isPhoneValid(form.telephone) && (
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">Numéro invalide (10 chiffres requis)</p>
                )}
                {form.telephone && isPhoneValid(form.telephone) && (
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
                  <input type={showPw ? 'text' : 'password'} value={form.motDePasse} onChange={e => update('motDePasse', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none pr-10 bg-white dark:bg-dark-700 dark:text-white"
                    placeholder="8+ car., 1 majuscule, 1 chiffre" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.motDePasse && (
                  <div className="mt-1 space-y-0">
                    {[
                      [form.motDePasse.length >= 8, '8 caractères minimum'],
                      [/[A-Z]/.test(form.motDePasse), '1 majuscule'],
                      [/[0-9]/.test(form.motDePasse), '1 chiffre'],
                    ].map(([ok, label]) => (
                      <div key={label} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-green-600' : 'text-red-400'}`}>
                        {ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer le mot de passe *</label>
                <input type="password" value={form.confirmation} onChange={e => update('confirmation', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-dark-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white dark:bg-dark-700 dark:text-white"
                  placeholder="Retapez le mot de passe" required />
                {form.confirmation && form.motDePasse !== form.confirmation && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
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
              <button type="submit" className="flex-1 btn-primary py-2.5 disabled:opacity-50" disabled={loading}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </div>

            <div className="mt-2 text-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Déjà un compte ? </span>
              <Link to="/login" className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">Se connecter</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
