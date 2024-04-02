import * as React from 'react'
import { Box, Divider, Grid, Paper, Typography } from '@mui/material'
import '@/app/globals.css'
import RootLayout from '@/components/RootLayout'
import ChainSelector from '@/components/ChainSelector'
import { HealthStatusViewModel } from '@/shared/api/viewModels/HealthEndpoint'
import { healthApi } from '@/api/healthApi'
import { metadataApi } from '@/api/metadataApi'
import { syncStatusApi } from '@/api/syncStatusApi'
import { MetadataRecordViewModel } from '@/shared/api/viewModels/MetadataEndpoint'
import {
  SyncStatusViewModel,
  VaRLiveDataViewModel,
} from '@/shared/api/viewModels/SyncStatusEndpoint'
import VaRLiveSection from './VaRLiveSection'
import VaRHistoryChart from '@/components/charts/VaRHistoryChart'
import SyncStatusTable from '@/components/charts/SyncStatusTable'
import moment from 'moment'
import { dropdownCardPaperStyle } from '@/styles/dropdownCardStyles'
import FinalityTimeseries from '@/components/charts/FinalityTimeseries'
import { blocksApi } from '@/api/blocksApi'
import { LatestBlockViewModel } from '@/shared/api/viewModels/BlocksEndpoint'
import IndexerStatus from '@/components/ui/IndexerStatus'

const pageTitle: string = 'L2 Finality Dashboard'
const pageDescription: string =
  'Access up-to-date Layer 2 blockchain analytics with the L2 Finality Dashboard. Compare network performance, track transaction speeds, and get insights into blockchain efficiency. Suitable for blockchain professionals and enthusiasts'

export const FETCH_LIVE_DATA_INTERVAL_MS = 10000

const Index = () => {
  const [chainId, setChainId] = React.useState<number>(10)
  const [latestBlock, setLatestBlock] = React.useState<LatestBlockViewModel>({
    data: {},
  })
  const [healthData, setHealthData] = React.useState<
    HealthStatusViewModel | undefined
  >(undefined)
  const [ethereumMetadata, setEthereumMetadata] =
    React.useState<MetadataRecordViewModel>({ data: {} })
  const [liveVarData, setLiveVarData] = React.useState<VaRLiveDataViewModel>({
    data: [],
  })

  React.useEffect(() => {
    const fetchLiveData = async () => {
      try {
        const latest = await blocksApi.getLatestBlock(chainId)
        setLatestBlock(latest)
        const healthData = await healthApi.getHealthData()
        setHealthData(healthData)
        const metadata = await metadataApi.getAll()
        const syncStatusLiveVar = await syncStatusApi.getLiveVaR(chainId)
        setLiveVarData(syncStatusLiveVar)

        const metadataRecord = metadata.data.metadataRecords[0]
        setEthereumMetadata(metadataRecord)
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
  }, [chainId])

  const [syncStatusRecords, setSyncStatusRecords] =
    React.useState<SyncStatusViewModel>({ data: [] })
  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(5)

  React.useEffect(() => {
    const fetchPaginatedData = async () => {
      try {
        const data = await syncStatusApi.getPaginatedEvents(
          chainId,
          page + 1,
          pageSize
        )
        setSyncStatusRecords(data)
      } catch (error) {
        console.error('Error fetching paginated data:', error)
        setSyncStatusRecords({ data: [] })
      }
    }

    fetchPaginatedData()
  }, [page, pageSize, chainId])

  const handleChainChange = (newChainId: number) => {
    setChainId(newChainId)
  }

  return (
    <RootLayout title={pageTitle} description={pageDescription}>
      <IndexerStatus healthData={healthData} />

      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          {/* Select chain Section */}
          <Grid item xs={12}>
            <Paper sx={dropdownCardPaperStyle}>
              <ChainSelector onChainChange={handleChainChange} />
              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontSize: '0.875rem', color: 'gray' }}>
                L2 Head: {latestBlock.data.l2_block_number},{' '}
                {moment.utc(latestBlock.data.l2_block_timestamp).fromNow()}
              </Typography>
              <Typography sx={{ fontSize: '0.875rem', color: 'gray' }}>
                L1 Head: {ethereumMetadata.value},{' '}
                {moment.utc(ethereumMetadata.updated_at).fromNow()}
              </Typography>
            </Paper>
          </Grid>

          {/* LiveVaR Section */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <VaRLiveSection liveVarData={liveVarData} />
          </Grid>

          {/* History VaR Section */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <VaRHistoryChart chainId={chainId} />
          </Grid>

          {/* Finality Section */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
            <FinalityTimeseries chainId={chainId} />
          </Grid>

          {/* Table Section */}
          <Grid
            item
            xs={12}
            sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}
          >
            <SyncStatusTable
              data={syncStatusRecords.data}
              chainId={chainId}
              page={page}
              pageSize={pageSize}
              totalRows={50}
              onPageChange={(newPage) => setPage(newPage)}
              onRowsPerPageChange={(newPageSize) => setPageSize(newPageSize)}
            />
          </Grid>
        </Grid>
      </Box>
    </RootLayout>
  )
}

export default Index
