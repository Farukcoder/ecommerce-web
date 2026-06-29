import { getApiBaseUrl } from "./api-base-url"
import { getCustomerAuth } from "./customer-auth"

export type CustomerAddress = {
  id: string | number
  title: string
  name: string
  phone: string
  email: string
  address: string
  division_id?: number | null
  district_id?: number | null
  upazila_id?: number | null
  union_id?: number | null
  city: string
  division: string
  zip: string
  country: string
  isDefault: boolean

  // Relational objects loaded from API
  division_relation?: { id: number; name: string; bn_name: string } | null
  district_relation?: { id: number; name: string; bn_name: string } | null
  upazila_relation?: { id: number; name: string; bn_name: string } | null
  union_relation?: { id: number; name: string; bn_name: string } | null
}

export type ShippingFormFields = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  area: string
  city: string
  state: string
  zip: string
  country: string
  note: string
  divisionId?: string
  districtId?: string
  upazilaId?: string
  unionId?: string
}

// Location types
export type Division = {
  id: number
  name: string
  bn_name: string
}

export type District = {
  id: number
  division_id: number
  name: string
  bn_name: string
}

export type Upazila = {
  id: number
  district_id: number
  name: string
  bn_name: string
}

export type Union = {
  id: number
  upazila_id: number
  name: string
  bn_name: string
}

const STORAGE_KEY = "customer_addresses"

export const DEFAULT_CUSTOMER_ADDRESSES: CustomerAddress[] = [
  {
    id: "1",
    title: "Home Address",
    name: "John Doe",
    phone: "+880 1712-345678",
    email: "john.doe@example.com",
    address: "House 12, Road 5, Dhanmondi",
    city: "Dhaka",
    division: "Dhaka",
    zip: "1209",
    country: "Bangladesh",
    isDefault: true,
  },
  {
    id: "2",
    title: "Office Address",
    name: "John Doe",
    phone: "+880 1912-876543",
    email: "john.office@example.com",
    address: "Level 4, SEL Rose N Dale, 116 Kazi Nazrul Islam Ave",
    city: "Dhaka",
    division: "Dhaka",
    zip: "1000",
    country: "Bangladesh",
    isDefault: false,
  },
]

// Fallback localStorage implementation for non-logged in state (if any)
export function getCustomerAddresses(): CustomerAddress[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored) as CustomerAddress[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomerAddresses(addresses: CustomerAddress[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses))
}

export function getDefaultCustomerAddress(addresses: CustomerAddress[]): CustomerAddress | null {
  if (addresses.length === 0) return null
  return addresses.find((address) => address.isDefault) ?? addresses[0]
}

export type ShippingLocationFields = Pick<
  ShippingFormFields,
  "address" | "area" | "city" | "state" | "zip" | "country" | "divisionId" | "districtId" | "upazilaId" | "unionId"
>

export function addressToLocationFields(address: CustomerAddress): ShippingLocationFields {
  // Concatenate upazila and union names into area/apartment field if they exist
  let areaText = ""
  if (address.union_relation || address.upazila_relation) {
    const parts = [
      address.union_relation?.name || "",
      address.upazila_relation?.name || ""
    ].filter(Boolean)
    areaText = parts.join(", ")
  }

  return {
    address: address.address,
    area: areaText,
    city: address.city,
    state: address.division,
    zip: address.zip,
    country: address.country,
    divisionId: address.division_id ? String(address.division_id) : "",
    districtId: address.district_id ? String(address.district_id) : "",
    upazilaId: address.upazila_id ? String(address.upazila_id) : "",
    unionId: address.union_id ? String(address.union_id) : "",
  }
}

export function emptyShippingForm(): ShippingFormFields {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    area: "",
    city: "",
    state: "",
    zip: "",
    country: "Bangladesh",
    note: "",
    divisionId: "",
    districtId: "",
    upazilaId: "",
    unionId: "",
  }
}

function getAuthHeaders() {
  const auth = getCustomerAuth()
  if (!auth?.token) {
    return {}
  }
  return {
    Authorization: `${auth.tokenType} ${auth.token}`,
  }
}

