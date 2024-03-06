import * as React from 'react'
import { Box, Grid, Paper, Typography } from '@mui/material'
import '@/app/globals.css'
import RootLayout from '@/components/RootLayout'
import AverageStats from '@/components/ui/AverageStats'
import { averageStatsPaperStyle } from '@/styles/averageStatsStyles'
import EconomicGuaranteesChart from '@/components/charts/EconomicGuaranteesChart'
import AssetsAtRiskChart from '@/components/charts/AssetsAtRiskChart'
import { graphPaperStyle } from '@/styles/graphCardStyles'
import LastReorgsTable from '@/components/charts/LastReorgsTable'
import ChainSelector from '@/components/ChainSelector'
import { HealthStatusViewModel } from '../../../shared/api/viewModels/HealthEndpoint'
import { healthApi } from '@/api/healthApi'
import { metadataApi } from '@/api/metadataApi'
import { MetadataRecordViewModel } from '../../../shared/api/viewModels/MetadataEndpoint'
import AutoIncrementComponent from '@/components/ui/AutoIncrement'

const pageTitle: string = 'L2 Finality Dashboard'
const pageDescription: string =
  'Access up-to-date Layer 2 blockchain analytics with the L2 Finality Dashboard. Compare network performance, track transaction speeds, and get insights into blockchain efficiency. Suitable for blockchain professionals and enthusiasts'

export const FETCH_LIVE_DATA_INTERVAL_MS = 10000

const Index = () => {
  const [chainId, setChainId] = React.useState<number>(10)

  const [healthData, setHealthData] = React.useState<
    HealthStatusViewModel | undefined
  >(undefined)
  const [ethereumMetadata, setEthereumMetadata] = React.useState<
    MetadataRecordViewModel | undefined
  >(undefined)
  const [initialethereumMetadata, setInitialEthereumMetadata] = React.useState<
    MetadataRecordViewModel | undefined
  >(undefined)

  React.useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const healthData = await healthApi.getHealthData()
        const metadata = await metadataApi.getAll()
        setHealthData(healthData)
        const metadataRecord = metadata.data.metadataRecords[0]
        setEthereumMetadata(metadataRecord)
        setInitialEthereumMetadata(metadataRecord)
      } catch (error) {
        console.error('Error fetching health data:', error)
        const intervalId = setInterval(
          fetchLiveData,
          FETCH_LIVE_DATA_INTERVAL_MS
        )
      }
    }

    fetchLiveData()
    const intervalId = setInterval(fetchLiveData, FETCH_LIVE_DATA_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [])

  const handleChainChange = (newChainId: number) => {
    setChainId(newChainId)
    console.log('Chain changed to:', newChainId)
    // Fetch data for the new chainId here
  }

  return (
    <RootLayout title={pageTitle} description={pageDescription}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          {/* Select chain Section */}
          <ChainSelector onChainChange={handleChainChange} />
          <Typography variant="h6">Chain ID: {chainId}</Typography>
          <Paper sx={graphPaperStyle}>
            {initialethereumMetadata !== undefined &&
              ethereumMetadata !== undefined && (
                <AutoIncrementComponent
                  initialValue={initialethereumMetadata.value}
                  newValue={ethereumMetadata.value}
                />
              )}

            <Typography variant="h6">Health Data</Typography>
            {healthData ? (
              <Typography>{`Ping: ${healthData.ping}`}</Typography>
            ) : (
              <Typography>Loading health data...</Typography>
            )}
            {ethereumMetadata ? (
              <Typography>{`Metadata: ${ethereumMetadata.value}`}</Typography>
            ) : (
              <Typography>Loading metadata...</Typography>
            )}
          </Paper>

          {/* Average stats section */}
          <Grid item xs={4} md={4}>
            <Paper sx={averageStatsPaperStyle}>
              <AverageStats
                label="VaR"
                prefix="$"
                comparisonPeriod="week"
                value={8902123}
                percentageChange={-0.051345}
              ></AverageStats>
            </Paper>
          </Grid>
          <Grid item xs={4} md={4}>
            <Paper sx={averageStatsPaperStyle}>
              <AverageStats
                label="Reorg frequency"
                comparisonPeriod="week"
                value={2}
              ></AverageStats>
            </Paper>
          </Grid>
          <Grid item xs={4} md={4}>
            <Paper sx={averageStatsPaperStyle}>
              <AverageStats
                label="Monetary impact of reorgs"
                prefix="$"
                comparisonPeriod="month"
                value={18902123}
                percentageChange={0.02345}
              ></AverageStats>
            </Paper>
          </Grid>

          {/* Graphs Section */}
          <Grid item xs={12}>
            <Paper sx={graphPaperStyle}>
              <Typography>Graph: value / time</Typography>
              <EconomicGuaranteesChart />
            </Paper>

            <Paper sx={graphPaperStyle}>
              <Typography>Graph: value / time</Typography>
              <AssetsAtRiskChart />
            </Paper>
          </Grid>

          {/* Table Section */}
          <Grid item xs={12}>
            <Paper sx={graphPaperStyle}>
              <Typography>Table: Last reversions - value</Typography>
              <LastReorgsTable />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </RootLayout>
  )
}

export default Index
