import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import 'chartjs-adapter-date-fns'
import { Chart, ChartOptions, registerables } from 'chart.js'
import { BlockVarViewModel } from '@/shared/api/viewModels/SyncStatusEndpoint'
import { Box, Paper, Typography, CircularProgress } from '@mui/material'
import { syncStatusApi } from '@/api/syncStatusApi'
import { transformData, ViewMode } from '@/components/charts/dataFormatters/var'
import VaRTypeSelectorComponent from '@/components/charts/utils/VaRTypeSelectorComponent'

Chart.register(...registerables)

interface VaRHistoryChartProps {
  chainId: number
}

const VaRLiveLineChart: React.FC<VaRHistoryChartProps> = ({ chainId }) => {
  const [liveVarData, setLiveVarData] = useState<BlockVarViewModel[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('by_contract')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchLiveData = async () => {
      setLoading(true)
      try {
        const syncStatusHistoryVar = await syncStatusApi.getHistoryVaR(chainId)
        setLiveVarData(syncStatusHistoryVar.data)
      } catch (error) {
        console.error('Error fetching VaRLiveLineChart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveData()

    const interval = setInterval(fetchLiveData, 15000) // Fetch data every 15 seconds

    return () => clearInterval(interval) // Clean up the interval on component unmount
  }, [chainId])

  if (loading) {
    return (
      <Paper
        sx={{
          p: 2,
          borderRadius: 4,
          width: '80%',
          margin: '0 auto',
          border: '1px solid #e0e0e0',
          boxShadow: 'none',
        }}
      >
        <Typography variant="body1" align="center" margin={10}>
          Loading...
        </Typography>
        <CircularProgress sx={{ display: 'block', margin: '0 auto' }} />
      </Paper>
    )
  }

  if (liveVarData.length === 0) {
    return (
      <Paper
        sx={{
          p: 2,
          borderRadius: 4,
          width: '80%',
          margin: '0 auto',
          border: '1px solid #e0e0e0',
          boxShadow: 'none',
        }}
      >
        <Typography variant="body1" align="center" margin={10}>
          No data available.
        </Typography>
      </Paper>
    )
  }

  const chartData = transformData(liveVarData, viewMode)

  const options = {
    animation: {
      duration: 0,
    },
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
        display: false, // Hide the legend
      },
      title: {
        display: true,
        text: `VaR Live - ${viewMode
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
        width: '98%',
        margin: '0 auto',
        border: '1px solid #e0e0e0',
        boxShadow: 'none',
      }}
    >
      <VaRTypeSelectorComponent
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <Line
        data={{ labels: chartData.labels, datasets: chartData.datasets }}
        options={options as ChartOptions<'line'>}
      />
    </Paper>
  )
}

export default VaRLiveLineChart
