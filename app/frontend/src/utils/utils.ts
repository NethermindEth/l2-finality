import { dropdownMenuOptions } from '@/components/ui/DropdownMenu'

export const getValueLabel = (value: string) => {
  return dropdownMenuOptions[value]
}

export const formatNumber = (num: number, prefix: string = ''): string => {
  if (num >= 1e9) {
    return `${prefix}${(num / 1e9).toFixed(1)}B`
  }
  if (num >= 1e6) {
    return `${prefix}${(num / 1e6).toFixed(1)}M`
  }
  if (num >= 1e3) {
    return `${prefix}${(num / 1e3).toFixed(1)}K`
  }
  return `${prefix}${num}`
}
