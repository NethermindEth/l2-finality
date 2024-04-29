import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
} from '@mui/material'
import { ViewMode } from '@/components/charts/dataFormatters/var'
import React, { useEffect, useState } from 'react'
import { syncStatusApi } from '@/api/syncStatusApi'
import annotationPlugin from 'chartjs-plugin-annotation'
import {
  AccessTime,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material'
import { Line } from 'react-chartjs-2'
import {
  calculatePrecisionForVaRAverage,
  getColorForAsset,
  getColorForItem,
} from '@/components/charts/utils/shared'
import { Chart, ChartOptions, registerables } from 'chart.js'
import moment from 'moment'
import InfoIcon from '@mui/icons-material/Info'
import { AverageDetailsViewModel } from '@/shared/api/viewModels/SyncStatusEndpoint'

Chart.register(...registerables, annotationPlugin)

interface VaRAverageLineChartProps {
  chainId: number
}

const VaRAverageLineChart: React.FC<VaRAverageLineChartProps> = ({
  chainId,
}) => {
  const [averageVarData, setAverageVarData] =
    useState<AverageDetailsViewModel | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [showExample, setShowExample] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedDays, setSelectedDays] = useState<number>(3)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const dayMs = 24 * 60 * 60 * 1000
        const toDate = new Date()
        toDate.setUTCHours(0, 0, 0, 0)
        const fromDate = new Date(toDate.getTime() - selectedDays * dayMs)
        const precision = calculatePrecisionForVaRAverage(chainId)
        const averageData = await syncStatusApi.getAverageVaR(
          chainId,
          fromDate,
          toDate,
          precision || undefined
        )
        setAverageVarData(averageData.data)
      } catch (error) {
        console.error('Error fetching average VaR data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chainId, selectedDays])

  const generateChartData = () => {
    if (!averageVarData || !Array.isArray(averageVarData.timestamps)) {
      return {
        labels: [],
        datasets: [],
      }
    }

    const labels = averageVarData.timestamps

    const datasets = []

    if (viewMode === 'all') {
      const allData = averageVarData.avg_usd
      datasets.push({
        label: 'Average VaR USD',
        data: allData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 0,
        pointHoverRadius: 0,
      })
    } else if (viewMode === 'by_contract' || viewMode === 'by_type') {
      const dataKey = viewMode === 'by_contract' ? 'by_contract' : 'by_type'
      const getColor =
        viewMode === 'by_contract' ? getColorForAsset : getColorForItem
      Object.entries(averageVarData[dataKey]).forEach(([key, data]) => {
        datasets.push({
          label: key,
          data,
          backgroundColor: getColor(key),
          borderColor: getColor(key),
          borderWidth: 1,
          fill: 'stack',
          pointRadius: 0,
          pointHitRadius: 0,
          pointHoverRadius: 0,
        })
      })
    }

    if (averageVarData.timestamps.length > 0) {
      datasets.push(
        {
          label: 'Min VaR USD',
          data: averageVarData.min_usd,
          borderColor: 'rgb(43,106,241)',
          borderWidth: 5,
          fill: false,
          pointRadius: 0,
          stack: 'no_stack_min',
          borderDash: [5, 5],
        },
        {
          label: 'Max VaR USD',
          data: averageVarData.max_usd,
          hidden: true,
          borderColor: 'rgb(239,123,7)',
          borderWidth: 5,
          fill: false,
          pointRadius: 0,
          stack: 'no_stack_max',
          borderDash: [10, 5],
        }
      )
    }

    return {
      labels,
      datasets,
    }
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: true,
        text: 'Average VaR Over Time',
      },
      annotation: {
        annotations: {
          minLine: {
            type: 'line',
            xMin: averageVarData?.min_period_sec,
            xMax: averageVarData?.min_period_sec,
            borderColor: 'green',
            borderWidth: 2,
            label: {
              content: 'Min observed finality time',
              enabled: true,
              position: 'end',
              backgroundColor: 'green',
              color: '#ffffff',
              font: {
                size: 12,
              },
            },
          },
          avgLine: {
            type: 'line',
            xMin: averageVarData?.avg_period_sec,
            xMax: averageVarData?.avg_period_sec,
            borderColor: 'blue',
            borderWidth: 2,
            label: {
              content: 'Average finality time',
              enabled: true,
              position: 'end',
              backgroundColor: 'blue',
              color: '#ffffff',
              font: {
                size: 12,
              },
            },
          },
        },
      },
      tooltip: {
        callbacks: {
          title: function (tooltipItems) {
            return `${tooltipItems[0].parsed.x} s`
          },
          label: function (context) {
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
            }
            return label
          },
        },
        mode: viewMode !== 'all' ? 'index' : 'nearest',
        intersect: false,
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        type: 'timeseries',
        title: {
          display: true,
          text: 'Time (seconds)',
        },
        ticks: {
          autoSkip: true,
          callback: function (value: any) {
            if (chainId === -1) {
              const minutes = Math.floor(value / 60)
              return `${minutes} min`
            } else {
              return `${value}s`
            }
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        stacked: viewMode !== 'all',
        title: {
          display: true,
          text: 'VaR (USD)',
        },
        ticks: {
          display: true,
        },
        grid: {
          display: true,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
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
        Average L2 value at risk
      </Box>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setSelectedDays(1)}
              sx={{
                backgroundColor:
                  selectedDays === 1 ? 'primary.main' : 'transparent',
                color: selectedDays === 1 ? 'primary.main' : 'text.primary',
                borderColor:
                  selectedDays === 1 ? 'primary.main' : 'text.primary',
                '&:hover': {
                  backgroundColor:
                    selectedDays === 1 ? 'lightgray' : 'rgba(0, 0, 0, 0.04)',
                  borderColor:
                    selectedDays === 1 ? 'primary.dark' : 'text.primary',
                },
              }}
            >
              1D
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedDays(3)}
              sx={{
                backgroundColor:
                  selectedDays === 3 ? 'primary.main' : 'transparent',
                color: selectedDays === 3 ? 'primary.main' : 'text.primary',
                borderColor:
                  selectedDays === 3 ? 'primary.main' : 'text.primary',
                '&:hover': {
                  backgroundColor:
                    selectedDays === 3 ? 'lightgray' : 'rgba(0, 0, 0, 0.04)',
                  borderColor:
                    selectedDays === 3 ? 'primary.dark' : 'text.primary',
                },
              }}
            >
              3D
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedDays(7)}
              sx={{
                backgroundColor:
                  selectedDays === 7 ? 'primary.main' : 'transparent',
                color: selectedDays === 7 ? 'primary.main' : 'text.primary',
                borderColor:
                  selectedDays === 7 ? 'primary.main' : 'text.primary',
                '&:hover': {
                  backgroundColor:
                    selectedDays === 7 ? 'lightgray' : 'rgba(0, 0, 0, 0.04)',
                  borderColor:
                    selectedDays === 7 ? 'primary.dark' : 'text.primary',
                },
              }}
            >
              7D
            </Button>
            <Tooltip
              title="Calculates the average from now and looking back for the specified length in the button"
              placement="top"
            >
              <IconButton>
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>View Mode</InputLabel>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              label="View Mode"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="by_contract">By token</MenuItem>
              <MenuItem value="by_type">By Type</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10, mb: 10 }}>
          <CircularProgress />
        </Box>
      ) : averageVarData === null || averageVarData.timestamps.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 10, mb: 10 }}>
          No data available for this range.
        </Typography>
      ) : (
        <>
          <Line data={generateChartData()} options={options} />
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'success.main',
              }}
            >
              <AccessTime sx={{ fontSize: 20, mr: 0.5 }} /> Min finalisation
              time for period:
              {averageVarData
                ? moment
                    .duration(averageVarData.min_period_sec, 'seconds')
                    .humanize()
                : 'N/A'}
            </Typography>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'primary.main',
              }}
            >
              <AccessTime sx={{ fontSize: 20, mr: 0.5 }} /> Average finality
              time for period:
              {averageVarData
                ? moment
                    .duration(averageVarData.avg_period_sec, 'seconds')
                    .humanize()
                : 'N/A'}
            </Typography>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <AccessTime sx={{ fontSize: 20, mr: 0.5 }} /> Max finalisation
              time for period:
              {averageVarData
                ? moment
                    .duration(averageVarData.max_period_sec, 'seconds')
                    .humanize()
                : 'N/A'}
            </Typography>
          </Box>
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                This chart presents the average value at risk (VaR) for Layer 2
                blocks during the finalization period. It illustrates the
                potential financial exposure in the event of a chain
                reorganization at different stages of the finalization process.
                The maximum finalization time observed within the specified time
                frame is displayed, along with the average VaR at regular
                intervals until the block is considered finalized.
              </Typography>
              <Button
                onClick={() => setShowExample(!showExample)}
                endIcon={
                  showExample ? <KeyboardArrowUp /> : <KeyboardArrowDown />
                }
                sx={{
                  color: 'text.secondary',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                }}
              >
                See example
              </Button>
              <Collapse in={showExample} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="body2">
                    For example, let`s say the maximum finalization time for the
                    selected period is 10 minutes. The chart will show the
                    average VaR at different points in time, such as:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="At 1 minute: Average VaR of $20,000" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="At 2 minutes: Average VaR of $50,000" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="At 5 minutes: Average VaR of $80,000" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="At 8 minutes: Average VaR of $100,000" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="At 10 minutes (fully finalized): Average VaR of $120,000" />
                    </ListItem>
                  </List>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {' '}
                    This example illustrates how the potential financial
                    exposure, represented by the Value at Risk (VaR), changes as
                    the block moves closer to finalization. Around the average
                    finalization time, you may observe higher volatility since
                    the chain can finalize earlier or slightly later than
                    expected.{' '}
                  </Typography>{' '}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {' '}
                    In this scenario, `At 2 minutes` indicates that 2 minutes
                    after the latest event, the average VaR is $50,000. This
                    suggests that based on historical data, it would take
                    approximately 8 more minutes for the block to be fully
                    finalized, assuming an average finalization time of 10
                    minutes.{' '}
                  </Typography>{' '}
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {' '}
                    The chart enables users to assess the risk associated with
                    chain reorganizations at different stages of the
                    finalization process. It helps in understanding the
                    potential financial impact and the expected time remaining
                    until finalization.{' '}
                  </Typography>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </>
      )}
    </Paper>
  )
}

export default VaRAverageLineChart
