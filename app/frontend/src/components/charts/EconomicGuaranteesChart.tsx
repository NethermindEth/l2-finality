import React from 'react'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'
import { ChartOptions, ChartData } from 'chart.js'

import { commonOptions } from './chartStyles'

interface Dataset {
  label: string
  data: number[]
  borderColor: string
  borderWidth: number
  stepped: boolean
}

const EconomicGuaranteesChart: React.FC = () => {
  const data: ChartData<'line'> = {
    labels: [
      'Block Production',
      'L2 Consensus',
      'L2 Proof Generation',
      'L1 Proof Verification',
    ],
    datasets: [
      {
        label: 'Sequencer',
        data: [0, 50, 50, 75],
        borderColor: 'green',
        borderWidth: 2,
        stepped: true,
      },
      {
        label: 'Full Node',
        data: [0, 0, 50, 75],
        borderColor: 'skyblue',
        borderWidth: 2,
        stepped: true,
      },
      {
        label: 'Light Node',
        data: [0, 0, 0, 75],
        borderColor: 'lightcoral',
        borderWidth: 2,
        stepped: true,
      },
    ],
  }

  return <Line data={data} options={commonOptions as ChartOptions<'line'>} />
}

export default EconomicGuaranteesChart
