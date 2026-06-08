import {
  Home, Calendar, Images, Wallet, Plus, Heart, Check, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronDown, ArrowRight, X, Search,
  MapPin, Clock, Sparkles, Bell, Share2, Copy, Camera,
  TrendingUp, TrendingDown, Utensils, Plane, Gift, Coffee, Film,
  Moon, Music, Pencil, Trash2, MoreHorizontal, BookOpen, Feather,
  Route, Tag, Wifi, Users, Settings, LogOut, Star,
  MessageSquare, Send, ArrowLeft, CalendarCheck,
  type LucideProps,
} from 'lucide-react'

type IconComponent = React.FC<LucideProps>

const ICONS: Record<string, IconComponent> = {
  home:         Home,
  calendar:     Calendar,
  image:        Images,
  wallet:       Wallet,
  plus:         Plus,
  heart:        Heart,
  check:        Check,
  checkCircle:  CheckCircle2,
  chevL:        ChevronLeft,
  chevR:        ChevronRight,
  chevD:        ChevronDown,
  arrowR:       ArrowRight,
  arrowL:       ArrowLeft,
  x:            X,
  search:       Search,
  pin:          MapPin,
  clock:        Clock,
  sparkle:      Sparkles,
  bell:         Bell,
  share:        Share2,
  copy:         Copy,
  camera:       Camera,
  trendUp:      TrendingUp,
  trendDown:    TrendingDown,
  utensils:     Utensils,
  plane:        Plane,
  gift:         Gift,
  coffee:       Coffee,
  film:         Film,
  moon:         Moon,
  music:        Music,
  edit:         Pencil,
  trash:        Trash2,
  more:         MoreHorizontal,
  bookOpen:     BookOpen,
  feather:      Feather,
  mapRoute:     Route,
  tag:          Tag,
  wifi:         Wifi,
  users:        Users,
  settings:     Settings,
  logout:       LogOut,
  star:         Star,
  chat:         MessageSquare,
  send:         Send,
  calendarCheck: CalendarCheck,
}

// googleCal stays as a custom SVG — no Lucide equivalent
function GoogleCalIcon({ size, style, className }: { size: number; style?: React.CSSProperties; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, ...style }}>
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <path d="M3 9h18M8 2v4M16 2v4" />
      <path d="M8 13h2v3H8z" fill="currentColor" stroke="none" opacity=".5" />
      <path d="M12.5 13.5h3v2h-3z" fill="currentColor" stroke="none" opacity=".5" />
    </svg>
  )
}

export function Icon({ name, size = 22, stroke = 2, className = '', style = {} }: {
  name: string
  size?: number
  stroke?: number
  className?: string
  style?: React.CSSProperties
}) {
  if (name === 'googleCal') return <GoogleCalIcon size={size} style={style} className={className} />

  // heartFill → Heart with fill
  if (name === 'heartFill') {
    return (
      <Heart
        size={size}
        strokeWidth={0}
        fill="currentColor"
        className={className}
        style={{ flexShrink: 0, ...style }}
      />
    )
  }

  const Comp = ICONS[name]
  if (!Comp) return null

  return (
    <Comp
      size={size}
      strokeWidth={stroke}
      className={className}
      style={{ flexShrink: 0, ...style }}
    />
  )
}
