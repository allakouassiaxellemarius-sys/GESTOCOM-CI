import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authentifier as dbAuth, changerMotDePasse as dbChangePw, addLog, ensureDefaultAdmin, setCurrentAdminId } from '../lib/db'
import { is2FAEnabled, verify2FACode } from '../lib/tfa'
import { envoyerEmailOTP, envoyerSMSOTP, verifierOTP as verifyOTPLib, getOTPChannel as getOTPChannelLib, isOTPEnabled, renvoyerOTP } from '../lib/verification'
import { isFirebaseReady } from '../lib/firebase'
import { pullFromFirestore, restoreDataFromCloud, pushToFirestore } from '../lib/firebaseSync'

const AuthContext = createContext(null)
const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

function initAdminContext(savedUser) {
  if (savedUser && savedUser.adminId) {
    setCurrentAdminId(savedUser.adminId)
  } else if (savedUser && savedUser.role === 'admin') {
    setCurrentAdminId(savedUser.id)
  }
}

async function autoSyncFromCloud(userObj) {
  if (!isFirebaseReady()) return
  const email = userObj.email || userObj.nom
  if (!email) return
  try {
    const cloudData = await pullFromFirestore(email)
    if (cloudData && cloudData.data) {
      restoreDataFromCloud(cloudData)
      console.log('[Sync] Données restaurées depuis le cloud')
    }
  } catch (e) {
    console.warn('[Sync] Erreur pull cloud:', e)
  }
}

