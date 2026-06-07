// data.jsx — mock content for OurTime (in Spanish)

const COUPLE = {
  since: '14 feb 2023',
  days: 1209,
  me:      { name: 'Mateo',  initial: 'M', color: '#0474BA' },
  partner: { name: 'Lucía',  initial: 'L', color: '#F17720' },
  title: 'Mateo & Lucía',
};

// category meta: icon + tone
const CATS = {
  cena:    { label: 'Gastronomía', icon: 'utensils', tone: 'orange' },
  viaje:   { label: 'Viaje',       icon: 'plane',    tone: 'blue'   },
  cine:    { label: 'Cine & Series',icon: 'film',    tone: 'orange' },
  cafe:    { label: 'Café',        icon: 'coffee',   tone: 'orange' },
  regalo:  { label: 'Regalo',      icon: 'gift',     tone: 'blue'   },
  noche:   { label: 'Noche',       icon: 'moon',     tone: 'blue'   },
  musica:  { label: 'Música',      icon: 'music',    tone: 'orange' },
  ruta:    { label: 'Aventura',    icon: 'mapRoute', tone: 'blue'   },
};

// Chapters = planes. Ordered oldest→newest; dashboard shows newest first.
const PLANS = [
  { id: 'p1', no: 1,  title: 'Primera cita en el café de la esquina', cat: 'cafe',
    date: '2023-02-14', place: 'Café Bourbon', done: true, fav: true,
    note: 'Donde todo empezó. Pedimos lo mismo sin saberlo.', cost: 18, memories: 4, by: 'Lucía' },
  { id: 'p2', no: 2,  title: 'Escapada a la costa', cat: 'viaje',
    date: '2023-06-20', place: 'Cabo de Gata', done: true, fav: true,
    note: 'Tres días sin reloj. Volveríamos mañana.', cost: 340, memories: 12, by: 'Mateo' },
  { id: 'p3', no: 3,  title: 'Maratón de cine en casa', cat: 'cine',
    date: '2023-11-04', place: 'El sofá de siempre', done: true, fav: false,
    note: 'Trilogía entera. Sobrevivimos.', cost: 24, memories: 2, by: 'Lucía' },
  { id: 'p4', no: 4,  title: 'Aniversario — cena en el mirador', cat: 'cena',
    date: '2024-02-14', place: 'Mirador del Valle', done: true, fav: true,
    note: 'Un año. Brindamos por mil más.', cost: 96, memories: 8, by: 'Mateo' },
  { id: 'p5', no: 5,  title: 'Concierto bajo las estrellas', cat: 'musica',
    date: '2024-07-12', place: 'Anfiteatro Norte', done: true, fav: false,
    note: 'Cantamos hasta quedarnos sin voz.', cost: 120, memories: 6, by: 'Lucía' },
  { id: 'p6', no: 6,  title: 'Ruta de senderismo al amanecer', cat: 'ruta',
    date: '2025-09-28', place: 'Pico Aldoroso', done: true, fav: false,
    note: 'Subimos de noche para ver salir el sol.', cost: 0, memories: 9, by: 'Mateo' },
  // upcoming
  { id: 'p7', no: 7,  title: 'Picnic en el parque botánico', cat: 'cafe',
    date: '2026-06-10', place: 'Jardín Botánico', done: false, fav: false,
    note: 'Llevar la manta de cuadros y la cámara analógica.', cost: 0, memories: 0, by: 'Lucía' },
  { id: 'p8', no: 8,  title: 'Fin de semana en la montaña', cat: 'viaje',
    date: '2026-06-21', place: 'Refugio Las Nieves', done: false, fav: false,
    note: 'Cabaña reservada. Sin cobertura, a propósito.', cost: 210, memories: 0, by: 'Mateo' },
  { id: 'p9', no: 9,  title: 'Sorpresa de cumpleaños', cat: 'regalo',
    date: '2026-07-03', place: '· secreto ·', done: false, fav: false,
    note: 'No abrir este capítulo todavía 🤫', cost: 0, memories: 0, by: 'Mateo' },
];

