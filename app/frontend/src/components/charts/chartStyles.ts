import { ChartOptions } from 'chart.js'

export const commonOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: true,
        drawOnChartArea: true,
        drawTicks: true,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'end',
    },
  },
}
