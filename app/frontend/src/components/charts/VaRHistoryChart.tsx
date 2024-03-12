import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import { Chart, ChartOptions, registerables } from 'chart.js'
import {
  AvgVarHistoryMap,
  VaRHistoryDataViewModel,
} from '../../../../shared/api/viewModels/SyncStatusEndpoint'
import {
  Box,
  FormControl,
  InputLabel,
  Grid,
  MenuItem,
  Paper,
  Select,
  Typography,
  TextField,
} from '@mui/material'
import { syncStatusApi } from '@/api/syncStatusApi'
import { GroupRange } from '../../../../shared/api/types'
import RangeSelectorComponent from '@/components/charts/utils/RangeSelectorComponent'
import DatePickerComponent from '@/components/charts/utils/DatePickerComponent'

Chart.register(...registerables)

interface VaRHistoryChartProps {
  chainId: number
}

const transformData = (
  dataSection: AvgVarHistoryMap,
  splitByContract: boolean
): { datasets: any[]; labels: string[] } => {
  let labels = new Set<string>()
  Object.values(dataSection).forEach((entries) => {
    entries.forEach((entry) => {
      labels.add(entry.timestamp)
    })
  })

  let sortedLabels = Array.from(labels).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  if (splitByContract) {
    const datasets = Object.entries(dataSection).map(([contract, entries]) => {
      const color = getColorForAsset(contract, 0.5)
      const data = sortedLabels.map((timestamp) => {
        const entry = entries.find((entry) => entry.timestamp === timestamp)
        return { x: timestamp, y: entry ? entry.avg_var : null }
      })
      return {
        label: contract,
        data,
        backgroundColor: color,
        borderColor: color.replace('0.5', '1'),
        borderWidth: 1,
        tension: 0.1,
        fill: false,
      }
    })
    return { datasets, labels: sortedLabels }
  } else {
    const data = sortedLabels.map((timestamp) => {
      const sum = Object.values(dataSection).reduce((acc, entries) => {
        const entry = entries.find((entry) => entry.timestamp === timestamp)
        return acc + (entry ? entry.avg_var : 0)
      }, 0)
      return { x: timestamp, y: sum }
    })
    return {
      datasets: [
        {
          label: 'All Contracts',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          tension: 0.1,
          fill: true,
        },
      ],
      labels: sortedLabels,
    }
  }
}

const VaRHistoryChart: React.FC<VaRHistoryChartProps> = ({ chainId }) => {
  const [historyVarData, setHistoryVarData] = useState<VaRHistoryDataViewModel>(
    { data: [] }
  )
  const [fromDate, setFromDate] = useState<Date | null>(
    new Date(Date.now() - 24 * 5 * 60 * 60 * 1000)
  )
  const [toDate, setToDate] = useState<Date | null>(new Date())
  const [range, setRange] = useState<GroupRange>('hour')

  const [selectedSection, setSelectedSection] =
    useState<keyof VaRHistoryDataViewModel['data']>('data_submission')
  const [splitByContract, setSplitByContract] = useState<boolean>(true)

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const syncStatusHistoryVar = await syncStatusApi.getHistoryVaR(
          chainId,
          range,
          fromDate,
          toDate,
          true
        )
        setHistoryVarData(syncStatusHistoryVar)
      } catch (error) {
        console.error('Error fetching historical data:', error)
      }
    }

    fetchHistoricalData()
  }, [chainId, fromDate, toDate, range])

  if (!historyVarData.success) {
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
  } else if (!historyVarData.data[selectedSection]) {
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
          No data available for specified range
        </Typography>
      </Paper>
    )
  }

  const handleRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setRange(event.target.value as GroupRange)
  }

  const chartData = transformData(
    historyVarData.data[selectedSection],
    splitByContract
  )

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
          text: 'Timestamp',
        },
      },
      y: {
        stacked: false,
        title: {
          display: true,
          text: 'Average Value at Risk (VaR)',
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
        display: false,
      },
      title: {
        display: true,
        text: splitByContract
          ? 'VaR History by Contract'
          : 'VaR History - All Contracts',
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label +=
                '$' +
                context.parsed.y.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
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
        History, VaR
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
          <RangeSelectorComponent value={range} onChange={handleRangeChange} />
        </Grid>

        <Grid item xs={6} sm={4}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>View Mode</InputLabel>
            <Select
              value={splitByContract ? 'contract' : 'all'}
              onChange={(e) =>
                setSplitByContract(e.target.value === 'contract')
              }
              label="View Mode"
            >
              <MenuItem value="contract">Contract split</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Data Section</InputLabel>
            <Select
              value={selectedSection}
              onChange={(e) =>
                setSelectedSection(
                  e.target.value as keyof VaRHistoryDataViewModel['data']
                )
              }
              label="Data Section"
            >
              <MenuItem value="data_submission">Data Submission</MenuItem>
              <MenuItem value="l2_finalization">L2 Finalization</MenuItem>
              <MenuItem value="proof_submission">Proof Submission</MenuItem>
              <MenuItem value="state_updates">State Updates</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Line
        data={{ labels: chartData.labels, datasets: chartData.datasets }}
        options={options as ChartOptions<'line'>}
      />
    </Paper>
  )
}

const getColorForAsset = (assetName: string, alpha: number) => {
  let hash = 0
  for (let i = 0; i < assetName.length; i++) {
    hash = assetName.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360

  return `hsla(${hue}, 80%, 60%, ${alpha})`
}

export default VaRHistoryChart
