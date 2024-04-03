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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value
    if (dateString) {
      const date = new Date(dateString)
      onChange(date)
    } else {
      onChange(null)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60 * 1000
    )
    return localDate.toISOString().slice(0, 16)
  }

  return (
    <TextField
      label={label}
      type="datetime-local"
      value={formatDate(value)}
      onChange={handleChange}
      fullWidth
      InputLabelProps={{ shrink: true }}
    />
  )
}

export default DatePickerComponent
