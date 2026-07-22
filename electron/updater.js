const { app } = require('electron')
const https = require('https')
const http = require('http')
const { createWriteStream, existsSync, mkdirSync, unlinkSync, writeFileSync, readFileSync } = require('fs')
const { join } = require('path')
const { spawn } = require('child_process')

const UPDATE_SERVER = 'https://landing-page-kohl-eta-57.vercel.app'
const VERSION_URL = UPDATE_SERVER + '/version.json'

let isUpdating = false

function log(msg) {
  try {
    const { appendFileSync } = require('fs')
    appendFileSync('C:\\Users\\allak\\debug-gestocom.log', '[UPDATE] ' + new Date().toISOString() + ' ' + msg + '\n')
  } catch(e) {}
}

function fetchJSON(url) {
  return new Promise(function(resolve, reject) {
    var client = url.startsWith('https') ? https : http
    var options = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } }
    var req = client.get(url, options, function(res) {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchJSON(res.headers.location).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode))
        return
      }
      var data = ''
      res.on('data', function(chunk) { data += chunk })
      res.on('end', function() {
        try { resolve(JSON.parse(data)) }
        catch(e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.setTimeout(15000, function() { req.destroy(); reject(new Error('Timeout')) })
  })
}

function downloadFile(url, dest, onProgress) {
  return new Promise(function(resolve, reject) {
    var client = url.startsWith('https') ? https : http
    var opts = {}
    var req = client.get(url, opts, function(res) {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, dest, onProgress).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode))
        return
      }
      var totalBytes = parseInt(res.headers['content-length'] || '0', 10)
      var receivedBytes = 0
      var file = createWriteStream(dest)
      res.on('data', function(chunk) {
        receivedBytes += chunk.length
        if (onProgress && totalBytes > 0) {
          onProgress(Math.round((receivedBytes / totalBytes) * 100))
        }
      })
      res.pipe(file)
      file.on('finish', function() { file.close(resolve) })
      file.on('error', function(err) { try { unlinkSync(dest) } catch(e) {} ; reject(err) })
    })
    req.on('error', reject)
    req.setTimeout(120000, function() { req.destroy(); reject(new Error('Download timeout')) })
  })
}

function compareVersions(v1, v2) {
  var p1 = v1.split('.').map(Number)
  var p2 = v2.split('.').map(Number)
  for (var i = 0; i < 3; i++) {
    if ((p1[i] || 0) > (p2[i] || 0)) return 1
    if ((p1[i] || 0) < (p2[i] || 0)) return -1
  }
  return 0
}

function createUpdateScript(resourcesDir, exePath, tempAsar) {
  var appDir = join(resourcesDir, '..')
  var batPath = join(app.getPath('temp'), 'gestocom-update.bat')

  var batContent = [
    '@echo off',
    'chcp 65001 >nul 2>&1',
    '',
    'echo GESTOCOM CI - Mise a jour en cours...',
    'echo.',
    '',
    'echo [1/4] Attente de la fermeture de l application...',
    'timeout /t 3 /nobreak >nul',
    'taskkill /f /im "GESTOCOM CI.exe" >nul 2>&1',
    'timeout /t 2 /nobreak >nul',
    'taskkill /f /im "GESTOCOM CI.exe" >nul 2>&1',
    'timeout /t 1 /nobreak >nul',
    '',
    'echo [2/4] Sauvegarde de la version actuelle...',
    'copy /y "' + join(resourcesDir, 'app.asar') + '" "' + join(app.getPath('temp'), 'app.asar.bak') + '" >nul 2>&1',
    '',
    'echo [3/4] Installation de la nouvelle version...',
    'powershell -NoProfile -ExecutionPolicy Bypass -Command "& { try { $src = \'' + tempAsar + '\'; $dst = \'' + join(resourcesDir, 'app.asar') + '\'; Remove-Item -LiteralPath $dst -Force -ErrorAction SilentlyContinue; Copy-Item -LiteralPath $src -Destination $dst -Force; Write-Host OK } catch { Write-Host ERR:$($_.Exception.Message); exit 1 } }"',
    'if %errorlevel% neq 0 (',
    '  echo.',
    '  echo Erreur lors de l extraction. Restauration...',
    '  copy /y "' + join(app.getPath('temp'), 'app.asar.bak') + '" "' + join(resourcesDir, 'app.asar') + '" >nul 2>&1',
    ')',
    '',
    'echo [4/4] Redemarrage de GESTOCOM CI...',
    'start "" "' + exePath + '"',
    '',
    'del "' + tempAsar + '" >nul 2>&1',
    'del "' + join(app.getPath('temp'), 'app.asar.bak') + '" >nul 2>&1',
    'del "%~f0" >nul 2>&1',
  ].join('\r\n')

  writeFileSync(batPath, batContent, 'utf-8')
  log('Batch script: ' + batPath)
  log('Resources: ' + resourcesDir)
  log('Exe: ' + exePath)
  log('Asar: ' + tempAsar)
  return batPath
}

