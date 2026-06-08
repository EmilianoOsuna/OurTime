// Icon — SVG paths exactos del handoff Claude Design
// Lucide-style stroke icons

const ICON_PATHS: Record<string, React.ReactNode> = {
  home:      <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9.5 21v-6h5v6"/></>,
  calendar:  <><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></>,
  image:     <><rect x="3" y="3.5" width="18" height="17" rx="3"/><circle cx="8.5" cy="9" r="1.6"/><path d="M21 15l-5-4.5L5 20.5"/></>,
  wallet:    <><path d="M3 7a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v0"/><path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H4"/><circle cx="17" cy="13" r="1.2" fill="currentColor" stroke="none"/></>,
  plus:      <><path d="M12 5v14M5 12h14"/></>,
  heart:     <><path d="M12 20s-7-4.6-9.3-9.2C1.2 8 2.4 4.8 5.5 4.4c1.9-.2 3.5.9 4.5 2.3 1-1.4 2.6-2.5 4.5-2.3 3.1.4 4.3 3.6 2.8 6.4C19 15.4 12 20 12 20Z"/></>,
  heartFill: <><path d="M12 20s-7-4.6-9.3-9.2C1.2 8 2.4 4.8 5.5 4.4c1.9-.2 3.5.9 4.5 2.3 1-1.4 2.6-2.5 4.5-2.3 3.1.4 4.3 3.6 2.8 6.4C19 15.4 12 20 12 20Z" fill="currentColor" stroke="none"/></>,
  check:     <><path d="M4 12.5 9.5 18 20 6.5"/></>,
  checkCircle: <><circle cx="12" cy="12" r="9"/><path d="M8 12.2 11 15.2 16.2 9"/></>,
  chevL:     <><path d="M15 5 8 12l7 7"/></>,
  chevR:     <><path d="M9 5l7 7-7 7"/></>,
  chevD:     <><path d="M5 9l7 7 7-7"/></>,
  arrowR:    <><path d="M4 12h15M13 6l6 6-6 6"/></>,
  x:         <><path d="M6 6l12 12M18 6 6 18"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></>,
  pin:       <><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></>,
  clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></>,
  sparkle:   <><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3Z"/><path d="M18.5 16l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7Z"/></>,
  bell:      <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
  share:     <><circle cx="6" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6"/></>,
  copy:      <><rect x="9" y="9" width="12" height="12" rx="2.5"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></>,
  camera:    <><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="12.5" r="3.4"/></>,
  trendUp:   <><path d="M3 17 9.5 10.5l3.5 3.5L21 6"/><path d="M16 6h5v5"/></>,
  trendDown: <><path d="M3 7 9.5 13.5l3.5-3.5L21 18"/><path d="M16 18h5v-5"/></>,
  utensils:  <><path d="M5 3v7a2 2 0 0 0 4 0V3M7 11v10"/><path d="M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5Zm0 9v9"/></>,
  plane:     <><path d="M12 3c1 0 1.5 1 1.5 2.5V9l7 4v2l-7-2v4l2 1.5V20l-3.5-1L9 20v-1.5L11 17v-4l-7 2v-2l7-4V5.5C11 4 11 3 12 3Z"/></>,
  gift:      <><rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 13h17M12 9v11"/><path d="M12 9S10.5 4 8 4 6 7 12 9Zm0 0s1.5-5 4-5 2 3-4 5Z"/></>,
  coffee:    <><path d="M4 9h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z"/><path d="M16 10h2.5a2.5 2.5 0 0 1 0 5H16"/><path d="M7 3v2M10.5 3v2"/></>,
  film:      <><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M3 15h18M8 4v16M16 4v16"/></>,
  moon:      <><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"/></>,
  music:     <><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></>,
  edit:      <><path d="M4 20h4l10.5-10.5a2 2 0 0 0-2.8-2.8L5 17v3Z"/><path d="M13.5 6.5 17.5 10.5"/></>,
  trash:     <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></>,
  more:      <><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></>,
  bookOpen:  <><path d="M12 6S10 4 4 4v14c6 0 8 2 8 2s2-2 8-2V4c-6 0-8 2-8 2Z"/><path d="M12 6v14"/></>,
  feather:   <><path d="M20 4C14 4 8 7 6 13l-2 7 7-2c6-2 9-8 9-14Z"/><path d="M16 8 7 17M14 10H9"/></>,
  mapRoute:  <><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.5"/></>,
  tag:       <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" transform="translate(-1 0)"/><circle cx="7.5" cy="7.5" r="1.3"/></>,
  wifi:      <><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0"/><circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none"/></>,
  users:     <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M16.5 14.6A5.5 5.5 0 0 1 20.5 20"/></>,
  settings:  <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2 2M7 17l-2 2M19 19l-2-2M7 7 5 5"/></>,
  logout:    <><path d="M14 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8"/><path d="M18 16l4-4-4-4M9 12h13"/></>,
  star:      <><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/></>,
  chat:      <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  send:      <><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></>,
  googleCal: <><rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M3 9h18M8 2v4M16 2v4"/><path d="M8 13h2v3H8z" fill="currentColor" stroke="none" opacity=".5"/><path d="M12.5 13.5h3v2h-3z" fill="currentColor" stroke="none" opacity=".5"/></>,
}

export function Icon({ name, size = 22, stroke = 2, className = '', style = {} }: {
  name: string; size?: number; stroke?: number; className?: string; style?: React.CSSProperties
}) {
  const p = ICON_PATHS[name]
  if (!p) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0, ...style }}>
      {p}
    </svg>
  )
}
