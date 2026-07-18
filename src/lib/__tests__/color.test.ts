import { describe, it, expect } from 'vitest'
import { parseHex, isHexColor, luminance, contrast, heroInk, accentInk } from '../color'

const PAPER = luminance([244, 239, 227])
const DARK_CARD = luminance([39, 39, 42])

describe('parseHex / isHexColor', () => {
  it('acepta hex de 6 y 3 dígitos', () => {
    expect(parseHex('#F17720')).toEqual([241, 119, 32])
    expect(parseHex('#fff')).toEqual([255, 255, 255])
  })
  it('rechaza valores incompletos o basura', () => {
    expect(parseHex('#F1')).toBeNull()
    expect(parseHex('naranja')).toBeNull()
    expect(isHexColor(null)).toBe(false)
    expect(isHexColor('#F17720')).toBe(true)
  })
})

describe('heroInk', () => {
  it('acento claro → tinta oscura', () => {
    expect(heroInk('#E0A800').text).toBe('#2A1505')
    expect(heroInk('#F3BC3F').text).toBe('#2A1505')
  })
  it('acento oscuro → tinta clara', () => {
    expect(heroInk('#1A4B6B').text).toBe('#FFF9F4')
    expect(heroInk('#7C4D9A').text).toBe('#FFF9F4')
  })
})

describe('accentInk', () => {
  const ACCENTS = ['#F17720', '#0474BA', '#E55B7E', '#2D805B', '#7C4D9A', '#E0A800', '#C05C42', '#1A4B6B', '#FFF3C4']

  it('en claro: ≥4.5:1 sobre papel para cualquier acento', () => {
    for (const hex of ACCENTS) {
      const ink = accentInk(hex, false)
      const rgb = parseHex(ink)!
      expect(contrast(luminance(rgb), PAPER), `${hex} → ${ink}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('en oscuro: ≥4.5:1 sobre la tarjeta más clara para cualquier acento', () => {
    for (const hex of ACCENTS) {
      const ink = accentInk(hex, true)
      const rgb = parseHex(ink)!
      expect(contrast(luminance(rgb), DARK_CARD), `${hex} → ${ink}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('no altera un acento que ya contrasta', () => {
    expect(accentInk('#1A4B6B', false)).toBe('#1a4b6b')
  })
})
