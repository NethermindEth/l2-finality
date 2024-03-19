import React from 'react'
import { Box, Container, Grid, Paper, Typography } from '@mui/material'
import VaRLiveGraph from '@/components/charts/VaRLiveChart'
import {
  VaRLiveDataViewModel,
  LiveVaREntry,
} from '@/shared/api/viewModels/SyncStatusEndpoint'

interface FinalitySectionProps {
  liveVarData: VaRLiveDataViewModel
}

interface DataCategory {
  name: string
  dataKey: keyof VaRLiveDataViewModel['data']
}

const VaRLiveSection: React.FC<FinalitySectionProps> = ({ liveVarData }) => {
  const dataCategories: DataCategory[] = [
    { name: 'Data Submission', dataKey: 'data_submission' },
    { name: 'L2 Finalization', dataKey: 'l2_finalization' },
    { name: 'Proof Submission', dataKey: 'proof_submission' },
    { name: 'State Updates', dataKey: 'state_updates' },
  ]

  const validDataSections = liveVarData
    ? dataCategories.filter(
        (category) =>
          liveVarData.data[category.dataKey] &&
          Object.keys(liveVarData.data[category.dataKey]).length > 0
      )
    : []

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
        Live, VaR
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
                    dataSection={
                      liveVarData.data[section.dataKey] as LiveVaREntry
                    }
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body1" align="center" margin={10}>
            No data available, L2 head may be behind.
          </Typography>
        )}
      </Container>
    </Paper>
  )
}

export default VaRLiveSection
