const { app, BrowserWindow, ipcMain, shell, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const http = require('http')
const sms = require('./sms')
const email = require('./email')

const { join } = path
const { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, statSync } = fs

function logToFile(msg) {
  const line = '[' + new Date().toISOString() + '] ' + msg + '\n'
  try { appendFileSync('C:\\Users\\allak\\debug-gestocom.log', line) } catch(e) {}
}

logToFile('MODULE LOADING...')

const isDev = !app.isPackaged

let settingsPath = ''
function getSettingsPath() {
  if (!settingsPath) settingsPath = join(app.getPath('userData'), 'gestocom-settings.json')
  return settingsPath
}
function loadSettings() {
  try { return JSON.parse(readFileSync(getSettingsPath(), 'utf-8')) } catch { return {} }
}
function saveSettings(data) {
  try { writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2)) } catch {}
}

let mainWindow
let splashWindow
let splashReady = null
let server
let forceQuit = false

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

if (process.platform === 'win32') {
  app.setAppUserModelId('com.gestocom.ci')
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
}

app.commandLine.appendSwitch('force-device-scale-factor', '1')

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', function () {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ═══════════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════════

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 520,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1a1a2e 50%, #0f172a 100%);
    height: 100vh; display: flex; align-items: center; justify-content: center;
    overflow: hidden; user-select: none;
  }
  .container {
    text-align: center; width: 100%; padding: 40px;
  }
  .logo-wrap {
    width: 90px; height: 90px; margin: 0 auto 20px;
    background: linear-gradient(135deg, #FF8C00, #FF6B00);
    border-radius: 22px; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(255,140,0,0.35);
    animation: pulse-logo 2s ease-in-out infinite;
  }
  .logo-bars { display: flex; align-items: flex-end; gap: 4px; height: 40px; }
  .bar1 { width: 8px; height: 16px; background: #2E8B57; border-radius: 2px; }
  .bar2 { width: 8px; height: 28px; background: #FFB347; border-radius: 2px; }
  .bar3 { width: 8px; height: 40px; background: #2E8B57; border-radius: 2px; }
  @keyframes pulse-logo {
    0%, 100% { transform: scale(1); box-shadow: 0 8px 32px rgba(255,140,0,0.35); }
    50% { transform: scale(1.05); box-shadow: 0 12px 40px rgba(255,140,0,0.5); }
  }
  h1 {
    color: white; font-size: 26px; font-weight: 700; margin-bottom: 2px;
    opacity: 0; animation: fadeUp 0.8s 0.3s forwards;
  }
  h1 span { color: #FF8C00; }
  .subtitle {
    color: #94a3b8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px;
    opacity: 0; animation: fadeUp 0.8s 0.5s forwards;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .progress-area {
    opacity: 0; animation: fadeUp 0.8s 0.7s forwards;
  }
  .progress-bar-bg {
    width: 100%; height: 4px; background: #334155; border-radius: 4px;
    overflow: hidden; margin-bottom: 12px;
  }
  .progress-bar {
    height: 100%; width: 0%; background: linear-gradient(90deg, #FF8C00, #2E8B57);
    border-radius: 4px; transition: width 0.4s ease;
  }
  .status-text {
    color: #64748b; font-size: 12px; min-height: 18px;
    transition: all 0.3s ease;
  }
  .status-text.update { color: #22c55e; }
  .version-badge {
    display: inline-block; margin-top: 20px; padding: 4px 12px;
    background: rgba(255,140,0,0.12); border: 1px solid rgba(255,140,0,0.25);
    border-radius: 20px; color: #FF8C00; font-size: 11px; font-weight: 500;
    opacity: 0; animation: fadeUp 0.8s 0.9s forwards;
  }
  .changelog {
    margin-top: 16px; padding: 10px 14px; background: rgba(46,139,87,0.1);
    border: 1px solid rgba(46,139,87,0.25); border-radius: 10px;
    color: #86efac; font-size: 11px; line-height: 1.5; text-align: left;
    max-height: 60px; overflow: hidden;
    opacity: 0; transition: all 0.5s ease;
  }
  .changelog.show { opacity: 1; }
  .steps {
    display: flex; gap: 6px; justify-content: center; margin-top: 16px;
    opacity: 0; animation: fadeUp 0.8s 1.1s forwards;
  }
  .step {
    width: 8px; height: 8px; border-radius: 50%; background: #334155;
    transition: all 0.4s ease;
  }
  .step.active { background: #FF8C00; box-shadow: 0 0 8px rgba(255,140,0,0.6); }
  .step.done { background: #2E8B57; }
</style></head>
<body>
  <div class="container">
    <div class="logo-wrap">
      <div class="logo-bars">
        <div class="bar1"></div>
        <div class="bar2"></div>
        <div class="bar3"></div>
      </div>
    </div>
    <h1>GESTOCOM <span>CI</span></h1>
    <p class="subtitle">Gestion Commerciale Professionnelle</p>
    <div class="progress-area">
      <div class="progress-bar-bg"><div class="progress-bar" id="bar"></div></div>
      <p class="status-text" id="status">Chargement...</p>
    </div>
    <div class="version-badge" id="version">v${app.getVersion()}</div>
    <div class="changelog" id="changelog"></div>
    <div class="steps">
      <div class="step" id="step1"></div>
      <div class="step" id="step2"></div>
      <div class="step" id="step3"></div>
    </div>
  </div>
</body>
</html>`

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  splashReady = new Promise(function(resolve) {
    var done = false
    splashWindow.webContents.once('did-finish-load', function() {
      if (!done) { done = true; resolve() }
    })
    setTimeout(function() { if (!done) { done = true; resolve() } }, 2000)
  })
  splashWindow.on('closed', function() { splashWindow = null; splashReady = null })
}

function sendSplash(data) {
  if (!splashWindow || !splashWindow.webContents) return
  try {
    var js = '(function(){'
    if (data.percent !== undefined) {
      js += 'var b=document.getElementById("bar");if(b)b.style.width="' + data.percent + '%";'
    }
    if (data.status) {
      js += 'var s=document.getElementById("status");if(s){s.textContent=' + JSON.stringify(data.status) + ';s.className="status-text"' + (data.isUpdate ? '+(" update")' : '') + ';}'
    }
    if (data.version) {
      js += 'var v=document.getElementById("version");if(v)v.textContent="v' + data.version + '";'
    }
    if (data.changelog) {
      js += 'var cl=document.getElementById("changelog");if(cl){cl.textContent=' + JSON.stringify(data.changelog) + ';cl.classList.add("show");}'
    }
    if (data.step !== undefined) {
      for (var i = 1; i <= 3; i++) {
        if (i < data.step) js += 'var s' + i + '=document.getElementById("step' + i + '");if(s' + i + ')s' + i + '.className="step done";'
        else if (i === data.step) js += 'var s' + i + '=document.getElementById("step' + i + '");if(s' + i + ')s' + i + '.className="step active";'
      }
    }
    if (data.done) {
      js += 'var b=document.getElementById("bar");if(b)b.style.width="100%";'
    }
    js += '})()'
    splashWindow.webContents.executeJavaScript(js).catch(function() {})
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════
// LOCAL SERVER
// ═══════════════════════════════════════════════════════

function startLocalServer() {
  return new Promise(function(resolve, reject) {
    var distDir = join(__dirname, '..', 'dist')
    server = http.createServer(function(req, res) {
      var url = req.url.split('?')[0].split('#')[0]
      if (url === '/') url = '/index.html'
      var filePath = join(distDir, url)
      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        filePath = join(distDir, 'index.html')
      }
      var data = readFileSync(filePath)
      var ext = path.extname(filePath).toLowerCase()
      var mime = MIME[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': mime })
      res.end(data)
    })
    server.listen(0, '127.0.0.1', function() {
      var port = server.address().port
      logToFile('Local server started on port ' + port)
      resolve(port)
    })
    server.on('error', function(err) {
      logToFile('Server error: ' + err.message)
      reject(err)
    })
  })
}

// ═══════════════════════════════════════════════════════
// MAIN WINDOW
// ═══════════════════════════════════════════════════════

function createWindow(port) {
  logToFile('Creating window...')
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'GESTOCOM CI',
    icon: join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#1a73e8',
    show: false,
    autoHideMenuBar: process.platform === 'win32',
    frame: true,
    thickFrame: process.platform === 'win32',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    var url = 'http://127.0.0.1:' + port + '/'
    logToFile('Loading: ' + url)
    mainWindow.loadURL(url)
  }

  mainWindow.webContents.on('did-finish-load', function() { logToFile('did-finish-load') })
  mainWindow.webContents.on('did-fail-load', function(_, code, desc) { logToFile('did-fail-load: ' + code + ' ' + desc) })
  mainWindow.webContents.on('console-message', function(_, level, msg, line, sourceId) {
    logToFile('CONSOLE[' + level + ']: ' + msg + ' (' + sourceId + ':' + line + ')')
  })

  mainWindow.once('ready-to-show', function() {
    // Close splash, show main window
    if (splashWindow) {
      splashWindow.close()
      splashWindow = null
    }
    mainWindow.show()
  })

  mainWindow.on('close', function(e) {
    if (forceQuit) return
    var settings = loadSettings()
    if (settings.minimizeToTray && process.platform === 'win32') {
      e.preventDefault()
      mainWindow.minimize()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(function(obj) {
    shell.openExternal(obj.url)
    return { action: 'deny' }
  })
}

// ═══════════════════════════════════════════════════════
// APP STARTUP
// ═══════════════════════════════════════════════════════

app.whenReady().then(function() {
  logToFile('app.whenReady')

  // Initialize SQLite database
  try {
    var database = require('./database')
    global.db = database
    database.initDatabase(app)
    logToFile('SQLite database initialized')
  } catch (err) {
    logToFile('Database init error: ' + err.message)
  }

  // Auto-configure SMS/Email from saved settings
  try {
    var settings = loadSettings()
    if (settings.twilio) sms.configureTwilio(settings.twilio.accountSid, settings.twilio.authToken, settings.twilio.phoneNumber)
    if (settings.smtp) email.configureSMTP(settings.smtp.host, settings.smtp.port, settings.smtp.user, settings.smtp.pass)
  } catch (err) {
    logToFile('SMS/Email config error: ' + err.message)
  }

  if (process.platform === 'win32') {
    app.setAboutPanelOptions({
      applicationName: 'GESTOCOM CI',
      applicationVersion: app.getVersion(),
      copyright: '\u00a9 2026 LES RETROUVAILLES CEZ LUICI',
      authors: ['LES RETROUVAILLES CEZ LUICI'],
      website: 'https://gestocom.ci',
    })
  }

  // Show splash screen first
  if (!isDev) {
    createSplash()
  }

  startLocalServer().then(async function(port) {
    // Check for updates while splash is showing
    if (!isDev) {
      try {
        if (splashReady) await splashReady
        sendSplash({ percent: 10, status: 'Vérification des mises à jour...', step: 1 })

        const { checkForUpdates, applyUpdate } = require('./updater')
        const update = await checkForUpdates({
          webContents: { send: function(channel, data) {
            if (channel === 'update-progress') {
              sendSplash({
                percent: 40 + Math.round(data.percent * 0.5),
                status: data.status,
                isUpdate: true,
                step: 2
              })
            }
          }}
        })

        if (update && update.shouldUpdate && update.zipUrl) {
          logToFile('Auto-applying update: ' + update.version)
          sendSplash({ percent: 35, status: 'Mise a jour v' + update.version + '...', isUpdate: true, version: update.version, step: 2, changelog: update.changelog || '' })
          forceQuit = true

          await applyUpdate({
            webContents: { send: function(channel, data) {
              if (channel === 'update-progress') {
                sendSplash({
                  percent: 40 + Math.round(data.percent * 0.5),
                  status: data.status,
                  isUpdate: true,
                  step: 2
                })
              }
            }}
          }, update.zipUrl)

          // App will quit and restart via update script
          return
        }

        sendSplash({ percent: 80, status: 'Chargement de l\'application...', step: 3 })
      } catch (err) {
        logToFile('Update check failed: ' + err.message)
        sendSplash({ percent: 80, status: 'Chargement de l\'application...', step: 3 })
      }
    }

    createWindow(port)
  }).catch(function(err) {
    logToFile('Failed to start server: ' + err.message)
    if (splashWindow) splashWindow.close()
  })

  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', function() {
  if (server) { try { server.close() } catch(e) {} }
  if (global.db) { try { global.db.closeDatabase() } catch(e) {} }
})

// ═══════════════════════════════════════════════════════
// APP IPC
// ═══════════════════════════════════════════════════════

ipcMain.handle('get-app-version', function() { return app.getVersion() })
ipcMain.handle('get-app-path', function() { return app.getPath('userData') })
ipcMain.handle('get-platform', function() { return process.platform })

ipcMain.handle('store:get', function(_, key) {
  var s = loadSettings()
  return key ? s[key] : s
})
ipcMain.handle('store:set', function(_, key, value) {
  var s = loadSettings()
  s[key] = value
  saveSettings(s)
})
ipcMain.handle('store:delete', function(_, key) {
  var s = loadSettings()
  delete s[key]
  saveSettings(s)
})

ipcMain.handle('minimize-window', function() { if (mainWindow) mainWindow.minimize() })
ipcMain.handle('maximize-window', function() {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  }
})
ipcMain.handle('close-window', function() { if (mainWindow) mainWindow.close() })
ipcMain.handle('toggle-tray', function(_, minimizeToTray) {
  var s = loadSettings()
  s.minimizeToTray = minimizeToTray
  saveSettings(s)
})

ipcMain.handle('open-external', function(_, url) { shell.openExternal(url) })
ipcMain.handle('get-user-data-path', function() {
  var p = join(app.getPath('userData'), 'data')
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
  return p
})

ipcMain.handle('app:reload', function() {
  if (mainWindow) {
    mainWindow.webContents.reload()
    return true
  }
  return false
})

// ═══════════════════════════════════════════════════════
// UPDATE IPC
// ═══════════════════════════════════════════════════════

const { fetchJSON, compareVersions, applyUpdate } = require('./updater')

ipcMain.handle('check-update', async function() {
  var currentVersion = app.getVersion()
  logToFile('IPC check-update, current: ' + currentVersion)
  try {
    var info = await fetchJSON('https://landing-page-kohl-eta-57.vercel.app/version.json')
    var hasUpdate = compareVersions(info.version, currentVersion) > 0
    return { hasUpdate, version: info.version, changelog: info.changelog || '', zipUrl: info.zipUrl || info.url || '' }
  } catch (err) {
    logToFile('check-update error: ' + err.message)
    return { hasUpdate: false, error: err.message }
  }
})

ipcMain.handle('download-update', async function(_, zipUrl) {
  logToFile('IPC download-update (ZIP): ' + zipUrl)
  forceQuit = true
  return await applyUpdate(mainWindow, zipUrl)
})

// ═══════════════════════════════════════════════════════
// OTP IPC
// ═══════════════════════════════════════════════════════

ipcMain.handle('otp:send', async function(_, userId, channel) {
  try {
    var mod = db()
    var code = mod.generateOTPCode(userId, channel)
    if (channel === 'email') {
      var userEmail = mod.getUserEmail(userId)
      if (!userEmail) return { success: false, error: 'Aucun email configuré' }
      var result = await email.sendEmail(userEmail, code)
      if (!result.success && sms.isConfigured()) {
        var userPhone = mod.getUserPhone(userId)
        if (userPhone) {
          result = await sms.sendSMS(userPhone, code)
          if (result.success) return { success: true, channel: 'sms' }
        }
      }
      return result
    } else {
      var userPhone = mod.getUserPhone(userId)
      if (!userPhone) return { success: false, error: 'Aucun numéro de téléphone configuré' }
      var result = await sms.sendSMS(userPhone, code)
      if (!result.success && email.isConfigured()) {
        var userEmail = mod.getUserEmail(userId)
        if (userEmail) {
          result = await email.sendEmail(userEmail, code)
          if (result.success) return { success: true, channel: 'email' }
        }
      }
      return result
    }
  } catch (e) {
    logToFile('otp:send error: ' + e.message)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('otp:verify', function(_, userId, code) {
  try {
    var mod = db()
    return mod.verifyOTPCode(userId, code)
  } catch (e) {
    logToFile('otp:verify error: ' + e.message)
    return { valid: false, error: e.message }
  }
})

ipcMain.handle('otp:get-channel', function(_, userId) {
  try {
    var mod = db()
    var phone = mod.getUserPhone(userId)
    var emailAddr = mod.getUserEmail(userId)
    if (phone && sms.isConfigured()) return 'sms'
    if (emailAddr && email.isConfigured()) return 'email'
    return null
  } catch (e) { return null }
})

ipcMain.handle('twilio:config', function(_, config) {
  try {
    var s = loadSettings()
    s.twilio = config
    saveSettings(s)
    var ok = sms.configureTwilio(config.accountSid, config.authToken, config.phoneNumber)
    return { success: ok }
  } catch (e) {
    logToFile('twilio:config error: ' + e.message)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('twilio:test', async function(_, phone) {
  try {
    if (!sms.isConfigured()) return { success: false, error: 'Twilio non configuré' }
    return await sms.sendSMS(phone, '123456')
  } catch (e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('smtp:config', function(_, config) {
  try {
    var s = loadSettings()
    s.smtp = config
    saveSettings(s)
    var ok = email.configureSMTP(config.host, config.port, config.user, config.pass)
    return { success: ok }
  } catch (e) {
    logToFile('smtp:config error: ' + e.message)
    return { success: false, error: e.message }
  }
})

ipcMain.handle('smtp:test', async function(_, to) {
  try {
    if (!email.isConfigured()) return { success: false, error: 'SMTP non configuré' }
    return await email.sendEmail(to, '123456')
  } catch (e) {
    return { success: false, error: e.message }
  }
})

// ═══════════════════════════════════════════════════════
// DATABASE IPC
// ═══════════════════════════════════════════════════════

function db() { return global.db }

// ── Generic synchronous DB dispatcher ──
ipcMain.on('db:sync', function(event, method) {
  var mod = db()
  if (!mod || typeof mod[method] !== 'function') { logToFile('db:sync null: method=' + method + ' mod=' + !!mod); event.returnValue = null; return }
  var args = Array.prototype.slice.call(arguments, 2)
  try {
    var result = mod[method].apply(mod, args)
    if (method === 'createUser') logToFile('db:sync createUser result: ' + JSON.stringify(result))
    event.returnValue = result
  } catch (e) {
    console.error('DB sync error:', method, e)
    logToFile('db:sync error: ' + method + ' -> ' + e.message)
    event.returnValue = { __error: true, message: e.message }
  }
})
