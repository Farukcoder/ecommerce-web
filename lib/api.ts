export type Category = {
  id: number
  name: string
  slug: string
  image: string | null
}

export type Brand = {
  id: number
  name: string
  slug: string
  logo: string | null
}

import type { Product } from "@/lib/store-context"
import { getApiBaseUrl } from "@/lib/api-base-url"

const normalizeProduct = (product: Product): Product => {
  if (typeof product.productId === "number" && Number.isFinite(product.productId)) {
    return product
  }

  const parsedId = Number(product.id)
  return Number.isFinite(parsedId) ? { ...product, productId: parsedId } : product
}

const sortByNewest = (products: Product[]) =>
  [...products].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0
    const bTime = b.created_at ? Date.parse(b.created_at) : 0
    return bTime - aTime
  })

export function getNewArrivalProducts(products: Product[], limit?: number): Product[] {
  const withNewBadge = products.filter((product) => product.badge === "new")
  const result = withNewBadge.length > 0 ? withNewBadge : sortByNewest(products)

  return typeof limit === "number" ? result.slice(0, limit) : result
}

type CategoriesResponse = {
  data: Category[]
}

type BrandsResponse = {
  data: Brand[]
}

type ProductsResponse = {
  data: Product[]
}

type ProductResponse = {
  data: Product
}

export type ProductFilters = {
  search?: string
  category?: string
  brand?: string
  badge?: string
  featured?: boolean
  page?: number
  perPage?: number
}

export async function fetchCategories(): Promise<Category[]> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/home/categories`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch categories (${response.status})`)
  }

  const payload = (await response.json()) as CategoriesResponse
  return Array.isArray(payload.data) ? payload.data : []
}

export async function fetchBrands(): Promise<Brand[]> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/home/brands`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch brands (${response.status})`)
  }

  const payload = (await response.json()) as BrandsResponse
  return Array.isArray(payload.data) ? payload.data : []
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const baseUrl = getApiBaseUrl()
  const searchParams = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return
    }

    searchParams.set(key === "perPage" ? "per_page" : key, String(value))
  })

  const queryString = searchParams.toString()
  const response = await fetch(
    `${baseUrl}/api/home/products${queryString ? `?${queryString}` : ""}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch products (${response.status})`)
  }

  const payload = (await response.json()) as ProductsResponse
  return Array.isArray(payload.data) ? payload.data.map(normalizeProduct) : []
}

export async function fetchProduct(productId: string): Promise<Product | null> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/home/products/${productId}`, {
    cache: "no-store",
  })

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch product (${response.status})`)
  }

  const payload = (await response.json()) as ProductResponse
  return payload.data ? normalizeProduct(payload.data) : null
}

export interface ProductReview {
  id: number
  user_id: number
  product_id: number
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
  }
}

export interface PaginatedProductReviews {
  current_page: number
  data: ProductReview[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export async function fetchProductReviews(
  productId: string,
  page = 1
): Promise<PaginatedProductReviews> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(
    `${baseUrl}/api/home/products/${productId}/reviews?page=${page}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch product reviews (${response.status})`)
  }

  return (await response.json()) as PaginatedProductReviews
}

export type ContactUsPayload = {
  name: string
  email: string
  phone: string
  message: string
}

export type ContactUsResponse = {
  message: string
}

export async function submitContactUs(payload: ContactUsPayload): Promise<ContactUsResponse> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/home/contact-us`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const errData = data as { message?: string; errors?: Record<string, string[]> } | null
    const firstFieldError = errData?.errors
      ? Object.values(errData.errors).flat()[0]
      : undefined
    throw new Error(String(errData?.message || firstFieldError || "Failed to send message."))
  }

  const successData = data as ContactUsResponse | null
  if (!successData?.message) {
    throw new Error("Failed to send message.")
  }

  return successData
}

export type SupportTicketSubject = {
  value: string
  label: string
}

export type SupportTicketPayload = {
  name: string
  email: string
  phone?: string
  subject: string
  order_number?: string
  message: string
}

export type SupportTicketResponse = {
  message: string
  data: {
    id: number
    ticket_number: string
    status: string
    created_at: string
  }
}

type SupportTicketSubjectsResponse = {
  data: SupportTicketSubject[]
}

export async function fetchSupportTicketSubjects(): Promise<SupportTicketSubject[]> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/home/support-tickets/subjects`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch support ticket subjects (${response.status})`)
  }

  const payload = (await response.json()) as SupportTicketSubjectsResponse
  return Array.isArray(payload.data) ? payload.data : []
}

export async function submitSupportTicket(
  payload: SupportTicketPayload
): Promise<SupportTicketResponse> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/home/support-tickets`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const errData = data as { message?: string; errors?: Record<string, string[]> } | null
    const firstFieldError = errData?.errors
      ? Object.values(errData.errors).flat()[0]
      : undefined
    throw new Error(String(errData?.message || firstFieldError || "Failed to send message."))
  }

  const successData = data as SupportTicketResponse | null
  if (!successData || !successData.data) {
    throw new Error("Failed to send message.")
  }

  return successData
}
