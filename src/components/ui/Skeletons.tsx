
export function DashboardSkeleton() {
  return (
    <div className="anim-up" style={{ padding: 'var(--page-top) 22px 150px' }}>
      {/* Header Skeleton */}
      <div style={{ padding: '8px 0 6px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: '60%' }}>
          <div className="skeleton" style={{ width: 100, height: 12, marginBottom: 7, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: '85%', height: 34, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
        </div>
      </div>

      {/* Presence Card Skeleton */}
      <div className="ot-card" style={{ marginTop: 16, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 13, border: 'none' }}>
        <div style={{ position: 'relative', width: 60, height: 38 }}>
          <div className="skeleton" style={{ position: 'absolute', left: 0, width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--card)' }} />
          <div className="skeleton" style={{ position: 'absolute', left: 22, width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--card)' }} />
        </div>
        <div style={{ flex: 1, marginLeft: 4 }}>
          <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div className="skeleton" style={{ width: 32, height: 24, borderRadius: 4 }} />
          <div className="skeleton" style={{ width: 20, height: 10, borderRadius: 4 }} />
        </div>
      </div>

      {/* Next moment hero skeleton */}
      <div style={{ marginTop: 20 }}>
        <div className="skeleton" style={{ width: 140, height: 12, marginBottom: 12, borderRadius: 4 }} />
        <div className="ot-card" style={{ width: '100%', overflow: 'hidden', padding: 0, boxShadow: 'var(--sh-md)', border: 'none' }}>
          <div style={{ position: 'relative', height: 150 }}>
            <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
            <div className="skeleton" style={{ position: 'absolute', top: 14, left: 14, width: 44, height: 26, borderRadius: 12 }} />
            <div className="skeleton" style={{ position: 'absolute', top: 12, right: 14, width: 80, height: 26, borderRadius: 999 }} />
          </div>
          <div style={{ padding: '16px 18px 18px' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <div className="skeleton" style={{ width: 36, height: 34, borderRadius: 6 }} />
              <div className="skeleton" style={{ flex: 1, height: 22, borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
              <div className="skeleton" style={{ width: 100, height: 14, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 4 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming plans skeleton */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="skeleton" style={{ width: 80, height: 12, borderRadius: 4 }} />
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2].map(i => (
            <div key={i} className="ot-card" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12, border: 'none' }}>
              <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '70%', height: 15, marginBottom: 6, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '40%', height: 12, borderRadius: 4 }} />
              </div>
              <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline skeleton */}
      <div style={{ marginTop: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div className="skeleton" style={{ width: 110, height: 12, borderRadius: 4 }} />
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <div className="skeleton" style={{ width: 70, height: 12, borderRadius: 4 }} />
        </div>
        
        <div style={{ position: 'relative', marginTop: 14 }}>
          <div style={{ position: 'absolute', left: 22, top: 24, bottom: 30, width: 2, background: 'var(--card-2)' }} />
          {[1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
              <div style={{ width: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid var(--card)', position: 'relative', zIndex: 1 }} />
              </div>
              <div className="ot-card" style={{ flex: 1, padding: '13px 15px', border: 'none', position: 'relative', overflow: 'hidden' }}>
                <div className="skeleton" style={{ width: 60, height: 14, marginBottom: 8, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: '85%', height: 18, marginBottom: 10, borderRadius: 4 }} />
                <div className="skeleton" style={{ width: 120, height: 13, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div style={{ padding: 'var(--page-top) 22px 130px' }}>
      {/* Header Skeleton */}
      <div style={{ padding: '8px 0 6px' }}>
        <div className="skeleton" style={{ width: 80, height: 10, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 180, height: 28 }} />
      </div>

      {/* Month selectors skeleton */}
      <div className="ot-card" style={{ marginTop: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 120, height: 16 }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
      </div>

      {/* Grid Skeleton */}
      <div className="ot-card" style={{ marginTop: 16, padding: '15px 12px' }}>
        {/* Days of week */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 14 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 10, width: '70%', margin: '0 auto' }} />
          ))}
        </div>
        {/* Calendar days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {Array.from({ length: 31 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Row details list skeleton */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ width: 140, height: 10, marginBottom: 6 }} />
        <div className="ot-card" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 11 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: 140, height: 12, marginBottom: 6 }} />
            <div className="skeleton" style={{ width: 80, height: 10 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function GallerySkeleton() {
  return (
    <div style={{ padding: 'var(--page-top) 22px 130px' }}>
      {/* Header Skeleton */}
      <div style={{ padding: '8px 0 6px' }}>
        <div className="skeleton" style={{ width: 80, height: 10, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 150, height: 28 }} />
      </div>

      {/* Grid of images */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 12 }} />
        ))}
      </div>
    </div>
  )
}

export function FinancesSkeleton() {
  return (
    <div style={{ padding: 'var(--page-top) 22px 130px' }}>
      {/* Header Skeleton */}
      <div style={{ padding: '8px 0 6px' }}>
        <div className="skeleton" style={{ width: 100, height: 10, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 180, height: 28 }} />
      </div>

      {/* Hero card skeleton */}
      <div className="ot-card" style={{ marginTop: 18, padding: '22px 20px', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 120, height: 10 }} />
          <div className="skeleton" style={{ width: 60, height: 26, borderRadius: 11 }} />
        </div>
        <div className="skeleton" style={{ width: '50%', height: 38, margin: '12px 0' }} />
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="skeleton" style={{ width: 100, height: 24, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 100, height: 24, borderRadius: 6 }} />
        </div>
      </div>

      {/* Segments skeleton */}
      <div className="skeleton" style={{ width: '100%', height: 38, borderRadius: 999, marginTop: 22 }} />

      {/* List skeleton */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="ot-card" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 13 }}>
            <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 12 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: 140, height: 13, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 80, height: 10 }} />
            </div>
            <div className="skeleton" style={{ width: 50, height: 14 }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Header skeleton */}
      <div style={{ padding: 'var(--page-top) 18px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--line)' }}>
        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: 100, height: 13, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: 70, height: 9 }} />
        </div>
      </div>

      {/* Messages area skeleton */}
      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: '60%', height: 48, borderRadius: '18px 18px 18px 4px' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          <div className="skeleton" style={{ width: '45%', height: 36, borderRadius: '18px 18px 4px 18px' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <div className="skeleton" style={{ width: '50%', height: 64, borderRadius: '18px 18px 18px 4px' }} />
        </div>
      </div>

      {/* Input area skeleton */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 8, borderTop: '1px solid var(--line)' }}>
        <div className="skeleton" style={{ flex: 1, height: 40, borderRadius: 20 }} />
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
      </div>
    </div>
  )
}
