import React from 'react'
import { Box, Typography } from '@mui/material'

const Header = () => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '3%',
      }}
    >
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          fontFamily: 'Arial',
          color: 'var(--text-color)',
          letterSpacing: '0.15rem',
          fontWeight: 'bold',
          marginBottom: '20px',
        }}
      >
        L2 Finality
      </Typography>
    </Box>
  )
}

export default Header
