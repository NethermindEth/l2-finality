import React, { useEffect, useState } from 'react'
import {
  Box,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material'
import VaRLiveBarChart from '@/components/charts/VaRLiveBarChart'
import { syncStatusApi } from '@/api/syncStatusApi'
import {
  BlockVarViewModel,
  VarByContractViewModel,
  VarByTypeViewModel,
  VaRHistoryDataViewModel,
} from '@/shared/api/viewModels/SyncStatusEndpoint'
import { FETCH_LIVE_DATA_INTERVAL_MS } from '@/pages/index'
import VaRLiveLineChart from '@/components/charts/VaRLiveLineChart'

interface VaRLiveSectionProps {
  chainId: number
}

interface DataCategory {
  name: string
  dataKey: keyof BlockVarViewModel
}

const VaRLiveSection: React.FC<VaRLiveSectionProps> = ({ chainId }) => {
  const [historyVarData, setHistoryVarData] =
    useState<VaRHistoryDataViewModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const syncStatusHistoryVar = await syncStatusApi.getHistoryVaR(chainId)
        setHistoryVarData(syncStatusHistoryVar)
      } catch (error) {
        console.error('Error fetching live VaR data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const intervalId = setInterval(fetchData, FETCH_LIVE_DATA_INTERVAL_MS)
    return () => {
      clearInterval(intervalId)
    }
  }, [chainId])

  const dataCategories: DataCategory[] = [
    { name: 'By contract', dataKey: 'by_contract' },
    { name: 'By type ', dataKey: 'by_type' },
  ]

  const validDataSections =
    historyVarData &&
    historyVarData.success &&
    historyVarData.data &&
    historyVarData.data.length > 0
      ? dataCategories.filter((category) => {
          const lastDataEntry =
            historyVarData.data[historyVarData.data.length - 1]
          const data =
            lastDataEntry &&
            lastDataEntry[category.dataKey as keyof BlockVarViewModel]
          return Array.isArray(data) && data.length > 0
        })
      : []

  if (loading) {
    return (
      <Paper
        sx={{
          p: 2,
          borderRadius: 4,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '80%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <CircularProgress />
        <Typography variant="body1" align="center" sx={{ mt: 2 }}>
          Loading ...
        </Typography>
      </Paper>
    )
  }

  if (!historyVarData || !historyVarData.success) {
    return (
      <Paper
        sx={{
          p: 2,
          borderRadius: 4,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '80%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
        }}
      >
        <Typography variant="body1" align="center" sx={{ mt: 2 }}>
          No data found. L2 block head may be behind.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 4,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '80%',
      }}
    >
      <Box sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
        Current L2 value at risk
      </Box>
      <Box sx={{ padding: 2 }}>
        <VaRLiveLineChart liveVarData={historyVarData.data} />
      </Box>
      <Container>
        {validDataSections.length > 0 ? (
          <Grid container spacing={2}>
            {validDataSections.map((section) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={Math.floor(12 / validDataSections.length)}
                key={section.name}
              >
                <Paper
                  elevation={0}
                  sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 2 }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 1,
                      ml: 1,
                      mt: 1,
                      fontWeight: 'bold',
                      color: 'darkgrey',
                    }}
                  >
                    {section.name}
                  </Typography>
                  <VaRLiveBarChart
                    data={
                      historyVarData.data[historyVarData.data.length - 1][
                        section.dataKey
                      ] as VarByContractViewModel[] | VarByTypeViewModel[]
                    }
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" align="center" margin={10}>
            No data found. L2 block head may be behind.
          </Typography>
        )}
      </Container>
    </Paper>
  )
}

export default VaRLiveSection
