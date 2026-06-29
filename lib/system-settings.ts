import { cache } from "react"
import { getApiBaseUrl } from "@/lib/api-base-url"

export type AboutValue = {
  title: string
  description: string
}

export type AboutTeamMember = {
  name: string
  role: string
  image_url: string
}

export type ContactInformation = {
  icon: "email" | "phone" | "map-pin" | "clock"
  title: string
  details: string[]
}

export type Currency = {
  code: string
  symbol: string
  exchange_rate: number
  is_default: boolean
}

export type CurrencyDetails = {
  code: string
  symbol: string
  symbol_position: "before" | "after" | "before_with_space"
  decimal_places: number
  thousands_separator: string
  decimal_separator: string
  available_currencies: Currency[]
}

export type SystemSettings = {
  frontend_website_name: string | null
  site_icon: string | null
  system_logo_white_url: string | null
  system_logo_black_url: string | null
  flash_deal_page_banner_large_url: string | null
  flash_deal_page_banner_small_url: string | null
  product_default_image_url: string | null
  hero_badge_text: string | null
  hero_heading: string | null
  hero_description: string | null
  about_hero_heading: string | null
  about_hero_description: string | null
  about_mission_heading: string | null
  about_mission_description: string | null
  about_mission_image_url: string | null
  about_mission_button_text: string | null
  about_mission_button_url: string | null
  about_values_heading: string | null
  about_values_subheading: string | null
  about_values: AboutValue[] | string | null
  about_team_heading: string | null
  about_team_subheading: string | null
  about_team_members: AboutTeamMember[] | string | null
  contact_information: ContactInformation[] | string | null
  currency?: CurrencyDetails | null
  show_currency_switcher?: boolean | null
}

export function parseSettingArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }

  return []
}

type SystemSettingsResponse = {
  data: SystemSettings
}

export function resolveSystemSettingUrl(value: string | null): string | null {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  const baseUrl = getApiBaseUrl()
  const normalizedPath = trimmedValue.startsWith("/") ? trimmedValue : `/${trimmedValue}`
  const storagePath = normalizedPath.startsWith("/storage/")
    ? normalizedPath
    : `/storage${normalizedPath}`
  const origin = (() => {
    try {
      return new URL(baseUrl).origin
    } catch {
      return baseUrl
    }
  })()

  return `${origin}${storagePath}`
}

export const fetchSystemSettings = cache(async (): Promise<SystemSettings | null> => {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/home/system-settings`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch system settings (${response.status})`)
  }

  const payload = (await response.json()) as SystemSettingsResponse
  return payload?.data ?? null
})
