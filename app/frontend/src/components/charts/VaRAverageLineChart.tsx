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
import { BlockVarViewModel } from '../../../../shared/api/viewModels/SyncStatusEndpoint'
import { syncStatusApi } from '@/api/syncStatusApi'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'

interface VaRAverageLineChartProps {
  chainId: number
}

const VaRAverageLineChart: React.FC<VaRAverageLineChartProps> = ({
  chainId,
}) => {
  const [averageVarData, setAverageVarData] = useState<BlockVarViewModel[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('by_contract')
  const [showExample, setShowExample] = useState(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedDays, setSelectedDays] = useState<number>(3)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const toDate = new Date()
        const fromDate = new Date(
          toDate.getTime() - selectedDays * 24 * 60 * 60 * 1000 * 0.2
        )
        const syncStatusHistoryVar = await syncStatusApi.getHistoryVaR(
          chainId,
          fromDate,
          toDate,
          undefined
        )
        setAverageVarData(syncStatusHistoryVar.data)
      } catch (error) {
        console.error('Error fetching average VaR data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chainId, selectedDays])

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
      ) : averageVarData.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 10, mb: 10 }}>
          No data available for this range.
        </Typography>
      ) : (
        // Render your chart component here
        // Example:
        // <Line
        //   data={{ labels: chartData.labels, datasets: chartData.datasets }}
        //   options={options as ChartOptions<'line'>}
        // />
        <>
          <Typography variant="body1" align="center" sx={{ mt: 4 }}>
            Chart goes here.
          </Typography>
          <Card variant="outlined" sx={{ mb: 2 }}>
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
                  fontSize: '1.0rem',
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
