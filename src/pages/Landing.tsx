import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useMotionValueEvent, useSpring, useMotionValue, animate } from 'framer-motion'
import { Smartphone, Star, Check, ChevronDown, ArrowRight } from 'lucide-react'
import { Icon } from '../components/ui/Icon'
const easeOut = [0.16, 1, 0.3, 1] as const

const PLANS = [
  {
    name: 'Gratis',
    price: '$0',
    period: 'para siempre',
    desc: 'Para empezar su historia.',
    popular: false,
    features: [
      '1 Historia activa',
      'Hasta 50 Momentos',
      '100 fotos',
      'Chat ilimitado',
    ],
    cta: 'Empezar gratis',
    color: '#A99F90',
  },
  {
    name: 'Duo',
    price: '$3.99',
    period: '/mes',
    desc: 'Para parejas que viven al máximo.',
    popular: true,
    features: [
      'Historias ilimitadas',
      'Fotos y Momentos ilimitados',
      'Google Calendar sync',
      'Widgets de pantalla',
      'Exportar PDF / álbum digital',
      'Soporte prioritario',
    ],
    cta: 'Elegir Duo',
    color: '#F17720',
    annual: '$34.99/año — ahorra 27%',
  },
  {
    name: 'Familia',
    price: '$6.99',
    period: '/mes',
    desc: 'Para toda la familia.',
    popular: false,
    features: [
      'Todo Duo +',
      'Hasta 6 miembros',
      'Roles y permisos',
      'Presupuesto familiar',
    ],
    cta: 'Elegir Familia',
    color: '#0474BA',
  },
]

// ─── Magnetic button (follows cursor) ──────────────────────
function MagneticButton({ children, className = '', style, onClick }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = 120
    const strength = Math.max(0, 1 - dist / maxDist)
    animate(x, dx * 0.25 * strength, { type: 'spring', stiffness: 400, damping: 25 })
    animate(y, dy * 0.25 * strength, { type: 'spring', stiffness: 400, damping: 25 })
  }, [x, y])

  const handleLeave = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 })
    animate(y, 0, { type: 'spring', stiffness: 400, damping: 25 })
  }, [x, y])

  return (
    <motion.button
      ref={ref}
      className={className}
      style={{ ...style, x, y }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  )
}

