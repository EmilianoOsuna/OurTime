const THEME_IMAGES: Record<string, string> = {
  viaje: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1000',
  salida: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000',
  cena: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000',
  cine: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1000',
  concierto: 'https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1000',
  picnic: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000',
  gaming: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000',
  otro: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=1000',
  default: 'https://images.unsplash.com/photo-1516589174184-c685266e440b?auto=format&fit=crop&q=80&w=1000'
};

export const getPlanThemeImage = (type: string | undefined): string => {
  if (!type) return THEME_IMAGES.default;
  const normalizedType = type.toLowerCase();
  return THEME_IMAGES[normalizedType] || THEME_IMAGES.default;
};
