import { SxProps, Theme } from '@mui/material/styles'

export const graphPaperStyle: SxProps<Theme> = {
  padding: 3,
  margin: (theme) => `${theme.spacing(3)} auto`, // Add vertical margin for separation
  backgroundColor: 'var(--light-background-color)',
  boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  borderRadius: '8px',
  maxWidth: '94%',
}
