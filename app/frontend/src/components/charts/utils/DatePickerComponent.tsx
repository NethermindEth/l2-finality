import React from 'react'
import { TextField } from '@mui/material'

interface DatePickerComponentProps {
  label: string
  value: Date | null
  onChange: (newValue: Date | null) => void
}

const DatePickerComponent: React.FC<DatePickerComponentProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <TextField
      label={label}
      type="date"
      value={value ? value.toISOString().substring(0, 10) : ''}
      onChange={(e) =>
        onChange(e.target.value ? new Date(e.target.value) : null)
      }
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  )
}

export default DatePickerComponent
