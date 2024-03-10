import { Box, Paper, Typography, Grid } from '@mui/material'
import { dropdownCardPaperStyle } from '@/styles/dropdownCardStyles'
import DropdownMenu from '@/components/ui/DropdownMenu'

const ChainSelector = ({
  onChainChange,
}: {
  onChainChange: (chainId: number) => void
}) => {
  return (
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
      <DropdownMenu onChainChange={onChainChange} />
    </Box>
  )
}

export default ChainSelector
