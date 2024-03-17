import React from 'react'
import { Box, Typography } from '@mui/material'
import { HealthStatusViewModel } from '@/shared/api/viewModels/HealthEndpoint'

interface Props {
  healthData?: HealthStatusViewModel | null
}

const IndexerStatus: React.FC<Props> = ({ healthData }) => {
  const getStatusColor = () => {
    if (!healthData) {
      return '#6c757d' // Gray color for unreachable status
    }
    return healthData.ping ? '#28a745' : '#dc3545' // Green for live, red for dead
  }

  const getStatusText = () => {
    if (!healthData) {
      return 'Unreachable'
    }
    return healthData.ping ? 'Live' : 'Dead'
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '20px',
        padding: '6px 12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(),
          marginRight: '8px',
        }}
      />
      <Typography variant="body2" component="span">
        Status: {getStatusText()}
      </Typography>
    </Box>
  )
}

export default IndexerStatus
