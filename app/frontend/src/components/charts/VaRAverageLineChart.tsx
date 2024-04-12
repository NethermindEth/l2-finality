import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  FormControl,
  Grid,
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
import {
  AverageVarViewModel,
  AverageDetailsViewModel,
} from '../../../../shared/api/viewModels/SyncStatusEndpoint'
import { syncStatusApi } from '@/api/syncStatusApi'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { Line } from 'react-chartjs-2'
import { VaRAverageDataViewModel } from '@/shared/api/viewModels/SyncStatusEndpoint'

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
        const toDate = new Date()
        const fromDate = new Date(
          toDate.getTime() - selectedDays * 24 * 60 * 60 * 1000
        )
        const averageData = await syncStatusApi.getAverageVaR(
          chainId,
          fromDate,
          toDate,
          undefined
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
    if (!averageVarData || !Array.isArray(averageVarData.values)) {
      return {
        labels: [],
        datasets: [],
      }
    }

    const labels = averageVarData.values.map((data) => {
      const minutes = Math.floor(data.timestamp / 60)
      const seconds = data.timestamp % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    })

    const datasets = []

    if (viewMode === 'all') {
      const allData = averageVarData.values.map((data) =>
        data.by_contract.reduce((sum, contract) => sum + contract.var_usd, 0)
      )
      datasets.push({
        label: 'All Contracts',
        data: allData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: true,
        pointRadius: 0,
        pointHitRadius: 0,
        pointHoverRadius: 0,
      })
    } else if (viewMode === 'by_contract') {
      const contractData: { [key: string]: number[] } = {}
      averageVarData.values.forEach((data) => {
        data.by_contract.forEach((contract) => {
          if (!contractData[contract.address]) {
            contractData[contract.address] = []
          }
          contractData[contract.address].push(contract.var_usd)
        })
      })

      Object.entries(contractData).forEach(([contractAddress, data], index) => {
        datasets.push({
          label: contractAddress,
          data,
          backgroundColor: `rgba(${(index * 50) % 255}, ${((index + 1) * 50) % 255}, ${((index + 2) * 50) % 255}, 0.2)`,
          borderColor: `rgba(${(index * 50) % 255}, ${((index + 1) * 50) % 255}, ${((index + 2) * 50) % 255}, 1)`,
          borderWidth: 1,
          fill: true,
          pointRadius: 0,
          pointHitRadius: 0,
          pointHoverRadius: 0,
        })
      })
    } else if (viewMode === 'by_type') {
      const typeData: { [key: string]: number[] } = {}
      averageVarData.values.forEach((data) => {
        data.by_type.forEach((type) => {
          if (!typeData[type.type]) {
            typeData[type.type] = []
          }
          typeData[type.type].push(type.var_usd)
        })
      })

      Object.entries(typeData).forEach(([typeName, data], index) => {
        datasets.push({
          label: typeName,
          data,
          backgroundColor: `rgba(${(index * 50) % 255}, ${((index + 1) * 50) % 255}, ${((index + 2) * 50) % 255}, 0.2)`,
          borderColor: `rgba(${(index * 50) % 255}, ${((index + 1) * 50) % 255}, ${((index + 2) * 50) % 255}, 1)`,
          borderWidth: 1,
          fill: true,
          pointRadius: 0,
          pointHitRadius: 0,
          pointHoverRadius: 0,
        })
      })
    }

    if (averageVarData.values.length > 0) {
      datasets.push(
        {
          label: 'Min VaR USD',
          data: averageVarData.values.map((data) => data.min_var_usd),
          borderColor: 'rgba(255, 0, 0, 1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
        },
        {
          label: 'Max VaR USD',
          data: averageVarData.values.map((data) => data.max_var_usd),
          borderColor: 'rgba(255, 0, 0, 1)',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
        }
      )
    }

    return {
      labels,
      datasets,
    }
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Average VaR Over Time',
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: false,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value.toLocaleString()}`
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Timestamp',
        },
        ticks: {
          display: true,
        },
        grid: {
          display: false,
        },
      },
      y: {
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
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              onClick={() => setSelectedDays(15)}
              sx={{
                backgroundColor:
                  selectedDays === 15 ? 'primary.main' : 'transparent',
                color: selectedDays === 15 ? 'primary.main' : 'text.primary',
                borderColor:
                  selectedDays === 15 ? 'primary.main' : 'text.primary',
                '&:hover': {
                  backgroundColor:
                    selectedDays === 15 ? 'lightgray' : 'rgba(0, 0, 0, 0.04)',
                  borderColor:
                    selectedDays === 15 ? 'primary.dark' : 'text.primary',
                },
              }}
            >
              15D
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedDays(30)}
              sx={{
                backgroundColor:
                  selectedDays === 30 ? 'primary.main' : 'transparent',
                color: selectedDays === 30 ? 'primary.main' : 'text.primary',
                borderColor:
                  selectedDays === 30 ? 'primary.main' : 'text.primary',
                '&:hover': {
                  backgroundColor:
                    selectedDays === 30 ? 'lightgray' : 'rgba(0, 0, 0, 0.04)',
                  borderColor:
                    selectedDays === 30 ? 'primary.dark' : 'text.primary',
                },
              }}
            >
              30D
            </Button>
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
              <MenuItem value="by_contract">By Contract</MenuItem>
              <MenuItem value="by_type">By Type</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10, mb: 10 }}>
          <CircularProgress />
        </Box>
      ) : averageVarData === null || averageVarData.values.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 10, mb: 10 }}>
          No data available for this range.
        </Typography>
      ) : (
        <>
          <Line data={generateChartData()} options={options} />
          <Card variant="outlined">
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
                    For example, let's say the maximum finalization time for the
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
                  <Typography variant="body2">
                    {' '}
                    This example illustrates how the potential financial
                    exposure, represented by the Value at Risk (VaR), changes as
                    the block moves closer to finalization. Around the average
                    finalization time, you may observe higher volatility since
                    the chain can finalize earlier or slightly later than
                    expected.{' '}
                  </Typography>{' '}
                  <Typography variant="body2">
                    {' '}
                    In this scenario, "At 2 minutes" indicates that 2 minutes
                    after the latest event, the average VaR is $50,000. This
                    suggests that based on historical data, it would take
                    approximately 8 more minutes for the block to be fully
                    finalized, assuming an average finalization time of 10
                    minutes.{' '}
                  </Typography>{' '}
                  <Typography variant="body2">
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
