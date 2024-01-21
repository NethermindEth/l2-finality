export const getValueLabel = (value: string) => {
  const valueToLabel: Record<string, string> = {
    base: 'Base',
    optimism: 'Optimism',
    scroll: 'Scroll',
    starknet: 'Starknet',
    'zksync-era': 'zkSync Era',
  }
  return valueToLabel[value]
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
