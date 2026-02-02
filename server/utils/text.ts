const MAC_ROMAN_UNICODE_TO_BYTE: Record<string, number> = {
  '†': 0xA0,
  '•': 0xA5,
  '™': 0xAA,
  '≠': 0xAD,
  '∞': 0xB0,
  '≤': 0xB2,
  '≥': 0xB3,
  '∂': 0xB6,
  '∑': 0xB7,
  '∏': 0xB8,
  'π': 0xB9,
  '∫': 0xBA,
  'Ω': 0xBD,
  '√': 0xC3,
  'ƒ': 0xC4,
  '≈': 0xC5,
  '∆': 0xC6,
  '…': 0xC9,
  'Œ': 0xCE,
  'œ': 0xCF,
  '–': 0xD0,
  '—': 0xD1,
  '“': 0xD2,
  '”': 0xD3,
  '‘': 0xD4,
  '’': 0xD5,
  '◊': 0xD7,
  'Ÿ': 0xD9,
  '⁄': 0xDA,
  '€': 0xDB,
  '‹': 0xDC,
  '›': 0xDD,
  'ﬁ': 0xDE,
  'ﬂ': 0xDF,
  '‡': 0xE0,
  '‚': 0xE2,
  '„': 0xE3,
  '‰': 0xE4,
  '': 0xF0,
  'ı': 0xF5,
  'ˆ': 0xF6,
  '˜': 0xF7,
  '˘': 0xF9,
  '˙': 0xFA,
  '˚': 0xFB,
  '˝': 0xFD,
  '˛': 0xFE,
  'ˇ': 0xFF
}

const countMatches = (value: string, pattern: RegExp) => (value.match(pattern) ?? []).length

const looksLikeLatin1Mojibake = (value: string) => /[ÃÂâ�]/.test(value)

const repairFromLatin1 = (value: string) => {
  const repaired = Buffer.from(value, 'latin1').toString('utf8')

  // Accept only if it looks meaningfully better.
  const beforeNoise = countMatches(value, /[ÃÂâ�]/g)
  const afterNoise = countMatches(repaired, /[ÃÂâ�]/g)
  if (afterNoise < beforeNoise) return repaired

  return value
}

const looksLikeMacRomanUtf8Mojibake = (value: string) => value.includes('√')

const repairFromMacRomanUtf8 = (value: string) => {
  const bytes: number[] = []
  for (const ch of value) {
    const codePoint = ch.codePointAt(0)
    if (codePoint === undefined) continue

    if (codePoint <= 0xff) {
      bytes.push(codePoint)
      continue
    }

    const mapped = MAC_ROMAN_UNICODE_TO_BYTE[ch]
    if (mapped === undefined) {
      return value
    }
    bytes.push(mapped)
  }

  const repaired = Buffer.from(bytes).toString('utf8')
  if (repaired.includes('�')) return value
  if (!repaired || repaired === value) return value
  if (repaired.includes('√')) return value
  return repaired
}

export const repairMojibake = (value: string) => {
  let current = value

  if (looksLikeLatin1Mojibake(current)) {
    current = repairFromLatin1(current)
  }

  if (looksLikeMacRomanUtf8Mojibake(current)) {
    current = repairFromMacRomanUtf8(current)
  }

  return current
}

export const repairMojibakeNullable = <T extends string | null | undefined>(value: T): T => {
  if (typeof value !== 'string') return value
  return repairMojibake(value) as T
}

