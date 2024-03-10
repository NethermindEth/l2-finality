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

Chart.register(
  ChartDataLabels,
  LinearScale,
  CategoryScale,
  BarElement,
  Tooltip,
  Legend
)

interface FinalityTimeseriesProps {
  data: AverageFinalityTimeViewModel
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
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds.toFixed(0)} second${remainingSeconds !== 1 ? 's' : ''}`
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes > 0) {
    if (full) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ${remainingSeconds.toFixed(0)} second${remainingSeconds !== 1 ? 's' : ''}`
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    return `${Math.round(remainingSeconds)} second${remainingSeconds !== 1 ? 's' : ''}`
  }
}

const transformData = (
  records: FinalityTimeRecord[],
  selectedMetric: string
) => {
  // Filter out records without a valid Time Diff and sort by timestamp
  const validRecords = records
    .filter((record) => record.timeDiff != null)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

  const blockDiffs = validRecords.map((record) => record.blockDiff)
  const timeDiffs = validRecords.map((record) => record.timeDiff)
  const ratios = blockDiffs.map((blockDiff, index) =>
    timeDiffs[index] ? blockDiff / timeDiffs[index] : 0
  )
  const blockStats = calculateStatistics(blockDiffs)
  const timeStats = calculateStatistics(timeDiffs)

  let dataset
  if (selectedMetric === 'blockDiff') {
    dataset = {
      label: 'Block Diff',
      data: blockDiffs,
      backgroundColor: 'rgba(24,126,239,0.6)',
    }
  } else if (selectedMetric === 'timeDiff') {
    dataset = {
      label: 'Time Diff',
      data: timeDiffs,
      backgroundColor: 'rgba(32,217,61,0.6)',
    }
  } else {
    dataset = {
      label: 'Ratio (Blocks/Time)',
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

const FinalityTimeseries: React.FC<FinalityTimeseriesProps> = ({ data }) => {
  const [selectedSection, setSelectedSection] =
    useState<keyof AverageFinalityTimeViewModel['data']>('data_submission')
  const [selectedMetric, setSelectedMetric] = useState('blockDiff') // 'timeDiff', 'ratio'
  const [chartData, setChartData] = useState({ labels: [], datasets: [] })

  useEffect(() => {
    if (data.data[selectedSection]) {
      const newChartData = transformData(
        data.data[selectedSection],
        selectedMetric
      )
      setChartData(newChartData as any)
    }
  }, [selectedSection, selectedMetric, data])

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
          text: `${selectedMetric} ${selectedMetric === 'ratio' ? '(Blocks/Time)' : ''}`,
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
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Data Section</InputLabel>
            <Select
              value={selectedSection}
              onChange={handleSectionChange}
              label="Data Section"
            >
              <MenuItem value="data_submission">Data Submission</MenuItem>
              <MenuItem value="l2_finalization">L2 Finalization</MenuItem>
              <MenuItem value="proof_submission">Proof Submission</MenuItem>
              <MenuItem value="state_updates">State Updates</MenuItem>
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
              <MenuItem value="blockDiff">Block Diff</MenuItem>
              <MenuItem value="timeDiff">Time Diff</MenuItem>
              <MenuItem value="ratio">Ratio (Blocks/Time)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Bar data={chartData} options={options} />
    </Paper>
  )
}

export default FinalityTimeseries
