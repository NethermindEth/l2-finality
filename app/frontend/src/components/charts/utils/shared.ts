export const calculatePrecision = (
  fromDate: Date | null,
  toDate: Date | null
): number | null => {
  if (fromDate && toDate) {
    const durationInSeconds = Math.floor(
      (toDate.getTime() - fromDate.getTime()) / 1000
    )
    const oneDayInSeconds = 24 * 60 * 60
    const oneWeekInSeconds = 7 * oneDayInSeconds

    if (durationInSeconds <= oneDayInSeconds) {
      return 60 // 1 minute precision for duration <= 1 day
    } else if (durationInSeconds <= oneWeekInSeconds) {
      return 900 // 15 minutes precision for duration <= 1 week
    } else {
      return 3600 // 1 hour precision for duration > 1 week
    }
  }

  return null // FUll precision
}

export const calculatePrecisionForVaRAverage = (chainId: number) => {
  if (chainId === 10) {
    return 6
  } else if (chainId === 1101) {
    return 15
  } else {
    return 300
  }
}

const getHash = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
    hash = Math.abs(hash)
  }
  return hash
}

export const getColorForItem = (itemName: string) => {
  if (itemName === 'Token transfer' || itemName === 'token_transfer') {
    return '#f48c36'
  } else if (itemName === 'Token swap' || itemName === 'token_swap') {
    return '#4caf50'
  } else if (itemName === 'Native transfer' || itemName === 'native_transfer') {
    return '#2196f3'
  } else if (itemName === 'Block reward' || itemName === 'block_reward') {
    return '#8c00ff'
  } else if (itemName === 'Gas fees' || itemName === 'gas_fees') {
    return '#9e9e9e'
  }

  const hue = getHash(itemName) % 360
  return `hsl(${hue}, 80%, 60%)`
}

export const getColorForAsset = (asset: string) => {
  const hue = (getHash(asset) * 137.5) % 360
  return `hsla(${hue}, 80%, 60%, 0.5)`
}
