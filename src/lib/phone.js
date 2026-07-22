const COUNTRY_CODE = '225'

export function normalizePhone(value) {
  if (!value) return ''
  let raw = value.replace(/[\s\-\(\)\.]/g, '')
  if (raw.startsWith('+225')) raw = raw.slice(4)
  else if (raw.startsWith('225') && raw.length > 10) raw = raw.slice(3)
  raw = raw.replace(/^0+/, '')
  if (!raw) return ''
  return '+' + COUNTRY_CODE + raw
}

export function formatPhoneDisplay(value) {
  if (!value) return ''
  const n = normalizePhone(value)
  if (n.length < 10) return n
  const digits = n.slice(4)
  if (digits.length === 10) {
    return '+225 ' + digits.slice(0, 2) + ' ' + digits.slice(2, 4) + ' ' + digits.slice(4, 6) + ' ' + digits.slice(6, 8) + ' ' + digits.slice(8)
  }
  return n
}

export function isPhoneValid(value) {
  const n = normalizePhone(value)
  return n.length === 13 && n.startsWith('+225')
}
