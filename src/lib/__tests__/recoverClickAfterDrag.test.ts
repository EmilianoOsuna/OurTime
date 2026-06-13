import { afterEach, describe, expect, it, vi } from 'vitest'
import { recoverNextClickAfterDrag } from '../recoverClickAfterDrag'

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('recoverNextClickAfterDrag', () => {
  it('dispara el click si WebView solo entrega pointerup', () => {
    vi.useFakeTimers()
    const button = document.createElement('button')
    const onClick = vi.fn()
    button.addEventListener('click', onClick)
    document.body.append(button)

    recoverNextClickAfterDrag()
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    vi.advanceTimersByTime(50)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('no duplica un click nativo', () => {
    vi.useFakeTimers()
    const button = document.createElement('button')
    const onClick = vi.fn()
    button.addEventListener('click', onClick)
    document.body.append(button)

    recoverNextClickAfterDrag()
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    button.click()
    vi.advanceTimersByTime(50)

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
