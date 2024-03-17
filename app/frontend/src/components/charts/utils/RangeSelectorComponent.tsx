import React from 'react'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { GroupRange } from '../../../../../shared/api/types'

interface RangeSelectorProps {
  value: GroupRange
  onChange: () => void
}

const RangeSelectorComponent: React.FC<RangeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel>Range</InputLabel>
      <Select value={value} onChange={onChange} label="Range">
        <MenuItem value="hour">Hour</MenuItem>
        <MenuItem value="day">Day</MenuItem>
        <MenuItem value="week">Week</MenuItem>
        <MenuItem value="month">Month</MenuItem>
        <MenuItem value="quarter">Quarter</MenuItem>
      </Select>
    </FormControl>
  )
}

export default RangeSelectorComponent
