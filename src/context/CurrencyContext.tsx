import React, { createContext, useContext, useState } from 'react'

export type CurrencyKey = 'eur' | 'usd' | 'mxn' | 'cop' | 'ars' | 'bob' | 'brl' | 'gbp'

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

export const useCurrency = () => useContext(Ctx)

const STORAGE_KEY = 'ot_currency'

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyKey>(
    () => (localStorage.getItem(STORAGE_KEY) as CurrencyKey) || 'eur'
  )

  const setCurrency = (k: CurrencyKey) => {
    localStorage.setItem(STORAGE_KEY, k)
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