async function checkForUpdates(mainWindow) {
  var currentVersion = app.getVersion()
  log('Current version: ' + currentVersion)

  try {
    var info = await fetchJSON(VERSION_URL)
    log('Server version: ' + info.version + ' (current: ' + currentVersion + ')')

    if (compareVersions(info.version, currentVersion) > 0) {
      log('Update available: v' + info.version)

      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-progress', { percent: 0, status: 'Mise a jour vers v' + info.version + '...' })
      }

      return { shouldUpdate: true, zipUrl: info.zipUrl || info.url, version: info.version, changelog: info.changelog || '' }
    } else {
      log('App is up to date')
    }
  } catch (err) {
    log('Update check failed: ' + err.message)
  }
  return { shouldUpdate: false }
}

async function applyUpdate(mainWindow, zipUrl) {
  if (isUpdating) {
    log('Update already in progress')
    return { success: false, error: 'Already updating' }
  }
  isUpdating = true

  var tempAsar = join(app.getPath('temp'), 'app.asar')
  var resourcesDir = process.resourcesPath
  var exePath = app.getPath('exe')

  log('=== Starting update ===')
  log('Resources dir: ' + resourcesDir)
  log('Exe path: ' + exePath)
  log('Download URL: ' + zipUrl)

  function notify(data) {
    if (mainWindow && mainWindow.webContents && !mainWindow.isDestroyed()) {
      try { mainWindow.webContents.send('update-progress', data) } catch(e) {}
    }
  }

  notify({ percent: 0, status: 'Telechargement en cours...' })

  try {
    await downloadFile(zipUrl, tempAsar, function(percent) {
      notify({ percent: percent, status: 'Telechargement... ' + percent + '%' })
    })
    log('Download complete: ' + tempAsar)

    if (!existsSync(tempAsar)) {
      throw new Error('File not found after download')
    }

    var stats = require('fs').statSync(tempAsar)
    log('Downloaded file size: ' + Math.round(stats.size / 1024) + ' KB')

    if (stats.size < 100000) {
      throw new Error('Downloaded file too small (' + stats.size + ' bytes) - likely not a valid asar')
    }

    notify({ percent: 100, status: 'Installation en cours...' })

    var batPath = createUpdateScript(resourcesDir, exePath, tempAsar)
    log('Starting batch: ' + batPath)

    var bat = spawn('cmd.exe', ['/c', batPath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      shell: false,
    })
    bat.unref()
    log('Batch process started (PID: ' + bat.pid + ')')

    setTimeout(function() {
      log('Quitting app for update...')
      app.exit(0)
    }, 500)

    return { success: true }
  } catch (err) {
    isUpdating = false
    log('Update failed: ' + err.message)
    try { unlinkSync(tempAsar) } catch(e) {}
    return { success: false, error: err.message }
  }
}

function isUpdatingNow() { return isUpdating }

module.exports = { checkForUpdates, applyUpdate, fetchJSON, compareVersions, downloadFile, isUpdatingNow }
