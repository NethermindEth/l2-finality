import * as React from 'react'
import { Box, Grid, Paper, Typography } from '@mui/material'
import '@/app/globals.css'

import DropdownMenu from '@/components/ui/DropdownMenu'
import RootLayout from '@/components/RootLayout'
import AverageStats from '@/components/ui/AverageStats'
import { averageStatsPaperStyle } from '@/styles/averageStatsStyles'
import { dropdownCardPaperStyle } from '@/styles/dropdownCardStyles'
import EconomicGuaranteesChart from '@/components/charts/EconomicGuaranteesChart'
import AssetsAtRiskChart from '@/components/charts/AssetsAtRiskChart'
import { graphPaperStyle } from '@/styles/graphCardStyles'
import LastReorgsTable from '@/components/charts/LastReorgsTable'
import AutoIncrementComponent from '@/components/ui/AutoIncrement'

const pageTitle: string = 'L2 Finality Dashboard'
const pageDescription: string =
  'Access up-to-date Layer 2 blockchain analytics with the L2 Finality Dashboard. Compare network performance, track transaction speeds, and get insights into blockchain efficiency. Suitable for blockchain professionals and enthusiasts'

const Index = () => {
  return (
    <RootLayout title={pageTitle} description={pageDescription}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          {/* Select chain Section */}
          <Grid item xs={12}>
            <Paper sx={dropdownCardPaperStyle}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    paddingLeft: '8px',
                  }}
                >
                  Select chain
                </Typography>
                <DropdownMenu />
                <AutoIncrementComponent />
              </Box>
            </Paper>
          </Grid>

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
