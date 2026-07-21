import { defaultUrlTransform } from 'react-markdown'

// Los destinos map:/plan: del modelo traen espacios ("map:Pujol, CDMX") y
// CommonMark no acepta destinos con espacios, así que el link no se parseaba y
// salía como texto plano. Se codifica el destino para que ReactMarkdown lo
// convierta en <a>.
export function encodeCardLinks(text: string): string {
  return text.replace(/\]\((map|plan):([^)]*)\)/g, (_m, proto: string, data: string) => `](${proto}:${encodeURIComponent(data.trim())})`)
}

// react-markdown descarta protocolos desconocidos como map:/plan: por seguridad;
// se permiten explícitamente solo esos y el resto pasa por el filtro estándar.
export function cardUrlTransform(url: string): string {
  return url.startsWith('map:') || url.startsWith('plan:') ? url : defaultUrlTransform(url)
}
