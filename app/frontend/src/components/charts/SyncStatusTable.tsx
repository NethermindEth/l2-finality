import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Button,
  Collapse,
  Link,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import chains from '@/shared/chains.json'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import moment from 'moment'

interface SyncStatusRecord {
  l2_block_number: string
  l2_block_hash: string
  l1_block_number: string
  l1_block_hash: string
  timestamp: string
  submission_type: string
}

interface TableProps {
  data: SyncStatusRecord[]
  chainId: number
  page: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (pageSize: number) => void
}

const theme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f5f5f5',
          color: '#000',
          fontWeight: 'bold',
        },
        body: {
          fontSize: 14,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#fafafa',
          },
          '&:hover': {
            backgroundColor: '#f0f0f0',
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        selectIcon: {
          color: '#1976d2',
        },
      },
    },
  },
})

const SyncStatusTable: React.FC<TableProps> = ({
  data,
  chainId,
  page,
  pageSize,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onRowsPerPageChange(parseInt(event.target.value))
  }

  const getSubmissionTypeName = (submissionType: string) => {
    const dataCategories = [
      { name: 'Data Submission', dataKey: 'data_submission' },
      { name: 'L2 Finalization', dataKey: 'l2_finalization' },
      { name: 'Proof Submission', dataKey: 'proof_submission' },
      { name: 'State Updates', dataKey: 'state_updates' },
    ]

    const category = dataCategories.find(
      (category) => category.dataKey === submissionType
    )
    return category ? category.name : submissionType
  }

  const getExplorerLink = (blockNumber: string, isL2: boolean) => {
    const chain = Object.values(chains).find(
      (chain) => chain.chainId === chainId
    )
    const explorerUri = isL2
      ? chain?.explorerUri
      : chains['Ethereum'].explorerUri
    return `${explorerUri}/block/${blockNumber}`
  }

  const trimHash = (hash: string | null) => {
    if (!hash) {
      return ''
    }

    if (hash.length <= 20) {
      return hash
    }
    const start = hash.slice(0, 4)
    const end = hash.slice(-3)
    return `${start}...${end}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <ThemeProvider theme={theme}>
      <Paper
        sx={{
          p: 2,
          borderRadius: 4,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '80%',
        }}
      >
        <Box sx={{ mb: isOpen ? 2 : 0 }}>
          <Button
            onClick={() => setIsOpen(!isOpen)}
            endIcon={isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            sx={{
              color: 'text.secondary',
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: '1.03rem',
            }}
          >
            Latest finality events
          </Button>
        </Box>
        <Collapse in={isOpen}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Submission Type</TableCell>
                  <TableCell>L2 Block Number</TableCell>
                  <TableCell>L2 Block Hash</TableCell>
                  <TableCell>L1 Block Number</TableCell>
                  <TableCell>L1 Block Hash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Tooltip title={new Date(row.timestamp).toLocaleString()}>
                        <Typography variant="body2">
                          {moment(row.timestamp).fromNow()}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {getSubmissionTypeName(row.submission_type)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={getExplorerLink(row.l2_block_number, true)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {row.l2_block_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Click to copy">
                        <IconButton
                          onClick={() => copyToClipboard(row.l2_block_hash)}
                        >
                          <Typography variant="body2">
                            {trimHash(row.l2_block_hash)}
                          </Typography>
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={getExplorerLink(row.l1_block_number, false)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {row.l1_block_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Click to copy">
                        <IconButton
                          onClick={() => copyToClipboard(row.l1_block_hash)}
                        >
                          <Typography variant="body2">
                            {trimHash(row.l1_block_hash)}
                          </Typography>
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalRows}
            rowsPerPage={pageSize}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              '.MuiTablePagination-toolbar': {
                borderRadius: '0 0 4px 4px',
                backgroundColor: 'background.paper',
              },
              '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows, .MuiInputBase-input':
                {
                  color: 'text.primary',
                },
            }}
          />
        </Collapse>
      </Paper>
    </ThemeProvider>
  )
}

export default SyncStatusTable
