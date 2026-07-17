import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

export type CurrencyKey = 'eur' | 'usd' | 'mxn' | 'cop' | 'ars' | 'bob' | 'brl' | 'gbp'

// eslint-disable-next-line react-refresh/only-export-components
export const CURRENCIES: Record<CurrencyKey, { symbol: string; name: string }> = {
  eur: { symbol: '€',  name: 'Euro (€)'              },
  usd: { symbol: '$',  name: 'Dólar USD ($)'          },
  mxn: { symbol: '$',  name: 'Peso mexicano ($)'      },
  cop: { symbol: '$',  name: 'Peso colombiano ($)'    },
  ars: { symbol: '$',  name: 'Peso argentino ($)'     },
  bob: { symbol: 'Bs', name: 'Boliviano (Bs)'         },
  brl: { symbol: 'R$', name: 'Real brasileño (R$)'    },
  gbp: { symbol: '£',  name: 'Libra esterlina (£)'    },
}

type CurrencyCtx = {
  currency: CurrencyKey
  setCurrency: (k: CurrencyKey) => void
  fmt: (n: number) => string
}

const Ctx = createContext<CurrencyCtx>({
  currency: 'eur',
  setCurrency: () => {},
  fmt: (n) => '€' + n,
})

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrency = () => useContext(Ctx)

function storyKey(storyId: string | null) {
  return storyId ? `ot_currency_${storyId}` : 'ot_currency'
}

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeStoryId } = useAuth()
  const [currency, setCurrencyState] = useState<CurrencyKey>(
    () => (localStorage.getItem(storyKey(activeStoryId)) as CurrencyKey) || 'eur'
  )

  // When story changes, load that story's saved currency
  useEffect(() => {
    const saved = localStorage.getItem(storyKey(activeStoryId)) as CurrencyKey | null
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrencyState(saved || 'eur')
  }, [activeStoryId])

  const setCurrency = (k: CurrencyKey) => {
    localStorage.setItem(storyKey(activeStoryId), k)
    setCurrencyState(k)
  }

  const fmt = (n: number) =>
    CURRENCIES[currency].symbol + Math.abs(n).toLocaleString('es', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <Ctx.Provider value={{ currency, setCurrency, fmt }}>
      {children}
    </Ctx.Provider>
  )
}