// Memories (gallery). tags reused for filter.
const MEMORIES = [
  { id: 'm1', title: 'Atardecer en Cabo', plan: 'p2', cat: 'viaje',  date: '2023-06-21', fav: true,  by: 'Mateo', tone: 'orange', ratio: 1.3 },
  { id: 'm2', title: 'Café de la primera cita', plan: 'p1', cat: 'cafe', date: '2023-02-14', fav: true, by: 'Lucía', tone: 'orange', ratio: 1 },
  { id: 'm3', title: 'Sendero al amanecer', plan: 'p6', cat: 'ruta', date: '2025-09-28', fav: false, by: 'Mateo', tone: 'blue', ratio: 1.5 },
  { id: 'm4', title: 'Brindis del aniversario', plan: 'p4', cat: 'cena', date: '2024-02-14', fav: true, by: 'Lucía', tone: 'orange', ratio: 1 },
  { id: 'm5', title: 'Luces del concierto', plan: 'p5', cat: 'musica', date: '2024-07-12', fav: false, by: 'Mateo', tone: 'blue', ratio: 1.3 },
  { id: 'm6', title: 'Olas al amanecer', plan: 'p2', cat: 'viaje', date: '2023-06-22', fav: false, by: 'Lucía', tone: 'blue', ratio: 1 },
  { id: 'm7', title: 'Palomitas y manta', plan: 'p3', cat: 'cine', date: '2023-11-04', fav: false, by: 'Mateo', tone: 'orange', ratio: 1.5 },
  { id: 'm8', title: 'La cima', plan: 'p6', cat: 'ruta', date: '2025-09-28', fav: true, by: 'Lucía', tone: 'blue', ratio: 1.3 },
  { id: 'm9', title: 'Mesa del mirador', plan: 'p4', cat: 'cena', date: '2024-02-14', fav: false, by: 'Mateo', tone: 'orange', ratio: 1 },
];

// Finances — a shared "fondo común"
const TX = [
  { id: 't1', kind: 'in',  label: 'Aporte mensual · Mateo', cat: 'aporte', amt: 200, date: '2026-06-01', who: 'Mateo', plan: null },
  { id: 't2', kind: 'in',  label: 'Aporte mensual · Lucía', cat: 'aporte', amt: 200, date: '2026-06-01', who: 'Lucía', plan: null },
  { id: 't3', kind: 'out', label: 'Reserva refugio montaña', cat: 'viaje', amt: 210, date: '2026-06-05', who: 'Mateo', plan: 'p8' },
  { id: 't4', kind: 'out', label: 'Entradas concierto', cat: 'cine', amt: 120, date: '2024-07-10', who: 'Lucía', plan: 'p5' },
  { id: 't5', kind: 'in',  label: 'Reembolso cena', cat: 'otro', amt: 48, date: '2026-05-28', who: 'Lucía', plan: 'p4' },
  { id: 't6', kind: 'out', label: 'Cámara analógica', cat: 'regalo', amt: 85, date: '2026-05-20', who: 'Mateo', plan: 'p7' },
];

const TX_CATS_OUT = [
  { id: 'cena',   label: 'Gastronomía', icon: 'utensils' },
  { id: 'viaje',  label: 'Viajes',      icon: 'plane' },
  { id: 'cine',   label: 'Ocio',        icon: 'film' },
  { id: 'regalo', label: 'Regalos',     icon: 'gift' },
  { id: 'casa',   label: 'Hogar',       icon: 'home' },
  { id: 'otro',   label: 'Otros',       icon: 'tag' },
];
const TX_CATS_IN = [
  { id: 'aporte', label: 'Aporte al fondo', icon: 'wallet' },
  { id: 'regalo', label: 'Regalo recibido', icon: 'gift' },
  { id: 'otro',   label: 'Otros ingresos',  icon: 'trendUp' },
];

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESES_L = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS = ['L','M','X','J','V','S','D'];

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}
function eur(n) { return '€' + n.toLocaleString('es-ES'); }

Object.assign(window, {
  COUPLE, CATS, PLANS, MEMORIES, TX, TX_CATS_OUT, TX_CATS_IN,
  MESES, MESES_L, DIAS, fmtDate, fmtDateShort, eur,
});
