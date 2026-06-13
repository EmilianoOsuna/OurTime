let cleanup: (() => void) | null = null

export function recoverNextClickAfterDrag() {
  cleanup?.()

  let target: HTMLElement | null = null
  let nativeClick = false
  let timer = 0

  const finish = () => {
    window.clearTimeout(timer)
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('pointerup', onPointerUp, true)
    document.removeEventListener('click', onClick, true)
    cleanup = null
  }

  const onPointerDown = (event: PointerEvent) => {
    target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      'button:not(:disabled), a[href], [role="button"]:not([aria-disabled="true"])'
    ) ?? null
    nativeClick = false
  }

  const onClick = () => {
    nativeClick = true
    finish()
  }

  const onPointerUp = () => {
    if (!target) { finish(); return }
    timer = window.setTimeout(() => {
      if (!nativeClick && target?.isConnected) target.click()
      finish()
    }, 50)
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('pointerup', onPointerUp, true)
  document.addEventListener('click', onClick, true)
  cleanup = finish
}
