import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const buildDir = resolve(__dirname, '..', 'build')
const svgPath = resolve(buildDir, 'icon.svg')

async function generateIcons() {
  console.log('Generating icons from SVG...')

  // Generate PNGs at various sizes
  const sizes = [16, 32, 48, 64, 128, 256, 512, 1024]
  for (const size of sizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(resolve(buildDir, `icon${size === 256 ? '' : `-${size}`}.png`))
    console.log(`  icon-${size}.png`)
  }

  // Generate ICO file (Windows) - contains 16, 32, 48, 256 px
  const icoSizes = [16, 32, 48, 256]
  const icoImages = []
  for (const size of icoSizes) {
    const buf = await sharp(svgPath).resize(size, size).png().toBuffer()
    icoImages.push({ size, buf })
  }

  // Build ICO file manually (simple format)
  const numImages = icoImages.length
  // ICO header: 6 bytes (reserved, type, count)
  // Each entry: 16 bytes
  const headerSize = 6 + numImages * 16
  let totalDataOffset = headerSize
  const entries = []
  const imageDataBuffers = []

  for (const img of icoImages) {
    const pngBuf = img.buf
    const w = img.size < 256 ? img.size : 0  // 0 means 256
    const h = img.size < 256 ? img.size : 0

    entries.push({
      width: w,
      height: h,
      colors: 0,
      reserved: 0,
      planes: 1,
      bitCount: 32,
      size: pngBuf.length,
      offset: totalDataOffset,
    })
    imageDataBuffers.push(pngBuf)
    totalDataOffset += pngBuf.length
  }

  // Write ICO
  const icoBuffer = Buffer.alloc(totalDataOffset)
  // Header
  icoBuffer.writeUInt16LE(0, 0)       // reserved
  icoBuffer.writeUInt16LE(1, 2)       // type = ICO
  icoBuffer.writeUInt16LE(numImages, 4) // count

  let pos = 6
  for (const entry of entries) {
    icoBuffer.writeUInt8(entry.width, pos)
    icoBuffer.writeUInt8(entry.height, pos + 1)
    icoBuffer.writeUInt8(entry.colors, pos + 2)
    icoBuffer.writeUInt8(entry.reserved, pos + 3)
    icoBuffer.writeUInt16LE(entry.planes, pos + 4)
    icoBuffer.writeUInt16LE(entry.bitCount, pos + 6)
    icoBuffer.writeUInt32LE(entry.size, pos + 8)
    icoBuffer.writeUInt32LE(entry.offset, pos + 12)
    pos += 16
  }

  for (const buf of imageDataBuffers) {
    buf.copy(icoBuffer, pos)
    pos += buf.length
  }

  writeFileSync(resolve(buildDir, 'icon.ico'), icoBuffer)
  console.log('  icon.ico')

  // Generate ICNS for macOS (optional, just use PNG 1024)
  // electron-builder accepts PNG for mac icon too
  console.log('  Done! Icons generated in build/')
}

generateIcons().catch(console.error)
