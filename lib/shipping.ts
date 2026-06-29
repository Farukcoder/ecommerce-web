export const DHAKA_SHIPPING_CHARGE = 70
export const OUTSIDE_DHAKA_SHIPPING_CHARGE = 150

function normalizeDistrict(value: string) {
  return value.trim().toLowerCase()
}

export function isDhakaDistrict(...values: Array<string | undefined>) {
  return values.some((value) => {
    const normalized = normalizeDistrict(value ?? "")
    if (!normalized) return false
    return normalized === "dhaka" || normalized.includes("dhaka")
  })
}

export function getDistrictShippingCharge(district?: string, city?: string) {
  if (isDhakaDistrict(district, city)) {
    return DHAKA_SHIPPING_CHARGE
  }

  return OUTSIDE_DHAKA_SHIPPING_CHARGE
}
