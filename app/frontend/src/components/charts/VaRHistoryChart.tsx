import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import { Chart, ChartOptions, registerables } from 'chart.js'
import { BlockVarViewModel } from '@/shared/api/viewModels/SyncStatusEndpoint'
import {
  Box,
  FormControl,
  InputLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Typography,
  CircularProgress,
} from '@mui/material'
import { syncStatusApi } from '@/api/syncStatusApi'
import DatePickerComponent from '@/components/charts/utils/DatePickerComponent'
import { transformData, ViewMode } from '@/components/charts/dataFormatters/var'

Chart.register(...registerables)

interface VaRHistoryChartProps {
  chainId: number
}

const VaRHistoryChart: React.FC<VaRHistoryChartProps> = ({ chainId }) => {
  const [historyVarData, setHistoryVarData] = useState<BlockVarViewModel[]>([])
  const [fromDate, setFromDate] = useState<Date | null>(
    new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  )
  const [toDate, setToDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('by_contract')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true)
      try {
        const precision = calculatePrecision(fromDate, toDate)
        const syncStatusHistoryVar = await syncStatusApi.getHistoryVaR(
          chainId,
          fromDate || undefined,
          toDate || undefined,
          precision || undefined
        )
        setHistoryVarData(syncStatusHistoryVar.data)
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalData()
  }, [chainId, fromDate, toDate])

  const calculatePrecision = (
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

  if (loading) {
    return (
      <Paper
        sx={{
          p: 2,
          borderRadius: 4,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '80%',
        }}
      >
        <Typography variant="body1" align="center" margin={10}>
          <CircularProgress sx={{ display: 'block', margin: '0 auto' }} />
        </Typography>
      </Paper>
    )
  }

  const chartData = transformData(historyVarData, viewMode)

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'yyyy-MM-dd HH:mm:ss',
          displayFormats: {
            day: 'yyyy-MM-dd',
            week: 'yyyy-MM-dd',
            month: 'yyyy-MM',
            hour: 'MM/dd HH:mm',
          },
        },
        ticks: {
          source: 'data',
          autoSkip: true,
          font: {
            weight: 'bold',
          },
        },
        title: {
          display: true,
          text: 'L2 block timestamp',
        },
      },
      y: {
        stacked: viewMode !== 'all',
        title: {
          display: true,
          text: 'Value at Risk (VaR)',
        },
        ticks: {
          callback: function (value: string) {
            return '$' + value.toLocaleString()
          },
        },
      },
    },
    responsive: true,
    plugins: {
      legend: {
        display: viewMode == 'by_type',
      },
      title: {
        display: true,
        text: `VaR History - ${viewMode
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}`,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null && context.parsed.y !== 0) {
              label +=
                '$' +
                context.parsed.y.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              return label
            }
            return null
          },
        },
        mode: viewMode !== 'all' ? 'index' : 'nearest',
        intersect: false,
      },
      datalabels: {
        display: false,
      },
    },
  }

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 4,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '80%',
      }}
    >
      <Box sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
        History, L2 value at risk
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={6} sm={4}>
          <DatePickerComponent
            label="From Date"
            value={fromDate}
            onChange={setFromDate}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <DatePickerComponent
            label="To Date"
            value={toDate}
            onChange={setToDate}
          />
        </Grid>

        <Grid item xs={6} sm={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>View Mode</InputLabel>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              label="View Mode"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="by_contract">By Contract</MenuItem>
              <MenuItem value="by_type">By Type</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {historyVarData.length === 0 ? (
        <>
          <Typography variant="body1" align="center" margin={10}>
            No data available for this range.
          </Typography>
        </>
      ) : (
        <Line
          data={{ labels: chartData.labels, datasets: chartData.datasets }}
          options={options as ChartOptions<'line'>}
        />
      )}
    </Paper>
  )
}

export default VaRHistoryChart
