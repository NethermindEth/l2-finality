import { SxProps, Theme } from '@mui/material/styles'

export const graphPaperStyle: SxProps<Theme> = {
  padding: 3,
  margin: (theme) => `${theme.spacing(3)} auto`, // Add vertical margin for separation
  backgroundColor: 'var(--light-background-color)',
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  maxWidth: '1000px',
  '@media (max-width: 1000px)': {
    margin: '0 30px', // Adjust the margins for smaller screens
  },
}
