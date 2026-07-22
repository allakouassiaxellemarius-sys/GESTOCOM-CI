const fs = require('fs')
const path = require('path')

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'))
const version = pkg.version

const url = process.argv[2]
const changelog = process.argv[3] || 'Mise à jour GESTOCOM CI v' + version

if (!url) {
  console.error('Usage: node update-version.mjs <download-url> [changelog]')
  console.error('Example: node update-version.mjs "https://gofile.io/d/XXXXX" "Nouvelles fonctionnalités"')
  process.exit(1)
}

const versionData = {
  version: version,
  url: url,
  changelog: changelog,
  date: new Date().toISOString(),
}

const publicPath = path.join(__dirname, '..', 'public', 'version.json')
fs.writeFileSync(publicPath, JSON.stringify(versionData, null, 2) + '\n')
console.log('version.json created: v' + version)
console.log('Download URL: ' + url)
console.log('')
console.log('Next steps:')
console.log('  1. Run: npx vite build')
console.log('  2. Run: vercel --yes --prod --token <TOKEN>')
