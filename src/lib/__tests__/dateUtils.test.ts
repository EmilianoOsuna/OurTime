import { describe, it, expect, vi, afterEach } from 'vitest'
import { calculateTimeTogether, calculateCountdown, generateCalendarMatrix, MONTH_NAMES, WEEK_DAYS } from '../dateUtils'

afterEach(() => { vi.restoreAllMocks() })

describe('calculateTimeTogether', () => {
  it('returns zeroes if start date is in the future', () => {
    const result = calculateTimeTogether('2099-06-01')
    expect(result).toEqual({ years: 0, months: 0, days: 0 })
  })

  it('returns correct duration for an exact past date', () => {
    vi.setSystemTime(new Date('2026-06-11'))
    const result = calculateTimeTogether('2025-01-15')
    expect(result.years).toBe(1)
    expect(result.months).toBe(4)
    expect(result.days).toBe(27)
  })
})

describe('calculateCountdown', () => {
  it('returns zeroes for past date', () => {
    const result = calculateCountdown('2020-01-01')
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('returns correct countdown for future date', () => {
    vi.setSystemTime(new Date('2026-06-11T00:00:00'))
    const result = calculateCountdown('2026-06-15T00:00:00')
    expect(result.days).toBe(4)
    expect(result.hours).toBe(0)
  })
})

describe('generateCalendarMatrix', () => {
  it('returns 31 days for January 2026', () => {
    const matrix = generateCalendarMatrix(new Date(2026, 0, 1))
    const days = matrix.filter(d => d !== null)
    expect(days).toHaveLength(31)
  })

  it('pads leading nulls based on first day of month', () => {
    // 2026-01-01 is Thursday (getDay=4)
    const matrix = generateCalendarMatrix(new Date(2026, 0, 1))
    const nulls = matrix.filter(d => d === null)
    expect(nulls).toHaveLength(4)
  })
})

describe('constants', () => {
  it('has 12 month names', () => { expect(MONTH_NAMES).toHaveLength(12) })
  it('has 7 week day abbreviations', () => { expect(WEEK_DAYS).toHaveLength(7) })
})
