import React from 'react'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'
import { LiveVaREntry } from '@/shared/api/viewModels/SyncStatusEndpoint'
import { Box, Typography } from '@mui/material'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart, ChartOptions } from 'chart.js'

Chart.register(ChartDataLabels)

interface VaRLiveGraphProps {
  dataSection: LiveVaREntry
}

const VaRLiveGraph: React.FC<VaRLiveGraphProps> = ({ dataSection }) => {
  const totalValue = Object.values(dataSection).reduce(
    (acc, value) => acc + value,
    0
  )
  const threshold = totalValue / Object.keys(dataSection).length

  const topThreeAssets = React.useMemo(() => {
    return Object.entries(dataSection)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(
        (item, index) =>
          `${index + 1}. ${item[0]}, $${item[1].toLocaleString()}`
      )
  }, [dataSection])

  const chartData = {
    labels: ['Total VaR'],
    datasets: Object.entries(dataSection).map(([key, value]) => ({
      label: key,
      data: [value],
      backgroundColor: getColorForAsset(key),
    })),
  }

  const options: ChartOptions<'bar'> = {
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        display: false,
      },
      y: {
        display: false,
        stacked: true,
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.dataset.label}: $${context.raw.toLocaleString()}`,
        },
      },
      datalabels: {
        color: '#fff',
        align: 'center',
        anchor: 'center',
        formatter: (value: number, context: any) => {
          return value > threshold ? `$${context.dataset.label}` : ''
        },
      },
    },
  }

  return (
    <>
      <Typography
        sx={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          my: 2,
        }}
      >
        VaR $
        {totalValue.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </Typography>
      <Box
        sx={{
          width: '100%',
          marginBottom: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Bar data={chartData} options={options as ChartOptions<'bar'>} />
        <Box sx={{ textAlign: 'center', marginTop: 2, width: '100%' }}>
          {topThreeAssets.map((asset, index) => (
            <Typography key={index} sx={{ mt: 1 }}>
              {asset}
            </Typography>
          ))}
        </Box>
      </Box>
    </>
  )
}

const getColorForAsset = (assetName: string) => {
  let hash = 0
  for (let i = 0; i < assetName.length; i++) {
    hash = assetName.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360

  return `hsl(${hue}, 80%, 60%)`
}

export default VaRLiveGraph
