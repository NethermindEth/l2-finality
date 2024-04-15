import React from 'react'
import { ViewMode } from '@/components/charts/dataFormatters/var'
import { ToggleButton, ToggleButtonGroup, styled } from '@mui/material'

interface VaRTypeSelectorProps {
  viewMode: ViewMode
  onViewModeChange: (viewMode: ViewMode) => void
}

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}))

const VaRTypeSelectorComponent: React.FC<VaRTypeSelectorProps> = ({
  viewMode,
  onViewModeChange,
}) => {
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode
  ) => {
    if (newViewMode !== null) {
      onViewModeChange(newViewMode)
    }
  }

  return (
    <StyledToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleViewModeChange}
      aria-label="text alignment"
    >
      <ToggleButton value="all" aria-label="all">
        All
      </ToggleButton>
      <ToggleButton value="by_contract" aria-label="by contract">
        By Contract
      </ToggleButton>
      <ToggleButton value="by_type" aria-label="by type">
        By Type
      </ToggleButton>
    </StyledToggleButtonGroup>
  )
}

export default VaRTypeSelectorComponent
