import { describe, it, expect } from 'vitest'
import { getPlanThemeImage } from '../themeUtils'

describe('getPlanThemeImage', () => {
  it('returns default image when type is undefined', () => {
    const url = getPlanThemeImage(undefined)
    expect(url).toContain('unsplash.com')
  })

  it('returns correct image for "viaje"', () => {
    const url = getPlanThemeImage('viaje')
    expect(url).toContain('unsplash.com')
    expect(url).toContain('1469854523086')
  })

  it('returns default for unknown type', () => {
    const url = getPlanThemeImage('unknown_type_123')
    expect(url).toContain('unsplash.com')
  })

  it('is case-insensitive', () => {
    const upper = getPlanThemeImage('CENA')
    const lower = getPlanThemeImage('cena')
    expect(upper).toBe(lower)
  })
})