// ─── Floating particle background ──────────────────────────
function ParticleField() {
  const particles = Array.from({ length: 30 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.05,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: i % 3 === 0 ? 'var(--orange)' : i % 3 === 1 ? 'var(--blue)' : 'var(--ink)',
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── Floating Word (like Good Secrets "good" "secrets") ────
function FloatingWord({ text, delay = 0, fontSize = 'clamp(80px, 18vw, 180px)', color = 'var(--ink)' }: {
  text: string
  delay?: number
  fontSize?: string
  color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: easeOut }}
      style={{
        position: 'relative',
        fontSize,
        fontWeight: 500,
        lineHeight: 0.88,
        letterSpacing: '-0.04em',
        color,
        fontFamily: 'var(--font-display)',
        cursor: 'default',
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 }}
      >
        {text}
      </motion.div>
    </motion.div>
  )
}

// ─── NavBar ────────────────────────────────────────────────
function NavBar({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40))

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 80,
        padding: scrolled ? '10px 24px' : '18px 24px',
        background: scrolled ? 'rgba(255,252,247,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line-soft)' : 'none',
        transition: 'all 0.35s',
      }}
    >
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          whileHover={{ scale: 1.02 }}
        >
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20,
            color: 'var(--ink)', letterSpacing: '-0.03em',
          }}>
            Our<span style={{ color: 'var(--orange)' }}>Time</span>
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4,
            background: 'var(--orange)', color: '#fff', fontFamily: 'var(--font-ui)',
          }}>
            Beta
          </span>
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            onClick={onGetStarted}
            className="btn btn-primary"
            style={{ fontSize: 13, padding: '10px 20px', height: 38 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            Empezar
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}

// ─── Hero Section ──────────────────────────────────────────
function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center',
      padding: '120px 28px 80px',
      position: 'relative', overflow: 'hidden',
    }}>
      <ParticleField />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1.5 }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 70% 50% at 30% 20%, rgba(241,119,32,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 70%, rgba(4,116,186,0.10) 0%, transparent 50%)`,
        }}
      />

      <div style={{
        maxWidth: 1200, margin: '0 auto', width: '100%',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 900, marginBottom: 40 }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease: easeOut }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28,
              background: 'var(--card)', border: '1px solid var(--line-soft)',
              borderRadius: 999, padding: '5px 14px 5px 5px',
              fontFamily: 'var(--font-ui)', fontSize: 12,
            }}
          >
            <span style={{
              background: 'var(--orange)', borderRadius: 999, padding: '3px 9px',
              color: '#fff', fontWeight: 700, fontSize: 10, letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>Nuevo</span>
            <span style={{ color: 'var(--ink-soft)', fontWeight: 500 }}>
              App para parejas &mdash; próximamente en <strong>Play Store</strong>
            </span>
          </motion.div>

          {/* Floating words — like "good" "secrets" */}
          <div style={{ marginBottom: 32 }}>
            <FloatingWord text="Su" delay={0.3} fontSize="clamp(60px, 14vw, 140px)" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2em', flexWrap: 'wrap' }}>
              <FloatingWord text="historia," delay={0.5} fontSize="clamp(60px, 14vw, 140px)" />
              <FloatingWord
                text="compartida"
                delay={0.7}
                fontSize="clamp(60px, 14vw, 140px)"
                color="var(--orange)"
              />
            </div>
            <FloatingWord text="y organizada." delay={0.9} fontSize="clamp(60px, 14vw, 140px)" />
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1, ease: easeOut }}
            style={{
              fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.6,
              margin: '0 0 36px', maxWidth: 420, fontFamily: 'var(--font-ui)',
            }}
          >
            Planes, finanzas, fotos y chat privado. Todo sincronizado en tiempo real con su pareja.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3, ease: easeOut }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}
          >
            <MagneticButton onClick={onGetStarted} className="btn btn-orange" style={{
              fontSize: 15, padding: '15px 28px',
              boxShadow: '0 8px 24px rgba(241,119,32,0.3)',
            }}>
              Crear historia gratis <ArrowRight size={16} strokeWidth={2.5} />
            </MagneticButton>
            <MagneticButton className="btn btn-soft" style={{ fontSize: 15, padding: '15px 24px' }}>
              <Smartphone size={17} /> App pronto
            </MagneticButton>
          </motion.div>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5, ease: easeOut }}
            style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 1.5 + i * 0.08, ease: easeOut }}
                >
                  <Star key={i} size={14} fill="var(--orange)" color="var(--orange)" strokeWidth={0} />
                </motion.div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
              + parejas ya lo usan
            </span>
          </motion.div>
        </div>

        {/* Feature cards grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2, ease: easeOut }}
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
            position: 'relative',
          }}
        >
          {[
            { label: 'Planes y citas', icon: 'heart', desc: 'Organicen viajes, metas y momentos juntos.', color: 'var(--orange)' },
            { label: 'Finanzas', icon: 'wallet', desc: 'Control compartido de gastos, sin sorpresas.', color: 'var(--blue)' },
            { label: 'Galería + Chat', icon: 'camera', desc: 'Fotos y mensajes, todo en privado.', color: 'var(--done)' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 + i * 0.1, ease: easeOut }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{
                padding: '20px 20px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--card)',
                border: '1px solid var(--line-soft)',
                boxShadow: 'var(--sh-sm)',
                cursor: 'default',
                transition: 'box-shadow 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-md)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--sh-sm)' }}
            >
              <motion.div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', marginBottom: 12,
                }}
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
              >
                <Icon name={item.icon} size={18} />
              </motion.div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-ui)', marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)', lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.5 }}
        style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)', fontSize: 10,
          fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
        }}
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          scroll
        </motion.span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={14} strokeWidth={1.5} />
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── Horizontal Scroll Features Section ──────────────────
function HorizontalFeatures() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const features = [
    { icon: 'heart', title: 'Planes y citas', desc: 'Organicen salidas, viajes y metas importantes. Cada plan es un capítulo en su historia.', color: 'var(--orange)', tag: 'Planificación' },
    { icon: 'wallet', title: 'Finanzas en pareja', desc: 'Control de gastos compartidos con transparencia total. Claridad en su economía.', color: 'var(--blue)', tag: 'Finanzas' },
    { icon: 'camera', title: 'Galería de recuerdos', desc: 'Fotos y momentos que construyen su álbum compartido. Cada imagen, un recuerdo.', color: 'var(--done)', tag: 'Memorias' },
    { icon: 'chat', title: 'Chat privado', desc: 'Comuníquense sin salir de la app. Todo queda en su historia.', color: 'var(--orange)', tag: 'Mensajes' },
    { icon: 'calendar', title: 'Calendario compartido', desc: 'Sincronicen eventos y fechas importantes. Nunca olviden un plan.', color: 'var(--blue)', tag: 'Agenda' },
    { icon: 'bookOpen', title: 'Dashboard', desc: 'Visualicen su historia: racha, momentos, gastos. Todo en un vistazo.', color: 'var(--done)', tag: 'Resumen' },
  ]

  return (
    <section style={{
      padding: '100px 0 80px',
      background: 'var(--hero-bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
        backgroundImage: `radial-gradient(circle at 30% 30%, var(--orange) 0%, transparent 50%),
          radial-gradient(circle at 70% 70%, var(--blue) 0%, transparent 40%)`,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: easeOut }}
        style={{ padding: '0 28px', marginBottom: 40, color: 'var(--hero-text)', position: 'relative', zIndex: 1 }}
      >
        <div style={{
          fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--orange)', marginBottom: 10,
        }}>Todo en un solo lugar</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: 42, lineHeight: 1.02, margin: 0,
          letterSpacing: '-0.035em',
        }}>
          Lo que necesitan,{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--orange)' }}>
            donde lo necesitan
          </span>
        </h2>
      </motion.div>

      <div ref={scrollRef}
        style={{
          display: 'flex', gap: 16,
          padding: '0 28px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: 8,
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.scrollbarWidth = 'thin'; el.style.scrollbarColor = 'rgba(255,255,255,0.15) transparent' }}
        onMouseLeave={e => { e.currentTarget.style.scrollbarWidth = 'none' }}
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: easeOut }}
            whileHover={{ y: -6, transition: { duration: 0.15 } }}
            style={{
              minWidth: 300, maxWidth: 340, flex: 1,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              padding: 28,
              cursor: 'default',
              scrollSnapAlign: 'start',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            <motion.div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: f.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', marginBottom: 14,
              }}
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.4 }}
            >
              <Icon name={f.icon} size={22} />
            </motion.div>
            <div style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: f.color, marginBottom: 4,
              fontFamily: 'var(--font-ui)',
            }}>{f.tag}</div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: 20, margin: '0 0 6px', lineHeight: 1.2,
              color: 'var(--hero-text)',
            }}>{f.title}</h3>
            <p style={{
              fontSize: 14, color: 'var(--hero-soft)', lineHeight: 1.7,
              margin: 0, fontFamily: 'var(--font-ui)',
            }}>{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          textAlign: 'center', marginTop: 32,
          color: 'rgba(255,255,255,0.2)',
          fontFamily: 'var(--font-ui)', fontSize: 11,
          fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
        }}
      >
        <motion.span
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          desliza para ver más →
        </motion.span>
      </motion.div>
    </section>
  )
}

// ─── Couples Marquee ───────────────────────────────────────
const COUPLES = [
  { names: 'Mariana & Andrés', from: 'CDMX, México', months: 8 },
  { names: 'Carla & Tomás', from: 'Buenos Aires, Argentina', months: 5 },
  { names: 'Valentina & Mateo', from: 'Bogotá, Colombia', months: 12 },
  { names: 'Sofía & Benjamín', from: 'Santiago, Chile', months: 6 },
  { names: 'Camila & Sebastián', from: 'Lima, Perú', months: 10 },
  { names: 'Isabella & Gabriel', from: 'Monterrey, México', months: 4 },
  { names: 'Luciana & Emiliano', from: 'Madrid, España', months: 7 },
  { names: 'Renata & Diego', from: 'Guadalajara, México', months: 9 },
  { names: 'Ana & Pablo', from: 'Quito, Ecuador', months: 11 },
  { names: 'Elena & Martín', from: 'Medellín, Colombia', months: 6 },
  { names: 'Florencia & Nicolás', from: 'Rosario, Argentina', months: 15 },
  { names: 'Regina & Alejandro', from: 'Puebla, México', months: 3 },
]

function CouplesScrollSection() {
  const marqueeRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const x = useMotionValue(0)
  const smoothX = useSpring(x, { stiffness: 60, damping: 20 })

  useEffect(() => {
    const items = [...COUPLES, ...COUPLES, ...COUPLES]
    const totalWidth = items.length * 220
    let animationId: number
    let startTime: number | null = null

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const speed = 0.03
      const pos = -(elapsed * speed) % totalWidth
      if (!isPaused) x.set(pos)
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [x, isPaused])

  return (
    <section style={{
      padding: '100px 0',
      background: 'var(--hero-bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
        backgroundImage: `radial-gradient(circle at 20% 40%, var(--orange) 0%, transparent 50%),
          radial-gradient(circle at 80% 60%, var(--blue) 0%, transparent 40%)`,
      }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: easeOut }}
        style={{
          padding: '0 28px', marginBottom: 48, textAlign: 'center',
          position: 'relative', zIndex: 1, color: 'var(--paper)',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--orange)', marginBottom: 12,
        }}>Comunidad</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: 42, lineHeight: 1.02, margin: 0,
          letterSpacing: '-0.035em', color: 'var(--paper)',
        }}>
          Parejas que ya{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--orange)' }}>usan OurTime</span>
        </h2>
      </motion.div>

      <div ref={marqueeRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          position: 'relative', zIndex: 1,
          overflow: 'hidden', width: '100%',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
          maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)',
        }}
      >
        <motion.div style={{ x: smoothX, display: 'flex', gap: 12, width: 'max-content' }}>
          {[...COUPLES, ...COUPLES, ...COUPLES].map((c, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px 10px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
                whiteSpace: 'nowrap',
                cursor: 'default',
                transition: 'background 0.25s, border-color 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <div className="ph" style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              }} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontWeight: 600, fontSize: 14, color: 'var(--paper)',
                  fontFamily: 'var(--font-ui)',
                }}>{c.names}</div>
                <div style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-ui)',
                }}>{c.from} &middot; {c.months} meses</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Social Proof ──────────────────────────────────────────
function SocialProofSection() {
  const [counts, setCounts] = useState({ users: 0, stories: 0, plans: 0 })
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          animate(0, 500, { duration: 1.5, ease: easeOut, onUpdate: (v) => setCounts(p => ({ ...p, users: Math.round(v) })) })
          animate(0, 350, { duration: 1.5, ease: easeOut, delay: 0.1, onUpdate: (v) => setCounts(p => ({ ...p, stories: Math.round(v) })) })
          animate(0, 1200, { duration: 1.5, ease: easeOut, delay: 0.2, onUpdate: (v) => setCounts(p => ({ ...p, plans: Math.round(v) })) })
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} style={{
      padding: '60px 28px',
      borderTop: '1px solid var(--line-soft)',
      borderBottom: '1px solid var(--line-soft)',
      background: 'var(--card-2)',
    }}>
      <div style={{
        maxWidth: 900, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--orange)', lineHeight: 1.1, marginBottom: 2,
          }}>
            {counts.users.toLocaleString()}+
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: 'var(--font-ui)',
          }}>Usuarios activos</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--blue)', lineHeight: 1.1, marginBottom: 2,
          }}>
            {counts.stories.toLocaleString()}+
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: 'var(--font-ui)',
          }}>Historias creadas</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.16 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--done)', lineHeight: 1.1, marginBottom: 2,
          }}>
            {counts.plans.toLocaleString()}+
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: 'var(--font-ui)',
          }}>Planes organizados</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.16 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--done)', lineHeight: 1.1, marginBottom: 2,
          }}>
            {counts.plans.toLocaleString()}+
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: 'var(--font-ui)',
          }}>Planes organizados</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.24 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--orange)', lineHeight: 1.1, marginBottom: 2,
          }}>
            {'⭐ '}4.8
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: 'var(--font-ui)',
          }}>Valoración promedio</div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Pricing ────────────────────────────────────────────────
function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section id="precios" style={{
      padding: '100px 28px 120px',
      background: 'var(--paper)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleField />
      <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: easeOut }}
          style={{ marginBottom: 48, textAlign: 'center' }}
        >
          <div style={{
            fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--orange)', marginBottom: 8,
          }}>Planes</div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 500,
            fontSize: 42, lineHeight: 1.02, margin: '0 0 12px', letterSpacing: '-0.03em',
          }}>
            Un plan para cada<br />
            <span style={{ fontStyle: 'italic', color: 'var(--orange)' }}>historia</span>
          </h2>
          <p style={{
            fontSize: 15, color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)',
            maxWidth: 400, margin: '0 auto',
          }}>
            Empiecen gratis. Cuando quieran más, actualicen sin perder nada.
          </p>
        </motion.div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          alignItems: 'start',
        }}>
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{
                borderRadius: 'var(--r-md)',
                background: 'var(--card)',
                border: plan.popular ? `2px solid var(--orange)` : '1px solid var(--line-soft)',
                boxShadow: plan.popular ? '0 12px 40px rgba(241,119,32,0.15)' : 'var(--sh-sm)',
                overflow: 'hidden', position: 'relative',
              }}
            >
              {plan.popular && (
                <motion.div
                  initial={{ x: '-100%' }}
                  whileInView={{ x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
                  style={{
                    background: 'var(--orange)', color: '#fff',
                    textAlign: 'center', fontSize: 10, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '5px 0', fontFamily: 'var(--font-ui)',
                  }}
                >
                  Más popular
                </motion.div>
              )}

              <div style={{
                padding: plan.popular ? '32px 24px 20px' : '28px 24px 20px',
                background: 'var(--card)',
              }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', color: plan.color,
                  fontFamily: 'var(--font-ui)', marginBottom: 4,
                }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontStyle: 'italic',
                    fontSize: 32, color: plan.color, lineHeight: 1,
                  }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                    {plan.period}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, fontFamily: 'var(--font-ui)' }}>
                  {plan.desc}
                </p>
              </div>

              <div style={{ padding: '20px 24px 24px' }}>
                <MagneticButton
                  onClick={onGetStarted}
                  className={`btn ${plan.popular ? 'btn-orange' : plan.price === '$0' ? 'btn-soft' : 'btn-primary'}`}
                  style={{
                    width: '100%', fontSize: 13.5, padding: '12px 20px', marginBottom: 16,
                    ...(plan.popular ? { boxShadow: '0 6px 16px rgba(241,119,32,0.3)' } : {}),
                  }}
                >
                  {plan.cta}
                </MagneticButton>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {plan.features.map((f, fi) => (
                    <motion.div
                      key={f}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.1 + fi * 0.05, ease: easeOut }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)',
                      }}
                    >
                      <Check size={12} strokeWidth={3} style={{ color: plan.color, flexShrink: 0 }} />
                      {f}
                    </motion.div>
                  ))}
                </div>

                {plan.annual && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3, ease: easeOut }}
                    style={{
                      marginTop: 12, fontSize: 12, fontWeight: 600,
                      color: 'var(--done)', fontFamily: 'var(--font-ui)',
                      background: 'var(--done-tint)', borderRadius: 6,
                      padding: '7px 10px', textAlign: 'center',
                    }}
                  >
                    {plan.annual}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Play Store / CTA ──────────────────────────────────────
function PlayStoreSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section style={{
      padding: '100px 28px',
      background: 'var(--hero-bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08,
        backgroundImage: `radial-gradient(circle at 30% 50%, var(--orange) 0%, transparent 50%),
          radial-gradient(circle at 70% 30%, var(--blue) 0%, transparent 40%)`,
      }} />
      <ParticleField />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: easeOut }}
        style={{
          maxWidth: 640, margin: '0 auto', textAlign: 'center',
          position: 'relative', color: 'var(--hero-text)',
        }}
      >
        <motion.div
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--orange)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}
          whileHover={{ rotate: [0, -5, 5, 0] }}
        >
          <Smartphone size={26} style={{ color: '#fff' }} />
        </motion.div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: 36, lineHeight: 1.05, margin: '0 0 12px',
          letterSpacing: '-0.03em',
        }}>
          Próximamente en<br />
          <span style={{ color: 'var(--orange)' }}>Google Play Store</span>
        </h2>
        <p style={{
          fontSize: 15, color: 'var(--hero-soft)', lineHeight: 1.6,
          fontFamily: 'var(--font-ui)', maxWidth: 400, margin: '0 auto 28px',
        }}>
          La versión nativa con widgets, notificaciones y más funciones está en camino.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <MagneticButton onClick={onGetStarted} style={{
            background: '#fff', color: 'var(--ink)', fontSize: 14,
            padding: '13px 24px', borderRadius: 999, border: 'none',
            fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}>
            <Smartphone size={16} /> Notificarme
          </MagneticButton>
          <MagneticButton onClick={onGetStarted} style={{
            background: 'transparent', color: 'var(--hero-text)', fontSize: 14,
            padding: '13px 24px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,0.2)',
            fontWeight: 600, fontFamily: 'var(--font-ui)', cursor: 'pointer',
          }}>
            Usar versión web
          </MagneticButton>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Final CTA ─────────────────────────────────────────────
function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section style={{
      padding: '120px 28px',
      background: 'var(--paper)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <ParticleField />
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: easeOut }}
        style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}
      >
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: 48, lineHeight: 1.02, margin: '0 0 16px',
          letterSpacing: '-0.03em',
        }}>
          ¿Listos para escribir<br />
          <span style={{ fontStyle: 'italic', color: 'var(--orange)' }}>su próximo</span> capítulo?
        </h2>
        <p style={{
          fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.6,
          fontFamily: 'var(--font-ui)', margin: '0 auto 32px', maxWidth: 380,
        }}>
          Regístrese gratis. Sin tarjeta. Empiece a construir su historia compartida en segundos.
        </p>
        <MagneticButton onClick={onGetStarted} className="btn btn-orange" style={{
          fontSize: 17, padding: '18px 36px',
          boxShadow: '0 10px 28px rgba(241,119,32,0.3)',
        }}>
          Crear historia gratis <ArrowRight size={18} strokeWidth={2.5} />
        </MagneticButton>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.3 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            marginTop: 20, fontSize: 13, color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)',
          }}
        >
          <Check size={12} strokeWidth={3} style={{ color: 'var(--done)' }} />
          Sin compromiso. Cancela cuando quieras.
        </motion.div>
      </motion.div>
    </section>
  )
}

// ─── Footer — inspired by "wow.yes.sold." ──────────────────
function Footer({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <footer style={{
      padding: '60px 28px 32px',
      background: 'var(--hero-bg)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: `radial-gradient(circle at 50% 0%, var(--orange) 0%, transparent 50%)`,
      }} />
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        position: 'relative', textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOut }}
          style={{ marginBottom: 32 }}
        >
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 28,
            color: 'var(--hero-text)', letterSpacing: '-0.03em',
          }}>
            Our<span style={{ color: 'var(--orange)' }}>Time</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5, ease: easeOut }}
          style={{
            fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 'clamp(32px, 8vw, 72px)',
            color: 'rgba(255,255,255,0.08)',
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            cursor: 'pointer',
          }}
        >
          <motion.span
            whileHover={{ color: 'rgba(255,255,255,0.2)' }}
            style={{ transition: 'color 0.2s' }}
          >
            su.historia.
          </motion.span>
          {' '}
          <motion.span
            whileHover={{ color: 'rgba(255,255,255,0.2)' }}
            style={{ transition: 'color 0.2s' }}
          >
            compartida.
          </motion.span>
          {' '}
          <motion.span
            whileHover={{ color: 'rgba(255,255,255,0.2)' }}
            style={{ transition: 'color 0.2s' }}
          >
            organizada.
          </motion.span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5, ease: easeOut }}
          style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}
        >
          <MagneticButton onClick={onGetStarted} style={{
            background: 'var(--orange)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            padding: '14px 32px', borderRadius: 999, border: 'none',
            fontFamily: 'var(--font-ui)', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(241,119,32,0.2)',
          }}>
            Crear historia gratis
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          style={{
            marginTop: 48,
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'rgba(255,255,255,0.3)',
            display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap',
          }}
        >
          <span>&copy; {new Date().getFullYear()} OurTime</span>
          <span>Hecho con <Icon name="heart" size={10} style={{ color: 'var(--orange)', display: 'inline', verticalAlign: 'middle' }} /> para parejas</span>
        </motion.div>
      </div>
    </footer>
  )
}

// ─── Main Landing ──────────────────────────────────────────
export default function Landing({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <NavBar onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <CouplesScrollSection />
      <SocialProofSection />
      <HorizontalFeatures />
      <PricingSection onGetStarted={onGetStarted} />
      <PlayStoreSection onGetStarted={onGetStarted} />
      <CTASection onGetStarted={onGetStarted} />
      <Footer onGetStarted={onGetStarted} />
    </div>
  )
}
