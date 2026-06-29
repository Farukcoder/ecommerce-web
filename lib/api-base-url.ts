const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()

export function getApiBaseUrl() {
  if (!rawApiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set")
  }

  return rawApiBaseUrl
}