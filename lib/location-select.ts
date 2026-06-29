export type LocationSelectOption = {
  value: string
  label: string
  searchText: string
}

type LocationItem = {
  id: number
  name: string
  bn_name: string
}

export function toLocationSelectOptions(items: LocationItem[]): LocationSelectOption[] {
  return items.map((item) => ({
    value: String(item.id),
    label: `${item.name} (${item.bn_name})`,
    searchText: `${item.name} ${item.bn_name}`,
  }))
}
