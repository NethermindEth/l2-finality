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
    return 60
  }
}

export const getColorForItem = (itemName: string) => {
  let hash = 0
  for (let i = 0; i < itemName.length; i++) {
    hash = (hash << 5) - hash + itemName.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
    hash = Math.abs(hash)
  }

  if (itemName === 'Token transfer') {
    return '#f48c36'
  } else if (itemName === 'Token swap') {
    return '#4caf50'
  } else if (itemName === 'Native transfer') {
    return '#2196f3'
  } else if (itemName === 'Block reward') {
    return '#8c00ff'
  } else if (itemName === 'Gas fees') {
    return '#9e9e9e'
  }
  const hue = hash % 360
  return `hsl(${hue}, 80%, 60%)`
}