import React, { useState } from 'react'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Image from 'next/image'
import { getValueLabel } from '@/utils/utils'

const menuItemStyles = {
  display: 'flex',
  alignItems: 'center',
}

export const dropdownMenuOptions: Record<string, string> = {
  optimism: 'Optimism',
  starknet: 'Starknet',
  polygonzkevm: 'Polygon zkEVM',
}

const renderMenuItem = (value: string) => {
  const label: string = getValueLabel(value)
  return (
    <MenuItem value={value} sx={menuItemStyles}>
      <div
        style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}
      >
        <Image
          src={`/icons/${value.toLowerCase().replace(/\s+/g, '-')}.png`}
          alt={`${label} logo`}
          width={30}
          height={30}
        />
      </div>
      <span style={{ marginLeft: '5px' }}>{label}</span>
    </MenuItem>
  )
}

const DropdownMenu: React.FC = () => {
  const options: string[] = Object.keys(dropdownMenuOptions)
  const [selectedValue, setSelectedValue] = useState<string>(options[0])

  const handleChange = (event: React.ChangeEvent<{ value: string }>) => {
    setSelectedValue(event.target.value)
  }

  return (
    <Select
      value={selectedValue}
      // @ts-ignore
      onChange={handleChange}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '50%',
      }}
      renderValue={(value) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {renderMenuItem(value as string)}
        </div>
      )}
    >
      {options.map((option) => renderMenuItem(option))}
    </Select>
  )
}

export default DropdownMenu
