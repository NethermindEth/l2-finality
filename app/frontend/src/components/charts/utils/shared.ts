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
