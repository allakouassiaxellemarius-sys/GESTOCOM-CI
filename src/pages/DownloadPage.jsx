import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Monitor, Smartphone, Download, CheckCircle, ArrowLeft, Shield, Zap, HardDrive, Wifi, Star, ChevronRight } from 'lucide-react'

const VERSION = '1.3.0'

function getOS() {
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'windows'
  if (ua.includes('Mac')) return 'mac'
  if (ua.includes('Linux')) return 'linux'
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad/i.test(ua)) return 'ios'
  return 'unknown'
}

const desktopDownloads = [
  {
    os: 'windows',
    label: 'Windows',
    icon: '🪟',
    requirements: 'Windows 10/11 (64-bit)',
    files: [
      { name: `GESTOCOM-CI-${VERSION}-Setup.exe`, size: '~86 Mo', type: 'installateur', primary: true, url: 'https://gofile.io/d/FblaTX' },
      { name: `GESTOCOM-CI-${VERSION}-Portable.zip`, size: '~122 Mo', type: 'portable (sans installation)', url: 'https://gofile.io/d/ULRM31' },
    ],
  },
  {
    os: 'mac',
    label: 'macOS',
    icon: '🍎',
    requirements: 'macOS 11+ (Intel & Apple Silicon)',
    files: [
      { name: `GESTOCOM-CI-${VERSION}-x64.dmg`, size: '~110 Mo', type: 'dmg (Intel)', url: null },
      { name: `GESTOCOM-CI-${VERSION}-arm64.dmg`, size: '~105 Mo', type: 'dmg (Apple Silicon)', url: null },
    ],
  },
  {
    os: 'linux',
    label: 'Linux',
    icon: '🐧',
    requirements: 'Ubuntu 20+, Debian 11+, Fedora 35+',
    files: [
      { name: `GESTOCOM-CI-${VERSION}-x64.AppImage`, size: '~115 Mo', type: 'AppImage (universel)', url: null },
      { name: `GESTOCOM-CI-${VERSION}-x64.deb`, size: '~95 Mo', type: '.deb (Debian/Ubuntu)', url: null },
    ],
  },
]

const mobileSteps = [
  { step: 1, title: 'Ouvrez le navigateur', desc: 'Sur votre téléphone, ouvrez Chrome (Android) ou Safari (iPhone)', icon: Smartphone },
  { step: 2, title: 'Accédez à l\'application', desc: 'Connectez-vous à GESTOCOM CI depuis votre navigateur', icon: Wifi },
  { step: 3, title: 'Installez l\'application', desc: 'Appuyez sur "Ajouter à l\'écran d\'accueil" dans le menu du navigateur', icon: Download },
]