// Location Dropdowns Fetch Services
export async function fetchDivisions(): Promise<Division[]> {
  const baseUrl = getApiBaseUrl()
  const res = await fetch(`${baseUrl}/api/home/divisions`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch divisions")
  const json = await res.json()
  return json.data || []
}

export async function fetchDistricts(divisionId?: number): Promise<District[]> {
  const baseUrl = getApiBaseUrl()
  const url = divisionId
    ? `${baseUrl}/api/home/districts?division_id=${divisionId}`
    : `${baseUrl}/api/home/districts`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch districts")
  const json = await res.json()
  return json.data || []
}

export async function fetchUpazilas(districtId?: number): Promise<Upazila[]> {
  const baseUrl = getApiBaseUrl()
  const url = districtId
    ? `${baseUrl}/api/home/upazilas?district_id=${districtId}`
    : `${baseUrl}/api/home/upazilas`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch upazilas")
  const json = await res.json()
  return json.data || []
}

export async function fetchUnions(upazilaId?: number): Promise<Union[]> {
  const baseUrl = getApiBaseUrl()
  const url = upazilaId
    ? `${baseUrl}/api/home/unions?upazila_id=${upazilaId}`
    : `${baseUrl}/api/home/unions`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch unions")
  const json = await res.json()
  return json.data || []
}

// Database-backed Customer Address Operations
export async function fetchCustomerAddressesApi(): Promise<CustomerAddress[]> {
  const baseUrl = getApiBaseUrl()
  const headers = getAuthHeaders()
  const res = await fetch(`${baseUrl}/api/customer/addresses`, {
    headers: {
      Accept: "application/json",
      ...headers,
    },
    cache: "no-store",
  })
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Unauthorized: Please sign in.")
    }
    throw new Error("Failed to fetch customer addresses")
  }
  const json = await res.json()
  const rawData = json.data || []
  return rawData.map(mapApiAddressToCustomerAddress)
}

export async function createCustomerAddressApi(
  address: Omit<CustomerAddress, "id" | "isDefault" | "division" | "city"> & { is_default?: boolean }
): Promise<CustomerAddress> {
  const baseUrl = getApiBaseUrl()
  const headers = getAuthHeaders()
  const res = await fetch(`${baseUrl}/api/customer/addresses`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(address),
  })
  const json = await res.json()
  if (!res.ok) {
    const errorMsg = json.message || "Failed to create address"
    throw new Error(errorMsg)
  }
  return mapApiAddressToCustomerAddress(json.data)
}

export async function updateCustomerAddressApi(
  id: string | number,
  address: Omit<CustomerAddress, "id" | "isDefault" | "division" | "city"> & { is_default?: boolean }
): Promise<CustomerAddress> {
  const baseUrl = getApiBaseUrl()
  const headers = getAuthHeaders()
  const res = await fetch(`${baseUrl}/api/customer/addresses/${id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(address),
  })
  const json = await res.json()
  if (!res.ok) {
    const errorMsg = json.message || "Failed to update address"
    throw new Error(errorMsg)
  }
  return mapApiAddressToCustomerAddress(json.data)
}

export async function deleteCustomerAddressApi(id: string | number): Promise<void> {
  const baseUrl = getApiBaseUrl()
  const headers = getAuthHeaders()
  const res = await fetch(`${baseUrl}/api/customer/addresses/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...headers,
    },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const errorMsg = json.message || "Failed to delete address"
    throw new Error(errorMsg)
  }
}

export async function setDefaultCustomerAddressApi(id: string | number): Promise<void> {
  const baseUrl = getApiBaseUrl()
  const headers = getAuthHeaders()
  const res = await fetch(`${baseUrl}/api/customer/addresses/${id}/default`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      ...headers,
    },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    const errorMsg = json.message || "Failed to set default address"
    throw new Error(errorMsg)
  }
}

function mapApiAddressToCustomerAddress(apiAddr: any): CustomerAddress {
  return {
    id: apiAddr.id,
    title: apiAddr.title,
    name: apiAddr.name,
    phone: apiAddr.phone,
    email: apiAddr.email || "",
    address: apiAddr.address,
    division_id: apiAddr.division_id,
    district_id: apiAddr.district_id,
    upazila_id: apiAddr.upazila_id,
    union_id: apiAddr.union_id,
    city: apiAddr.district ? apiAddr.district.name : (apiAddr.city || ""),
    division: apiAddr.division ? apiAddr.division.name : (apiAddr.division || ""),
    zip: apiAddr.zip || "",
    country: apiAddr.country || "Bangladesh",
    isDefault: !!apiAddr.is_default,
    division_relation: apiAddr.division,
    district_relation: apiAddr.district,
    upazila_relation: apiAddr.upazila,
    union_relation: apiAddr.union,
  }
}
