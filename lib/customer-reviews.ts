import { getApiBaseUrl } from "@/lib/api-base-url"
import { getCustomerAuth } from "@/lib/customer-auth"

export interface ProductDetails {
  id: number
  name: string
  thumbnail: string | null
}

export interface BackendReview {
  id: number
  user_id: number
  product_id: number
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  product?: ProductDetails
}

export interface PaginatedReviews {
  current_page: number
  data: BackendReview[]
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

export interface PendingReview {
  product_id: number
  name: string
  order_number: string
  thumbnail?: string | null
}

function getAuthHeaders() {
  const auth = getCustomerAuth()

  if (!auth?.token) {
    throw new Error("Please sign in to continue.")
  }

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `${auth.tokenType} ${auth.token}`,
  }
}

async function customerRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init.headers ?? {}),
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.message ?? `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload as T
}

export async function fetchCustomerReviews(page = 1): Promise<PaginatedReviews> {
  return customerRequest<PaginatedReviews>(`/api/customer/reviews?page=${page}`)
}

export async function fetchPendingReviews(): Promise<PendingReview[]> {
  return customerRequest<PendingReview[]>("/api/customer/reviews/pending")
}

export async function submitProductReview(
  productId: number,
  rating: number,
  comment: string | null
): Promise<{ message: string; review: BackendReview }> {
  return customerRequest<{ message: string; review: BackendReview }>("/api/customer/reviews", {
    method: "POST",
    body: JSON.stringify({
      product_id: productId,
      rating,
      comment,
    }),
  })
}
