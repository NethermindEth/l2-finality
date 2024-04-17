import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import 'chart.js/auto'
import { Box, Typography } from '@mui/material'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Chart, ChartOptions } from 'chart.js'
import {
  ValueType,
  VarByContractViewModel,
  VarByTypeViewModel,
} from '@/shared/api/viewModels/SyncStatusEndpoint'
import { getColorForItem } from '@/components/charts/utils/shared'

Chart.register(ChartDataLabels)

interface VaRLiveBarChartGraphProps {
  data: VarByContractViewModel[] | VarByTypeViewModel[]
}

const VaRLiveBarChart: React.FC<VaRLiveBarChartGraphProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography>Error fetching data.</Typography>
  }

  const isContractData = (
    item: VarByContractViewModel | VarByTypeViewModel
  ): item is VarByContractViewModel => {
    return (item as VarByContractViewModel).address !== undefined
  }

  const totalValue = data.reduce((acc, item) => acc + item.var_usd, 0)
  const threshold = totalValue * 0.05

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const topThreeItems = useMemo(() => {
    return data
      .sort((a, b) => b.var_usd - a.var_usd)
      .slice(0, 3)
      .map((item, index) => {
        const label = isContractData(item)
          ? item.symbol || item.address
          : item.type.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
        return `${index + 1}. ${label}, $${item.var_usd.toLocaleString()}`
      })
  }, [data])

  const chartData = {
    labels: ['Total VaR'],
    datasets: data.map((item) => {
      const label = isContractData(item)
        ? item.symbol || item.address
        : ValueType[item.type as keyof typeof ValueType]
            .replace(/_/g, ' ')
            .replace(/^\w/, (c) => c.toUpperCase())
      return {
        label,
        data: [item.var_usd],
        backgroundColor: getColorForItem(label),
      }
    }),
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
          const isContractLabel = isContractData(data[context.datasetIndex])
          return value > threshold
            ? isContractLabel
              ? `$${context.dataset.label}`
              : context.dataset.label
            : ''
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
        {isContractData(data[0]) ? (
          <>
            VaR $
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </>
        ) : (
          <>
            VaR{' '}
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </>
        )}
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
          {topThreeItems.map((item, index) => (
            <Typography key={index} sx={{ mt: 1 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    </>
  )
}

export default VaRLiveBarChart
