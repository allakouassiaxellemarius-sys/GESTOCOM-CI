// scripts/notarize.js
// Apple notarization - only runs on macOS with proper env vars

export default async function afterSign(context) {
  if (process.platform !== 'darwin') return
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD) {
    console.log('Skipping notarization - missing APPLE_ID or APPLE_APP_SPECIFIC_PASSWORD')
    return
  }

  const { notarize } = await import('@electron/notarize')
  const { appOutDir, packager } = context
  const appName = packager.appInfo.productFilename

  console.log(`Notarizing ${appName}...`)

  await notarize({
    appBundleId: 'com.gestocom.ci',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  })

  console.log('Notarization complete')
}
