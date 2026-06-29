export interface CustomerUser {
  id: number
  name: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  roles?: string[]
}

export type CustomerPersonalInfo = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

const TOKEN_KEY = "customer_access_token"
const TOKEN_TYPE_KEY = "customer_token_type"
const USER_KEY = "customer_user"
const PHONE_KEY = "customer_phone"

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: "", lastName: "" }

  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}

export function getCustomerPhone() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(PHONE_KEY) ?? ""
}

export function setCustomerPhone(phone: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(PHONE_KEY, phone)
}

export function getCustomerPersonalInfo(user: CustomerUser | null): CustomerPersonalInfo {
  if (!user) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: getCustomerPhone(),
    }
  }

  const fromName = splitFullName(user.name)

  return {
    firstName: user.first_name?.trim() || fromName.firstName,
    lastName: user.last_name?.trim() || fromName.lastName,
    email: user.email ?? "",
    phone: user.phone?.trim() || getCustomerPhone(),
  }
}

export function getCustomerAuth() {
  if (typeof window === "undefined") return null

  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null

  const tokenType = localStorage.getItem(TOKEN_TYPE_KEY) ?? "Bearer"
  let user: CustomerUser | null = null

  const rawUser = localStorage.getItem(USER_KEY)
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as CustomerUser
    } catch {
      user = null
    }
  }

  return { token, tokenType, user }
}

export function getCustomerUser() {
  return getCustomerAuth()?.user ?? null
}

export function isCustomerLoggedIn() {
  return Boolean(getCustomerAuth()?.token)
}

export function clearCustomerAuth() {
  if (typeof window === "undefined") return

  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_TYPE_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(PHONE_KEY)
}
