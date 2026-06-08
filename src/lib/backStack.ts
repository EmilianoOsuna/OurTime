type BackFn = () => void
const stack: BackFn[] = []
let ignoreCount = 0

export function pushBack(fn: BackFn) { stack.push(fn) }
export function removeBack(fn: BackFn) {
  const i = stack.lastIndexOf(fn)
  if (i !== -1) stack.splice(i, 1)
}
export function invokeTopBack(): boolean {
  if (!stack.length) return false
  stack.pop()!()
  return true
}
export function scheduleIgnorePop() { ignoreCount++ }
export function consumeIgnorePop(): boolean {
  if (ignoreCount > 0) { ignoreCount--; return true }
  return false
}
