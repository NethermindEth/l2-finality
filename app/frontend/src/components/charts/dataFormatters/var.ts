import { BlockVarViewModel } from '@/shared/api/viewModels/SyncStatusEndpoint'

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
  let labels = new Set<string>()
  dataSection.forEach((entry) => {
    labels.add(entry.timestamp.toString())
  })

  let sortedLabels = Array.from(labels).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  if (viewMode === 'by_contract') {
    const datasets: ChartDataset[] = []
    dataSection.forEach((entry) => {
      entry.by_contract.forEach((contract) => {
        const label = getContractLabel(contract)
        const existingDataset = datasets.find(
          (dataset) => dataset.label === label
        )
        if (existingDataset) {
          existingDataset.data.push({
            x: entry.timestamp.toString(),
            y: contract.var_usd,
          })
        } else {
          const color = getColorForAsset(label, 0.5)
          const newDataset: ChartDataset = {
            label,
            data: [{ x: entry.timestamp.toString(), y: contract.var_usd }],
            backgroundColor: color,
            borderColor: color.replace('0.5', '1'),
            borderWidth: 1,
            tension: 0.1,
            fill: true,
            pointRadius: 0,
          }
          datasets.push(newDataset)
        }
      })
    })
    return {
      datasets,
      labels: datasets.flatMap((dataset) => dataset.data.map((d) => d.x)),
    }
  } else if (viewMode === 'by_type') {
    const datasets: any[] = dataSection.reduce((acc, entry) => {
      entry.by_type.forEach((type) => {
        const existingDataset = acc.find(
          (dataset: any) => dataset.label === type.type
        )
        if (existingDataset) {
          // @ts-ignore
          existingDataset.data.push({
            x: entry.timestamp.toString(),
            y: type.var_usd,
          })
        } else {
          const color = getColorForAsset(type.type, 0.5)
          const newDataset: ChartDataset = {
            label: type.type,
            data: [{ x: entry.timestamp.toString(), y: type.var_usd }],
            backgroundColor: color,
            borderColor: color.replace('0.5', '1'),
            borderWidth: 1,
            tension: 0.1,
            fill: true,
            pointRadius: 0,
          }
          // @ts-ignore
          acc.push(newDataset)
        }
      })
      return acc
    }, [])
    return { datasets, labels: sortedLabels }
  } else {
    const data = dataSection.map((entry) => {
      const sum = entry.by_type.reduce((acc, type) => acc + type.var_usd, 0)
      return { x: entry.timestamp.toString(), y: sum }
    })
    return {
      datasets: [
        {
          label: 'All',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          tension: 0.1,
          fill: true,
          pointRadius: 0,
        },
      ],
      labels: sortedLabels,
    }
  }
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

const getColorForAsset = (assetName: string, alpha: number) => {
  let hash = 0
  for (let i = 0; i < assetName.length; i++) {
    hash = assetName.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = Math.abs(hash) % 360

  return `hsla(${hue}, 80%, 60%, ${alpha})`
}
