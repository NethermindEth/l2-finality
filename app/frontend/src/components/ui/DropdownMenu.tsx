import React, { useState } from 'react'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Image from 'next/image'
const menuItemStyles = {
  display: 'flex',
  alignItems: 'center',
}
import chains from '@/shared/chains.json'
import { Box, Typography } from '@mui/material'

const DropdownMenu: React.FC<{ onChainChange: (chainId: number) => void }> = ({
  onChainChange,
}) => {
  const options = chains
  const [selectedValue, setSelectedValue] = useState<number>(
    Object.values(options)[1].chainId
  )

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedChainId = event.target.value as number
    setSelectedValue(selectedChainId)
    onChainChange(selectedChainId)
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
          {renderMenuItem(value as number)}
        </div>
      )}
    >
      {Object.entries(options)
        .filter(([_, { isFrontendEnabled }]) => isFrontendEnabled) // Filter options where isFrontendEnabled is true
        .map(([chainName, { chainId, frontEndName }]) => (
          <MenuItem key={chainId} value={chainId}>
            <Image
              className="mr-3"
              src={`/icons/${chainName.toLowerCase().replace(/\s+/g, '-')}.png`}
              alt={`${chainName} logo`}
              width={25}
              height={25}
            />
            {frontEndName}
          </MenuItem>
        ))}
    </Select>
  )
}

const renderMenuItem = (chainId: number) => {
  const chainEntry = Object.entries(chains).find(
    ([, { chainId: id }]) => id === chainId
  )
  if (!chainEntry) return null // Handle the case where the chainEntry is undefined

  const [chainName, { frontEndName }] = chainEntry
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Image
        className="mr-3"
        src={`/icons/${chainName.toLowerCase().replace(/\s+/g, '-')}.png`}
        alt={`${chainName} logo`}
        width={25}
        height={25}
      />
      <Typography>{frontEndName}</Typography>
    </Box>
  )
}

export default DropdownMenu