async function autoSyncToCloud(userObj) {
  if (!isFirebaseReady()) return
  const email = userObj.email || userObj.nom
  if (!email || !userObj.adminId) return
  try {
    await pushToFirestore(email, userObj.adminId)
    console.log('[Sync] Données poussées vers le cloud')
  } catch (e) {
    console.warn('[Sync] Erreur push cloud:', e)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [pending2FA, setPending2FA] = useState(null)
  const [pendingOTP, setPendingOTP] = useState(null) // { id, nom, role, channel }
  const [otpChannel, setOtpChannel] = useState(null) // 'sms' | 'email'

  useEffect(() => {
    ensureDefaultAdmin()
    try {
      const saved = JSON.parse(sessionStorage.getItem('gestocom_session') || 'null')
      if (saved && saved.id && saved.nom && saved.role) {
        setUser(saved)
        initAdminContext(saved)
      }
      else sessionStorage.removeItem('gestocom_session')
    } catch {}
  }, [])

  const resetActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  useEffect(() => {
    if (!user) return

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach(e => document.addEventListener(e, resetActivity))

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > TIMEOUT_MS) {
        addLog('Session expirée', 'Timeout 30 min', user.id, user.nom)
        setUser(null)
        sessionStorage.removeItem('gestocom_session')
      }
    }, 60000)

    // Auto-sync to cloud every 5 minutes
    const syncInterval = setInterval(() => {
      autoSyncToCloud(user)
    }, 5 * 60 * 1000)

    return () => {
      events.forEach(e => document.removeEventListener(e, resetActivity))
      clearInterval(interval)
      clearInterval(syncInterval)
    }
  }, [user, lastActivity, resetActivity])

  const login = async (nom, motDePasse) => {
    const result = await dbAuth(nom, motDePasse)
    if (result?.error === 'locked') return { error: 'locked' }
    if (result?.error) return { error: result.error }
    if (result && result.id) {
      if (is2FAEnabled(result.id)) {
        setPending2FA(result)
        return { require2FA: true }
      }

      // Vérifier si OTP est activé pour cet utilisateur
      if (isOTPEnabled(result.id)) {
        const channel = getOTPChannelLib(result.id)
        let sendResult
        if (channel === 'email' && result.email) {
          sendResult = await envoyerEmailOTP(result.id, result.email)
        } else if (result.telephone) {
          sendResult = await envoyerSMSOTP(result.id, result.telephone)
        }
        
        if (sendResult?.success) {
          setPendingOTP({ ...result, channel })
          setOtpChannel(channel)
          return { requireOTP: true, channel }
        }
      }

      setUser(result)
      setCurrentAdminId(result.adminId)
      sessionStorage.setItem('gestocom_session', JSON.stringify(result))
      setLastActivity(Date.now())
      autoSyncFromCloud(result)
      autoSyncToCloud(result)
      return true
    }
    return false
  }

  const verify2FA = async (code) => {
    if (!pending2FA) return false
    const ok = await verify2FACode(pending2FA.id, code)
    if (ok) {
      // Vérifier si OTP est activé après 2FA
      if (isOTPEnabled(pending2FA.id)) {
        const channel = getOTPChannelLib(pending2FA.id)
        let sendResult
        if (channel === 'email' && pending2FA.email) {
          sendResult = await envoyerEmailOTP(pending2FA.id, pending2FA.email)
        } else if (pending2FA.telephone) {
          sendResult = await envoyerSMSOTP(pending2FA.id, pending2FA.telephone)
        }
        
        if (sendResult?.success) {
          setPendingOTP({ ...pending2FA, channel })
          setOtpChannel(channel)
          setPending2FA(null)
          return { requireOTP: true, channel }
        }
      }
      setUser(pending2FA)
      setCurrentAdminId(pending2FA.adminId)
      sessionStorage.setItem('gestocom_session', JSON.stringify(pending2FA))
      setLastActivity(Date.now())
      setPending2FA(null)
      addLog('Connexion 2FA réussie', '', pending2FA.id, pending2FA.nom)
      autoSyncFromCloud(pending2FA)
      return true
    }
    addLog('Échec 2FA', '', pending2FA.id, pending2FA.nom)
    return false
  }

  const verifyOTP = async (code) => {
    if (!pendingOTP) return false
    const type = pendingOTP.channel === 'email' ? 'email' : 'phone'
    const result = verifyOTPLib(pendingOTP.id, type, code)
    if (result?.valid) {
      setUser(pendingOTP)
      setCurrentAdminId(pendingOTP.adminId)
      sessionStorage.setItem('gestocom_session', JSON.stringify(pendingOTP))
      setLastActivity(Date.now())
      setPendingOTP(null)
      setOtpChannel(null)
      addLog('Connexion OTP réussie', '', pendingOTP.id, pendingOTP.nom)
      autoSyncFromCloud(pendingOTP)
      return true
    }
    addLog('Échec OTP', result?.error || '', pendingOTP.id, pendingOTP.nom)
    return false
  }

  const resendOTP = async () => {
    if (!pendingOTP) return false
    const channel = otpChannel || 'email'
    let destination
    if (channel === 'email') {
      destination = pendingOTP.email
    } else {
      destination = pendingOTP.telephone
    }
    if (!destination) return false
    const sendResult = await renvoyerOTP(pendingOTP.id, channel, destination)
    return sendResult?.success || false
  }

  const cancel2FA = () => {
    setPending2FA(null)
  }

  const cancelOTP = () => {
    setPendingOTP(null)
    setOtpChannel(null)
  }

  const logout = () => {
    if (user) addLog('Déconnexion', '', user.id, user.nom)
    setUser(null)
    setPending2FA(null)
    setPendingOTP(null)
    setOtpChannel(null)
    setCurrentAdminId(null)
    sessionStorage.removeItem('gestocom_session')
  }

  const changerMdp = async (ancien, nouveau) => {
    if (!user) return false
    return await dbChangePw(user.id, ancien, nouveau)
  }

  const aAcces = (action) => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (user.role === 'comptable') return ['voir', 'rapport', 'depenses'].includes(action)
    if (user.role === 'vendeur') return ['voir', 'vente', 'stock_voir'].includes(action)
    return false
  }

  const isOwner = user?.role === 'admin'
  const isSubUser = user?.role === 'vendeur' || user?.role === 'comptable'

  return (
    <AuthContext.Provider value={{ user, login, logout, changerMdp, aAcces, isOwner, isSubUser, pending2FA, verify2FA, cancel2FA, pendingOTP, verifyOTP: verifyOTP, resendOTP, cancelOTP, otpChannel }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
