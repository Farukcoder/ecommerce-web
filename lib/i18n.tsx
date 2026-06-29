"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getApiBaseUrl } from "./api-base-url"
import en from "../locales/en.json"
import bn from "../locales/bn.json"

type Translations = Record<string, string>

// Bundled translations (always available, no network fetch needed)
const BUNDLED: Record<string, Translations> = {
  en,
  bn,
}

// Runtime cache for dynamically fetched locales
const dynamicCache: Record<string, Translations> = {}

async function loadLocale(code: string): Promise<Translations | null> {
  // Already bundled
  if (BUNDLED[code]) return BUNDLED[code]
  // Already fetched and cached
  if (dynamicCache[code]) return dynamicCache[code]
  // Fetch dynamically from public/locales or locales folder via Next.js public route
  try {
    const res = await fetch(`/locales/${code}.json`, { cache: "no-store" })
    if (!res.ok) return null
    const data = (await res.json()) as Translations
    dynamicCache[code] = data
    return data
  } catch {
    return null
  }
}

type I18nContextValue = {
  locale: string
  setLocale: (l: string) => void
  t: (key: string, vars?: Record<string, string>) => string
  availableLocales: { code: string; name: string }[]
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>("en")
  const [translations, setTranslations] = useState<Translations>(BUNDLED["en"])
  const [availableLocales, setAvailableLocales] = useState<{ code: string; name: string }[]>([
    { code: "en", name: "English" },
    { code: "bn", name: "Bangla" },
  ])

  // Apply a locale: load translations if needed, then update state
  const applyLocale = async (code: string) => {
    const data = await loadLocale(code)
    if (data) {
      setTranslations(data)
      setLocaleState(code)
    }
  }

  useEffect(() => {
    const init = async () => {
      // 1. Check localStorage first (user's explicit preference)
      const saved = typeof window !== "undefined" ? localStorage.getItem("locale") : null
      if (saved) {
        await applyLocale(saved)
        // Still fetch system settings to update available locales list
        fetchSystemLocaleSettings().catch(() => undefined)
        return
      }

      // 2. Fetch system settings to get default_locale + available_locales
      await fetchSystemLocaleSettings()
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSystemLocaleSettings = async () => {
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/home/system-settings`, { cache: "no-store" })
      if (!res.ok) return
      const payload = await res.json()
      const default_locale: string | undefined = payload?.data?.default_locale
      const locales: { code: string; name: string }[] = payload?.data?.available_locales ?? []

      // Update the available locales list from server
      if (Array.isArray(locales) && locales.length > 0) {
        setAvailableLocales(locales.map((l) => ({ code: l.code, name: l.name })))
      }

      // Apply default locale from server (only if user hasn't chosen one)
      const saved = typeof window !== "undefined" ? localStorage.getItem("locale") : null
      if (!saved && default_locale) {
        await applyLocale(default_locale)
      } else if (!saved) {
        // Fallback: browser language
        const nav = navigator.language?.split("-")[0]
        if (nav) await applyLocale(nav)
      }
    } catch {
      // ignore — stay with default en
    }
  }

  const setLocale = async (code: string) => {
    await applyLocale(code)
    try {
      localStorage.setItem("locale", code)
    } catch {
      // ignore
    }
  }

  /** Translate a key, with optional variable interpolation e.g. t("join_community", { name: "DEMO" }) */
  const t = (key: string, vars?: Record<string, string>): string => {
    let str = translations[key] ?? BUNDLED["en"][key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v)
      })
    }
    return str
  }

  const value = useMemo(
    () => ({ locale, setLocale, t, availableLocales }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, translations, availableLocales]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useTranslation must be used within I18nProvider")
  }
  return ctx
}
