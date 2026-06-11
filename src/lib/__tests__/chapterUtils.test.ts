import { describe, it, expect } from 'vitest'
import { toRoman, fmtDateShort, fmtDate, countdown, eur, CAT_META } from '../chapterUtils'

describe('toRoman', () => {
  it.each([
    [1, 'I'], [4, 'IV'], [5, 'V'], [9, 'IX'],
    [10, 'X'], [7, 'VII'], [3, 'III'],
  ])('converts %i to %s', (n, expected) => {
    expect(toRoman(n)).toBe(expected)
  })
})

describe('fmtDateShort', () => {
  it('formats ISO date to short spanish format', () => {
    expect(fmtDateShort('2026-06-11')).toMatch(/^\d{1,2} jun$/)
  })
})

describe('fmtDate', () => {
  it('formats ISO date to full spanish format with year', () => {
    expect(fmtDate('2026-06-11')).toMatch(/^\d{1,2} jun 2026$/)
  })
})

describe('countdown', () => {
  it('returns "hoy" for today', () => {
    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(countdown(iso)).toBe('hoy')
  })
})

describe('eur', () => {
  it('formats number as euro string', () => {
    expect(eur(1234)).toContain('€')
    expect(eur(1234)).toMatch(/1[,.]?234/)
  })
})

describe('CAT_META', () => {
  it('has all expected categories', () => {
    const keys = Object.keys(CAT_META)
    expect(keys).toContain('cena')
    expect(keys).toContain('viaje')
    expect(keys).toContain('otro')
  })
})
