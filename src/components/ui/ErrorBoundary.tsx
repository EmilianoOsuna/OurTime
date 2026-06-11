import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          minHeight: '100dvh', background: 'var(--paper)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--orange-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 28 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Algo salió mal
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.5, maxWidth: 280, marginBottom: 24 }}>
            Ocurrió un error inesperado. Podés recargar la página para intentar de nuevo.
          </p>
          <button onClick={() => window.location.reload()} style={{
            border: '1.5px solid var(--line)', background: 'var(--card)',
            borderRadius: 999, padding: '12px 24px', fontSize: 15, fontWeight: 600,
            color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}>
            Recargar
          </button>
          {this.state.error && (
            <details style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-faint)', maxWidth: 320 }}>
              <summary style={{ cursor: 'pointer' }}>Detalles técnicos</summary>
              <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', textAlign: 'left', lineHeight: 1.4 }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