const features = [
  { icon: Zap, title: 'Ultra rapide', desc: 'Application légère, démarrage instantané' },
  { icon: Shield, title: 'Sécurisée', desc: 'Chiffrement AES-256, authentification 2FA' },
  { icon: HardDrive, title: 'Fonctionne hors ligne', desc: 'Continuez à travailler même sans internet' },
  { icon: Star, title: 'Rapports intégrés', desc: 'Tableaux de bord, alertes automatiques, exports PDF' },
]

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState('unknown')
  const [mobileInstalled, setMobileInstalled] = useState(false)

  useEffect(() => {
    setDetectedOS(getOS())
    if ('ontouchstart' in window && window.matchMedia('(display-mode: standalone)').matches) {
      setMobileInstalled(true)
    }
  }, [])

  const isMobile = /android|iphone|ipad/i.test(navigator.userAgent)
  const os = detectedOS

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-dark-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Retour au site</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">G</div>
            <span className="font-bold text-gray-800 dark:text-white">GESTOCOM CI</span>
          </div>
          <Link to="/login" className="btn-primary text-sm py-2 px-4">Connexion</Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full text-sm font-medium mb-6">
          <Download className="w-4 h-4" /> Version {VERSION}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
          Télécharger <span className="text-brand-600 dark:text-brand-400">GESTOCOM CI</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Disponible sur ordinateur et mobile. Installez l'application et gérez votre commerce en toute simplicité.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
              <f.icon className="w-3.5 h-3.5 text-brand-500" />
              {f.title}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Downloads */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ordinateur</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Application de bureau complète</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {desktopDownloads.map((dl) => {
            const isDetected = dl.os === os
            return (
              <div key={dl.os} className={`bg-white dark:bg-dark-800 rounded-2xl border-2 p-5 transition-all ${
                isDetected
                  ? 'border-brand-400 dark:border-brand-500 shadow-lg shadow-brand-500/10'
                  : 'border-gray-100 dark:border-dark-700 hover:border-gray-200 dark:hover:border-dark-600'
              }`}>
                {isDetected && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold rounded-full mb-3">
                    <CheckCircle className="w-3 h-3" /> Recommandé
                  </div>
                )}
                <div className="text-3xl mb-2">{dl.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{dl.label}</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{dl.requirements}</p>
                <div className="space-y-2">
                  {dl.files.map((file, fi) => (
                    <div key={fi} className={`flex items-center justify-between p-3 rounded-xl ${
                      file.primary
                        ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
                        : 'bg-gray-50 dark:bg-dark-700'
                    }`}>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500">{file.type} · {file.size}</div>
                      </div>
                      {file.url ? (
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="ml-2 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors flex items-center gap-1">
                          <Download className="w-3 h-3" /> Télécharger
                        </a>
                      ) : (
                        <button disabled className="ml-2 px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-gray-200 dark:bg-dark-600 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                          Bientôt
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Install */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mobile</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Installez l'application sur votre téléphone</p>
          </div>
        </div>

        {mobileInstalled ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300 mb-1">Application déjà installée !</h3>
            <p className="text-sm text-green-600 dark:text-green-400">GESTOCOM CI est installé sur cet appareil.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              GESTOCOM CI est une <strong className="text-gray-700 dark:text-gray-200">application web progressive (PWA)</strong>. Installez-la directement depuis votre navigateur :
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {mobileSteps.map((step) => (
                <div key={step.step} className="flex gap-3 p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                  <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{step.step}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-0.5">{step.title}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform-specific instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                  🤖 Android (Chrome)
                </h4>
                <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                  <li>Ouvrez Chrome et allez sur l'application</li>
                  <li>Appuyez sur les 3 points (⋮) en haut à droite</li>
                  <li>Sélectionnez <strong>"Installer l'application"</strong></li>
                  <li>Confirmez l'installation</li>
                </ol>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl border border-gray-200 dark:border-dark-600">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  🍎 iPhone (Safari)
                </h4>
                <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Ouvrez Safari et allez sur l'application</li>
                  <li>Appuyez sur l'icône de partage (⬆) en bas</li>
                  <li>Sélectionnez <strong>"Ajouter à l'écran d'accueil"</strong></li>
                  <li>Confirmez en appuyant sur "Ajouter"</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimum Requirements */}
      <div className="max-w-5xl mx-auto px-4 mb-16">
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Configuration minimale</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400 dark:text-gray-500 text-xs mb-1">Système</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Windows 10+ / macOS 11+ / Linux</div>
            </div>
            <div>
              <div className="text-gray-400 dark:text-gray-500 text-xs mb-1">RAM</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">4 Go minimum</div>
            </div>
            <div>
              <div className="text-gray-400 dark:text-gray-500 text-xs mb-1">Espace disque</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">200 Mo</div>
            </div>
            <div>
              <div className="text-gray-400 dark:text-gray-500 text-xs mb-1">Internet</div>
              <div className="font-medium text-gray-700 dark:text-gray-300">Optionnel (hors ligne)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-dark-700 bg-white/50 dark:bg-dark-800/50">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">G</div>
            <span className="font-bold text-gray-800 dark:text-white">GESTOCOM CI</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Logiciel de gestion commerciale pour PME ivoiriennes</p>
          <p className="text-xs text-gray-300 dark:text-gray-600">Version {VERSION} — © {new Date().getFullYear()} Tous droits réservés</p>
        </div>
      </div>
    </div>
  )
}
