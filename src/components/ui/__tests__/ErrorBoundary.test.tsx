/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

const Bomb = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) throw new Error('test error')
  return <div>safe</div>
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>hello</div></ErrorBoundary>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('renders fallback UI on error', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>)
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(screen.getByText('Recargar')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>custom error</div>}>
        <Bomb shouldThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('custom error')).toBeInTheDocument()
  })

  it('shows technical details when error occurs', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>)
    expect(screen.getByText('Detalles técnicos')).toBeInTheDocument()
    expect(screen.getByText('test error')).toBeInTheDocument()
  })

  it('logs error to console', () => {
    render(<ErrorBoundary><Bomb shouldThrow /></ErrorBoundary>)
    expect(console.error).toHaveBeenCalled()
  })
})
