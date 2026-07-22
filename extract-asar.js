const asar = require('@electron/asar')
try {
  asar.extractAll('C:\\Users\\allak\\installed.asar', 'C:\\Users\\allak\\temp-installed-app')
  console.log('Done')
} catch(e) {
  console.error(e.message)
}
