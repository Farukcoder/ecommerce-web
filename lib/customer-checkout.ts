import { getApiBaseUrl } from "@/lib/api-base-url"
import { getCustomerAuth } from "@/lib/customer-auth"

export type CheckoutPaymentMethod = {
  value: string
  label: string
  description: string
}

export type CheckoutOptions = {
  tax_rate: number
  shipping_charge: number
  payment_methods: CheckoutPaymentMethod[]
}

export type CheckoutOptionsResponse = {
  data: CheckoutOptions
}

export type CheckoutQuoteRequestItem = {
  product_id: number
  quantity: number
}

export type CheckoutQuoteRequest = {
  items: CheckoutQuoteRequestItem[]
}

export type CheckoutQuoteItem = {
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  available_stock: number
  unit_price: number
  total_price: number
  image: string
}

export type CheckoutQuote = {
  items: CheckoutQuoteItem[]
  subtotal: number
  discount_amount: number
  shipping_charge: number
  tax_rate: number
  tax_amount: number
  total_amount: number
}

export type CheckoutQuoteResponse = {
  data: CheckoutQuote
}

export type CustomerOrdersPagination = {
  total: number
  page: number
  limit: number
  total_pages: number
}

export type CustomerOrderSummary = {
  id: number
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  discount_amount: number
  shipping_charge: number
  tax_amount: number
  total_amount: number
  created_at: string
  items_count: number
}

export type CustomerOrdersResponse = {
  data: CustomerOrderSummary[]
  pagination: CustomerOrdersPagination
}

export type CustomerOrderShippingAddress = {
  name: string
  email: string
  phone: string
  address: string
  area: string
  city: string
  zip: string
  country: string
  transaction_id: string | null
  payment_method: string
}

export type CreateCustomerOrderRequest = {
  items: CheckoutQuoteRequestItem[]
  payment_method: string
  first_name?: string
  last_name?: string
  name?: string
  email?: string
  phone: string
  address: string
  apartment?: string
  division?: string
  city: string
  zip?: string
  postal_code?: string
  country?: string
  transaction_id?: string | null
  note?: string
}

export type CustomerOrderLineItem = {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  unit_price: number
  total_price: number
  product: {
    id: number
    name: string
    slug: string
  }
}

export type CustomerOrderDetail = {
  id: number
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  discount_amount: number
  shipping_charge: number
  tax_amount: number
  total_amount: number
  created_at: string
  shipping_address: CustomerOrderShippingAddress
  note: string | null
  items: CustomerOrderLineItem[]
  status_logs: unknown[]
}

export type CustomerOrderTrackingEvent = {
  status: string
  description: string
  date: string | null
  completed: boolean
}

export type CustomerOrderTracking = CustomerOrderDetail & {
  estimated_delivery: string | null
  tracking_events: CustomerOrderTrackingEvent[]
}

export type CreateCustomerOrderResponse = {
  message: string
  data: CustomerOrderDetail
}

export type CustomerOrderTrackingResponse = {
  data: CustomerOrderTracking
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

export async function fetchCheckoutOptions(): Promise<CheckoutOptions> {
  const payload = await customerRequest<CheckoutOptionsResponse>(
    "/api/customer/checkout/options"
  )

  return payload.data
}

export async function fetchCheckoutQuote(
  items: CheckoutQuoteRequestItem[]
): Promise<CheckoutQuote> {
  const payload = await customerRequest<CheckoutQuoteResponse>(
    "/api/customer/checkout/quote",
    {
      method: "POST",
      body: JSON.stringify({ items } satisfies CheckoutQuoteRequest),
    }
  )

  return payload.data
}

export async function fetchCustomerOrders(
  page = 1,
  perPage = 10
): Promise<CustomerOrdersResponse> {
  return customerRequest<CustomerOrdersResponse>(
    `/api/customer/orders?per_page=${perPage}&page=${page}`
  )
}

export type SslcommerzCheckoutResponse = {
  gateway_url: string
  order_id: number
}

export async function createCustomerOrder(
  request: CreateCustomerOrderRequest
): Promise<CreateCustomerOrderResponse> {
  return customerRequest<CreateCustomerOrderResponse>("/api/customer/orders", {
    method: "POST",
    body: JSON.stringify(request),
  })
}

export async function initiateSslcommerzCheckout(
  request: CreateCustomerOrderRequest
): Promise<SslcommerzCheckoutResponse> {
  return customerRequest<SslcommerzCheckoutResponse>(
    "/api/customer/checkout/sslcommerz",
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  )
}

export async function fetchCustomerOrderTracking(
  orderIdentifier: string | number
): Promise<CustomerOrderTracking> {
  const payload = await customerRequest<CustomerOrderTrackingResponse>(
    `/api/customer/orders/track/${encodeURIComponent(String(orderIdentifier))}`
  )

  return payload.data
}