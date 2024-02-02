import React from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import { ChartOptions, ChartData } from 'chart.js'

// Assuming commonOptions is imported from your chartStyles
import { commonOptions } from './chartStyles'
import { formatNumber } from '@/utils/utils'

const AssetsAtRiskChart: React.FC = () => {
  const data: ChartData<'line'> = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
    ], // Example time series labels
    datasets: [
      {
        label: 'Effective Assets at Risk',
        data: [
          1000000, 1300000, 1100000, 1900000, 2500000, 3000000, 2500000,
          3000000, 1900000, 2500000,
        ], // Mock data points
        borderColor: 'var(--text-color)',
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    ...commonOptions,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        ticks: {
          // @ts-ignore
          callback: (value) => `$${formatNumber(value)}`,
        },
      },
      x: {},
    },
  }

  return <Line data={data} options={options} />
}

export default AssetsAtRiskChart
