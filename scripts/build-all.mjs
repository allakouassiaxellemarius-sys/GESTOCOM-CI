#!/usr/bin/env node
// scripts/build-all.mjs
// Cross-platform build script for GESTOCOM CI
// Usage: node scripts/build-all.mjs [--platform=win|mac|linux|android|ios|all]

import { execSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const RELEASE_DIR = join(ROOT, 'release')
const HASHES_DIR = join(RELEASE_DIR, 'checksums')

const args = process.argv.slice(2)
const platformArg = args.find(a => a.startsWith('--platform='))?.split('=')[1] || 'current'

const log = (msg) => console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`)
const run = (cmd) => {
  console.log(`  ▸ ${cmd}`)
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, FORCE_COLOR: '1' } })
}

function sha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function generateChecksums() {
  if (!existsSync(HASHES_DIR)) mkdirSync(HASHES_DIR, { recursive: true })

  const files = readdirSync(RELEASE_DIR).filter(f =>
    /\.(exe|msi|dmg|pkg|deb|rpm|AppImage|apk|aab|ipa)$/.test(f)
  )

  const checksums = {}
  for (const file of files) {
    const hash = sha256(join(RELEASE_DIR, file))
    checksums[file] = hash
    console.log(`  ✓ ${file}: ${hash.slice(0, 16)}...`)
  }

  writeFileSync(join(HASHES_DIR, 'SHA256SUMS.txt'),
    Object.entries(checksums).map(([f, h]) => `${h}  ${f}`).join('\n')
  )
  writeFileSync(join(HASHES_DIR, 'SHA256SUMS.json'), JSON.stringify(checksums, null, 2))
  console.log(`  ✓ Checksums written to ${HASHES_DIR}`)
}

function buildDesktop(platform) {
  log(`Building Desktop (${platform})`)
  run('npm run build')

  if (platform === 'win' || platform === 'all') {
    log('Windows: NSIS + MSI')
    run('npx electron-builder --win --config')
  }
  if (platform === 'mac' || platform === 'all') {
    log('macOS: DMG + PKG')
    run('npx electron-builder --mac --config')
  }
  if (platform === 'linux' || platform === 'all') {
    log('Linux: AppImage + DEB + RPM')
    run('npx electron-builder --linux --config')
  }
}

function buildAndroid() {
  log('Android: APK + AAB')
  run('npm run build')
  run('npx cap sync android')
  run('cd android && ./gradlew assembleDebug assembleRelease bundleRelease')
}

function buildIOS() {
  log('iOS: IPA')
  if (process.platform !== 'darwin') {
    console.log('  ⚠ iOS builds require macOS with Xcode. Skipping.')
    return
  }
  run('npm run build')
  run('npx cap sync ios')
  run('cd ios && xcodebuild -workspace GESTOCOMCI.xcworkspace -scheme GESTOCOMCI -configuration Release -archivePath build/GESTOCOMCI.xcarchive archive')
  run('cd ios && xcodebuild -exportArchive -archivePath build/GESTOCOMCI.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath build/')
}

// Main
const platform = platformArg
const startTime = Date.now()

console.log(`
  ╔══════════════════════════════════════════════╗
  ║         GESTOCOM CI - Build System           ║
  ║         Version: 1.0.0                        ║
  ║         Platform: ${platform.padEnd(28)}║
  ╚══════════════════════════════════════════════╝
`)

if (!existsSync(RELEASE_DIR)) mkdirSync(RELEASE_DIR, { recursive: true })

try {
  if (platform === 'current') {
    const p = process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux'
    buildDesktop(p)
  } else if (platform === 'all') {
    buildDesktop('all')
    buildAndroid()
    buildIOS()
  } else if (['win', 'mac', 'linux'].includes(platform)) {
    buildDesktop(platform)
  } else if (platform === 'android') {
    buildAndroid()
  } else if (platform === 'ios') {
    buildIOS()
  } else {
    console.error(`Unknown platform: ${platform}`)
    process.exit(1)
  }

  log('Generating checksums (SHA-256)')
  generateChecksums()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║  ✅ Build complete in ${elapsed}s${' '.repeat(Math.max(0, 20 - elapsed.length))}║
  ║  Output: release/                            ║
  ╚══════════════════════════════════════════════╝
  `)
} catch (err) {
  console.error('\n  ❌ Build failed:', err.message)
  process.exit(1)
}
