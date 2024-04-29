import { BlockVarViewModel } from '@/shared/api/viewModels/SyncStatusEndpoint'
import {
  getColorForAsset,
  getColorForItem,
} from '@/components/charts/utils/shared'

export type ViewMode = 'all' | 'by_contract' | 'by_type'

export type ChartDataset = {
  label: string
  data: { x: string; y: number }[]
  backgroundColor: string
  borderColor: string
  borderWidth: number
  tension: number
  fill: boolean
  pointRadius: number
}

export const transformData = (
  dataSection: BlockVarViewModel[],
  viewMode: ViewMode
): { datasets: ChartDataset[]; labels: string[] } => {
  const labels = Array.from(
    new Set(dataSection.map((entry) => entry.timestamp.toString()))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  const uniqueItems = new Set<string>()
  dataSection.forEach((entry) => {
    if (viewMode === 'by_contract') {
      entry.by_contract.forEach((contract) =>
        uniqueItems.add(getContractLabel(contract))
      )
    } else if (viewMode === 'by_type') {
      entry.by_type.forEach((type) => uniqueItems.add(type.type))
    }
  })

  const datasets: ChartDataset[] = Array.from(uniqueItems).map((item) => {
    const data = labels.map((timestamp) => {
      const entry = dataSection.find(
        (entry) => entry.timestamp.toString() === timestamp
      )
      if (entry) {
        if (viewMode === 'by_contract') {
          const color = getColorForAsset(item)
          const contract = entry.by_contract.find(
            (contract) => getContractLabel(contract) === item
          )
          return { x: timestamp, y: contract ? contract.var_usd : 0 }
        } else if (viewMode === 'by_type') {
          const color = getColorForItem(item)
          const type = entry.by_type.find((type) => type.type === item)
          return { x: timestamp, y: type ? type.var_usd : 0 }
        }
      }
      return { x: timestamp, y: 0 }
    })

    const color =
      viewMode == 'by_contract' ? getColorForAsset(item) : getColorForItem(item)
    return {
      label: item,
      data,
      backgroundColor: color,
      borderColor: color.replace('0.5', '1'),
      borderWidth: 1,
      tension: 0.1,
      fill: true,
      pointRadius: 0,
    }
  })

  if (viewMode === 'all') {
    const data = labels.map((timestamp) => {
      const entry = dataSection.find(
        (entry) => entry.timestamp.toString() === timestamp
      )
      const sum = entry
        ? entry.by_type.reduce((acc, type) => acc + type.var_usd, 0)
        : 0
      return { x: timestamp, y: sum }
    })

    datasets.push({
      label: 'All',
      data,
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
      tension: 0.1,
      fill: true,
      pointRadius: 0,
    })
  }

  return { datasets, labels }
}

const getContractLabel = (contract: any): string => {
  if (contract.symbol) {
    return contract.symbol
  } else if (contract.address) {
    return contract.address
  } else {
    return 'Unknown Contract'
  }
}
