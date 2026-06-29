"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type SystemSettings, type Currency, type CurrencyDetails } from "./system-settings"

export const DEFAULT_CURRENCY_CONFIG: CurrencyDetails = {
  code: "BDT",
  symbol: "৳",
  symbol_position: "before",
  decimal_places: 2,
  thousands_separator: ",",
  decimal_separator: ".",
  available_currencies: [
    { code: "BDT", symbol: "৳", exchange_rate: 1, is_default: true }
  ]
}

interface CurrencyContextType {
  currentCurrency: Currency
  availableCurrencies: Currency[]
  showCurrencySwitcher: boolean
  setCurrency: (code: string) => void
  formatPrice: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({
  children,
  systemSettings,
}: {
  children: ReactNode
  systemSettings?: SystemSettings | null
}) {
  const currencySettings = systemSettings?.currency || DEFAULT_CURRENCY_CONFIG
  const showCurrencySwitcher = systemSettings?.show_currency_switcher ?? false

  const defaultCurrency = currencySettings.available_currencies.find(c => c.is_default) || {
    code: currencySettings.code,
    symbol: currencySettings.symbol,
    exchange_rate: 1,
    is_default: true
  }

  const [currentCurrency, setCurrentCurrency] = useState<Currency>(defaultCurrency)

  // Initialize selected currency on the client
  useEffect(() => {
    const saved = localStorage.getItem("selected_currency_code")
    if (saved) {
      const match = currencySettings.available_currencies.find(c => c.code === saved)
      if (match) {
        setCurrentCurrency(match)
      }
    }
  }, [currencySettings.available_currencies])

  const setCurrency = (code: string) => {
    const match = currencySettings.available_currencies.find(c => c.code === code)
    if (match) {
      setCurrentCurrency(match)
      localStorage.setItem("selected_currency_code", code)
    }
  }

  const formatPrice = (amount: number) => {
    const converted = amount * currentCurrency.exchange_rate

    // Manual formatting based on dynamic separators
    const fixed = converted.toFixed(currencySettings.decimal_places)
    const parts = fixed.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencySettings.thousands_separator)
    const formattedNum = parts.join(currencySettings.decimal_separator)

    const symbol = currentCurrency.symbol
    const position = currencySettings.symbol_position

    if (position === "after") {
      return `${formattedNum}${symbol}`
    } else if (position === "before_with_space") {
      return `${symbol} ${formattedNum}`
    } else {
      return `${symbol}${formattedNum}`
    }
  }

  return React.createElement(
    CurrencyContext.Provider,
    {
      value: {
        currentCurrency,
        availableCurrencies: currencySettings.available_currencies,
        showCurrencySwitcher,
        setCurrency,
        formatPrice,
      },
    },
    children
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

// Fallback formatPrice function for backward compatibility and server components
export function formatPrice(amount: number): string {
  const converted = amount
  const fixed = converted.toFixed(2)
  const parts = fixed.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const formattedNum = parts.join(".")
  return `৳${formattedNum}`
}
