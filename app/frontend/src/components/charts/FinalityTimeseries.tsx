import React, { useEffect, useState } from 'react'
import {
  Chart,
  LinearScale,
  CategoryScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import {
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material'
import moment from 'moment'
import {
  AverageFinalityTimeViewModel,
  FinalityTimeRecord,
} from '../../../../shared/api/viewModels/SyncStatusEndpoint'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { GroupRange } from '@/shared/api/types'
import { syncStatusApi } from '@/api/syncStatusApi'
import RangeSelectorComponent from '@/components/charts/utils/RangeSelectorComponent'
import DatePickerComponent from '@/components/charts/utils/DatePickerComponent'
import chains from '@/shared/chains.json'

Chart.register(
  ChartDataLabels,
  LinearScale,
  CategoryScale,
  BarElement,
  Tooltip,
  Legend
)

interface FinalityTimeseriesProps {
  chainId: number
}

const calculateStatistics = (values: number[]) => {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  return { max, min, avg }
}

function formatTime(seconds: number, full?: boolean) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    if (full) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${
        minutes > 1 ? 's' : ''
      } ${remainingSeconds.toFixed(0)} second${
        remainingSeconds !== 1 ? 's' : ''
      }`
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes > 0) {
    if (full) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds.toFixed(
        0
      )} second${remainingSeconds !== 1 ? 's' : ''}`
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    return `${Math.round(remainingSeconds)} second${
      remainingSeconds !== 1 ? 's' : ''
    }`
  }
}

const transformData = (
  records: FinalityTimeRecord[],
  selectedMetric: string
) => {
  const validRecords = records
    .filter((record) => record.timeDiff != null)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

  const blockDiffs = validRecords.map((record) => record.blockDiff)
  const timeDiffs = validRecords.map((record) => record.timeDiff)
  const ratios = timeDiffs.map((timeDiff, index) =>
    blockDiffs[index] ? timeDiff / blockDiffs[index] : 0
  )
  const blockStats = calculateStatistics(blockDiffs)
  const timeStats = calculateStatistics(timeDiffs)

  let dataset
  if (selectedMetric === 'blockDiff') {
    dataset = {
      label: 'Average L2 Block difference',
      data: blockDiffs,
      backgroundColor: 'rgba(24,126,239,0.6)',
    }
  } else if (selectedMetric === 'timeDiff') {
    dataset = {
      label: 'Average Time difference (s)',
      data: timeDiffs,
      backgroundColor: 'rgba(32,217,61,0.6)',
    }
  } else {
    dataset = {
      label: 'Ratio (Time/Blocks)',
      data: ratios,
      backgroundColor: 'rgba(239,144,57,0.6)',
    }
  }

  return {
    labels: validRecords.map((record) =>
      moment(record.timestamp).format('yyyy-MM-DD HH:mm:ss')
    ),
    datasets: [dataset],
    blockStats,
    timeStats,
  }
}

const FinalityTimeseries: React.FC<FinalityTimeseriesProps> = ({ chainId }) => {
  const chainName = Object.keys(chains).find(
    (name) => chains[name].chainId === chainId
  )
  const [fromDate, setFromDate] = useState<Date | null>(
    new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 2 days ago
  )
  const [toDate, setToDate] = useState<Date | null>(new Date())
  const [range, setRange] = useState<GroupRange>('day')
  const [response, setResponse] = useState<AverageFinalityTimeViewModel>({
    data: [],
  })
  const [chartData, setChartData] = useState({ labels: [], datasets: [] })
  const [selectedSection, setSelectedSection] = useState<
    keyof AverageFinalityTimeViewModel['data']
  >(chains[chainName]?.defaultSyncStatus || 'data_submission')
  const [selectedMetric, setSelectedMetric] = useState('blockDiff')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await syncStatusApi.getAverageFinalityTime(
          chainId,
          range,
          fromDate || undefined,
          toDate || undefined
        )
        setResponse(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [chainId, fromDate, toDate, range])

  useEffect(() => {
    const defaultSyncStatus = chains[chainName]?.defaultSyncStatus
    if (defaultSyncStatus) {
      setSelectedSection(defaultSyncStatus)
    }
  }, [chainId, chainName])

  useEffect(() => {
    if (response.data[selectedSection]) {
      const newChartData = transformData(
        response.data[selectedSection],
        selectedMetric
      )
      setChartData(newChartData as any)
    }
  }, [selectedSection, selectedMetric, response])

  const handleSectionChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ): void => {
    setSelectedSection(
      event.target.value as keyof AverageFinalityTimeViewModel['data']
    )
  }

  const handleMetricChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedMetric(event.target.value as string)
  }

  const handleRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setRange(event.target.value as GroupRange)
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
          Loading...
        </Typography>
        <CircularProgress sx={{ display: 'block', margin: '0 auto' }} />
      </Paper>
    )
  }

  if (!response.success) {
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
          Error fetching data.
        </Typography>
      </Paper>
    )
  } else if (!response.data[selectedSection]) {
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
          Error fetching data.
        </Typography>
      </Paper>
    )
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
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
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text:
            selectedMetric === 'blockDiff'
              ? 'Average number of L2 blocks'
              : selectedMetric === 'ratio'
                ? 'L2 blocks per second'
                : 'Average time to finality (s)',
        },
        ticks: {
          callback: function (value: number) {
            if (selectedMetric === 'timeDiff') {
              return formatTime(value)
            }
            return selectedMetric === 'ratio'
              ? value.toFixed(2)
              : value.toString()
          },
        },
      },
    },
    plugins: {
      tooltip: {
        mode: 'index',
        callbacks: {
          label: function (tooltipItem) {
            let label: string = tooltipItem.dataset.label || ''
            if (label) {
              label += ': '
            }
            let value: number = tooltipItem.parsed.y
            if (selectedMetric === 'timeDiff') {
              label += formatTime(value, true)
            } else {
              label += parseFloat(value).toFixed(2)
            }
            return label
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
  }

  const enabledSyncStatuses = chains[chainName]?.enabledSyncStatuses || [
    'data_submission',
    'l2_finalization',
    'proof_submission',
    'state_updates',
  ]

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
        History, time to finality
      </Box>
      <Grid container spacing={3}>
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
          <RangeSelectorComponent value={range} onChange={handleRangeChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Data Section</InputLabel>
            <Select
              value={selectedSection}
              onChange={handleSectionChange}
              label="Data Section"
            >
              {enabledSyncStatuses.map((status: any) => (
                <MenuItem key={status} value={status}>
                  {status
                    .split('_')
                    .map(
                      (word: any) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              onChange={handleMetricChange}
              label="Metric"
            >
              <MenuItem value="blockDiff">Average L2 Block difference</MenuItem>
              <MenuItem value="timeDiff">Average Time difference (s)</MenuItem>
              <MenuItem value="ratio">Ratio (Time/Blocks)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Bar data={chartData} options={options} />
    </Paper>
  )
}

export default FinalityTimeseries
