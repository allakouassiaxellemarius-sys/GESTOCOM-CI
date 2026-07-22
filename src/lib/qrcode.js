// Minimal QR Code generator - self-contained, no dependencies
// Generates QR codes as SVG strings or data URLs

const ALIGNMENT_PATTERNS = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46],
  10: [6, 28, 50],
}

const EC_LEVELS = { L: 0, M: 1, Q: 2, H: 3 }

function generateQRMatrix(text, ecLevel = 'M') {
  const data = encodeText(text)
  const version = getVersion(data.length, ecLevel)
  if (!version) throw new Error('Texte trop long pour un QR code')

  const size = version * 4 + 17
  const matrix = Array.from({ length: size }, () => Array(size).fill(null))
  const reserved = Array.from({ length: size }, () => Array(size).fill(false))

  placeFinderPatterns(matrix, reserved, size)
  placeAlignmentPatterns(matrix, reserved, version, size)
  placeTimingPatterns(matrix, reserved, size)
  placeFormatInfo(matrix, reserved, size, ecLevel, 0)
  placeData(matrix, reserved, data, size)
  applyBestMask(matrix, reserved, size, ecLevel)

  return { matrix, size }
}

function encodeText(text) {
  const bytes = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code < 0x80) {
      bytes.push(code)
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    } else {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
  }
  return bytes
}

function getVersion(dataLen, ecLevel) {
  for (let v = 1; v <= 10; v++) {
    const cap = { L: [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271], M: [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213], Q: [0, 11, 20, 32, 46, 60, 74, 86, 108, 130, 151], H: [0, 7, 15, 26, 34, 44, 58, 64, 84, 98, 119] }
    if (dataLen <= cap[ecLevel][v]) return v
  }
  return null
}

function placeFinderPatterns(matrix, reserved, size) {
  const pattern = [
    [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]
  ]
  const positions = [[0, 0], [0, size - 7], [size - 7, 0]]
  for (const [r, c] of positions) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          const val = (dr >= 0 && dr < 7 && dc >= 0 && dc < 7) ? pattern[dr][dc] : 0
          matrix[rr][cc] = val
          reserved[rr][cc] = true
        }
      }
    }
  }
}

function placeAlignmentPatterns(matrix, reserved, version, size) {
  const positions = ALIGNMENT_PATTERNS[version] || []
  for (const r of positions) {
    for (const c of positions) {
      if (reserved[r]?.[c]) continue
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const rr = r + dr, cc = c + dc
          if (rr >= 0 && rr < size && cc >= 0 && cc < size && !reserved[rr][cc]) {
            matrix[rr][cc] = (Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0)) ? 1 : 0
            reserved[rr][cc] = true
          }
        }
      }
    }
  }
}

function placeTimingPatterns(matrix, reserved, size) {
  for (let i = 8; i < size - 8; i++) {
    if (!reserved[6][i]) { matrix[6][i] = i % 2 === 0 ? 1 : 0; reserved[6][i] = true }
    if (!reserved[i][6]) { matrix[i][6] = i % 2 === 0 ? 1 : 0; reserved[i][6] = true }
  }
}

function placeFormatInfo(matrix, reserved, size, ecLevel, mask) {
  const ecBits = EC_LEVELS[ecLevel]
  const format = (ecBits << 3) | mask
  const bch = computeBCH(format)
  const full = (format << 10) | bch ^ 0x5412

  const bits = []
  for (let i = 14; i >= 0; i--) bits.push((full >> i) & 1)

  const positions1 = [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[7,8],[8,8],[8,7],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]]
  const positions2 = [[8,size-1],[8,size-2],[8,size-3],[8,size-4],[8,size-5],[8,size-6],[8,size-7],[size-7,8],[size-6,8],[size-5,8],[size-4,8],[size-3,8],[size-2,8],[size-1,8],[size,8]]

  for (let i = 0; i < 15; i++) {
    const [r1, c1] = positions1[i]
    const [r2, c2] = [8, size - 1 - i]
    if (r1 < size && c1 < size) { matrix[r1][c1] = bits[i]; reserved[r1][c1] = true }
    if (r2 >= 0 && r2 < size && c2 >= 0 && c2 < size) { matrix[r2][c2] = bits[i]; reserved[r2][c2] = true }
  }

  matrix[8][8] = 1; reserved[8][8] = true
}

function computeBCH(value) {
  let bits = value << 10
  let gen = 0x537
  for (let i = 4; i >= 0; i--) {
    if (bits & (1 << (i + 10))) bits ^= gen << i
  }
  return bits & 0x3ff
}

function placeData(matrix, reserved, data, size) {
  const bits = []
  for (const byte of data) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1)
  }
  const totalBits = size * size
  while (bits.length < totalBits) bits.push(0)

  let bitIdx = 0
  let right = size - 1
  while (right >= 0) {
    if (right === 6) right--
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < 2; j++) {
        const col = right - j
        const row = (Math.floor((size - 1 - right) / 2) % 2 === 0) ? (size - 1 - i) : i
        if (col >= 0 && col < size && !reserved[row][col]) {
          matrix[row][col] = bitIdx < bits.length ? bits[bitIdx] : 0
          bitIdx++
        }
      }
    }
    right -= 2
  }
}

function applyBestMask(matrix, reserved, size, ecLevel) {
  let bestMask = 0, bestPenalty = Infinity
  for (let mask = 0; mask < 8; mask++) {
    const test = matrix.map(r => [...r])
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c]) {
          const shouldFlip = [() => (r + c) % 2 === 0, () => r % 2 === 0, () => c % 3 === 0,
            () => (r + c) % 3 === 0, () => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
            () => ((r * c) % 2 + (r * c) % 3) === 0, () => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
            () => ((r + c) % 2 + (r * c) % 3) % 2 === 0][mask]
          if (shouldFlip()) test[r][c] ^= 1
        }
      }
    }
    const penalty = calcPenalty(test, size)
    if (penalty < bestPenalty) { bestPenalty = penalty; bestMask = mask }
  }

  placeFormatInfo(matrix, reserved, size, ecLevel, bestMask)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r] || !reserved[r][c]) {
        const shouldFlip = [() => (r + c) % 2 === 0, () => r % 2 === 0, () => c % 3 === 0,
          () => (r + c) % 3 === 0, () => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
          () => ((r * c) % 2 + (r * c) % 3) === 0, () => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
          () => ((r + c) % 2 + (r * c) % 3) % 2 === 0][bestMask]
        if (shouldFlip()) matrix[r][c] ^= 1
      }
    }
  }
}

function calcPenalty(matrix, size) {
  let penalty = 0
  for (let r = 0; r < size; r++) {
    let count = 1
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) { count++; if (count === 5) penalty += 3; else if (count > 5) penalty++ }
      else count = 1
    }
  }
  for (let c = 0; c < size; c++) {
    let count = 1
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) { count++; if (count === 5) penalty += 3; else if (count > 5) penalty++ }
      else count = 1
    }
  }
  return penalty
}

export function generateQRSVG(text, moduleSize = 4, margin = 2) {
  const { matrix, size } = generateQRMatrix(text)
  const totalSize = (size + margin * 2) * moduleSize
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`
  svg += `<rect width="${totalSize}" height="${totalSize}" fill="white"/>`
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        svg += `<rect x="${(c + margin) * moduleSize}" y="${(r + margin) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`
      }
    }
  }
  svg += '</svg>'
  return svg
}

export function qrToDataURL(text, size = 128) {
  const svg = generateQRSVG(text, Math.max(1, Math.floor(size / 30)))
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}
