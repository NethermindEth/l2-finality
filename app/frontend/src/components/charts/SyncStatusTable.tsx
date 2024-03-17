import React from 'react'
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
} from '@mui/material'
import moment from 'moment'
import { createTheme, ThemeProvider } from '@mui/material/styles'

interface SyncStatusRecord {
  chainId: number
  l2_block_number: string
  l2_block_hash: string
  l1_block_number: string
  l1_block_hash: string
  timestamp: string
  submission_type: string
}

interface TableProps {
  data: SyncStatusRecord[]
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
          backgroundColor: '#464849',
          color: '#fff',
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
            backgroundColor: '#f5f5f5',
          },
          '&:hover': {
            backgroundColor: '#f5f5f5',
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
  page,
  pageSize,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onRowsPerPageChange(parseInt(event.target.value, 5))
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
        <Box sx={{ mb: 2 }}>
          <Box sx={{ color: 'text.secondary', mb: 2, fontWeight: 'bold' }}>
            Latest finality events
          </Box>
        </Box>
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
                  <TableCell>{moment(row.timestamp).fromNow()}</TableCell>
                  <TableCell>
                    {getSubmissionTypeName(row.submission_type)}
                  </TableCell>
                  <TableCell>{row.l2_block_number}</TableCell>
                  <TableCell>{row.l2_block_hash}</TableCell>
                  <TableCell>{row.l1_block_number}</TableCell>
                  <TableCell>{row.l1_block_hash}</TableCell>
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
      </Paper>
    </ThemeProvider>
  )
}

export default SyncStatusTable
