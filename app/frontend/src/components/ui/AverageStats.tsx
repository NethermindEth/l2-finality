import React from 'react'
import { Box } from '@mui/material'
import { formatNumber } from '@/utils/utils'
interface AverageStatsProps {
  label: string
  value: number
  prefix?: string
  percentageChange?: number
  comparisonPeriod: string
}

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(2)}%`
}

const AverageStats: React.FC<AverageStatsProps> = ({
  label,
  value,
  prefix,
  percentageChange,
  comparisonPeriod,
}) => {
  return (
    <>
      <Box sx={{ color: 'text.secondary' }}>{label}</Box>
      <Box sx={{ color: 'text.primary', fontSize: 34, fontWeight: 'medium' }}>
        {formatNumber(value, prefix)}
      </Box>
      {percentageChange != null && (
        <Box
          sx={{
            color: percentageChange > 0 ? 'success.dark' : 'error.dark',
            display: 'inline',
            fontWeight: 'bold',
            mx: 0.5,
            fontSize: 14,
          }}
        >
          {formatPercentage(percentageChange)}
        </Box>
      )}
      <Box sx={{ color: 'text.secondary', display: 'inline', fontSize: 14 }}>
        {percentageChange != null
          ? `vs. ${comparisonPeriod}`
          : `per ${comparisonPeriod}`}
      </Box>
    </>
  )
}

export default AverageStats
