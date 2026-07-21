import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import { encodeCardLinks, cardUrlTransform } from '../chatCards'

// Renderiza un mensaje de la IA igual que Chat.tsx y devuelve los href resultantes
function hrefs(md: string): string[] {
  const { container } = render(
    <ReactMarkdown urlTransform={cardUrlTransform}>{encodeCardLinks(md)}</ReactMarkdown>,
  )
  return Array.from(container.querySelectorAll('a')).map(a => a.getAttribute('href') ?? '')
}

describe('tarjetas del chat IA (map:/plan:)', () => {
  it('convierte en <a> un link plan: con espacios, pipes y "+" (caso real 2026-07-18)', () => {
    const msg = '[PLAN: Cena de sushi + paseo por Plaza Murillo](plan:Cena de sushi + paseo por Plaza Murillo|2026-07-20|Sushi House, La Paz|250|cena)'
    const [href] = hrefs(msg)
    expect(href).toBeDefined()
    expect(href.startsWith('plan:')).toBe(true)
    expect(decodeURIComponent(href.replace('plan:', '')).split('|')).toEqual(
      ['Cena de sushi + paseo por Plaza Murillo', '2026-07-20', 'Sushi House, La Paz', '250', 'cena'],
    )
  })

  it('convierte en <a> un link map: con espacios y coma', () => {
    const [href] = hrefs('Te recomiendo [MAP: Pujol, CDMX](map:Pujol, CDMX)')
    expect(href).toBe(`map:${encodeURIComponent('Pujol, CDMX')}`)
  })

  it('deja pasar links https normales por el filtro estándar', () => {
    expect(hrefs('Jueguen en [WEB: Skribbl](https://skribbl.io)')).toEqual(['https://skribbl.io'])
  })

  it('campos vacíos del plan conservan los separadores', () => {
    const [href] = hrefs('[PLAN: Picnic](plan:Picnic||||)')
    expect(decodeURIComponent(href.replace('plan:', '')).split('|')).toEqual(['Picnic', '', '', '', ''])
  })
})
