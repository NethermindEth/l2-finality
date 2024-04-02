import React, { useEffect, useState } from 'react'
import {
  Box,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material'
import VaRLiveGraph from '@/components/charts/VaRLiveChart'
import { syncStatusApi } from '@/api/syncStatusApi'
import {
  BlockVarViewModel,
  VarByContractViewModel, VarByTypeViewModel,
  VaRLiveDataViewModel,
} from '@/shared/api/viewModels/SyncStatusEndpoint'

interface VaRLiveSectionProps {
  chainId: number
}

interface DataCategory {
  name: string
  dataKey: keyof BlockVarViewModel
}

const VaRLiveSection: React.FC<VaRLiveSectionProps> = ({ chainId }) => {
  const [liveVarData, setLiveVarData] = useState<VaRLiveDataViewModel | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const syncStatusLiveVar = await syncStatusApi.getLiveVaR(chainId)
        setLiveVarData(syncStatusLiveVar)
      } catch (error) {
        console.error('Error fetching live VaR data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chainId])

  const dataCategories: DataCategory[] = [
    { name: 'By Contract', dataKey: 'by_contract' },
    { name: 'By Type', dataKey: 'by_type' },
  ]

  const validDataSections =
    liveVarData && liveVarData.success
      ? dataCategories.filter((category) => {
          const data = liveVarData.data[category.dataKey]
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

  if (!liveVarData || !liveVarData.success) {
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
          No data found
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
        Live VaR
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
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {section.name}
                  </Typography>
                  <VaRLiveGraph
                    data={
                      liveVarData.data[section.dataKey] as
                        | VarByContractViewModel[]
                        | VarByTypeViewModel[]
                    }
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" align="center" margin={10}>
            No data found.
          </Typography>
        )}
      </Container>
    </Paper>
  )
}

export default VaRLiveSection
