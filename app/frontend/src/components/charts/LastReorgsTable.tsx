// LastReorgsTable.tsx
import * as React from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  IconButton,
  TableHead,
} from '@mui/material'
import { TablePaginationActionsProps } from '@mui/base'
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material'
import FirstPageIcon from '@mui/icons-material/FirstPage'
import LastPageIcon from '@mui/icons-material/LastPage'
interface ReorgData {
  date: string
  blockNumber: number
  numberOfBlocksReorg: number
  monetaryImpact: number
}

const mockData: ReorgData[] = [
  {
    date: '2023-01-01',
    blockNumber: 500001,
    numberOfBlocksReorg: 2,
    monetaryImpact: 1200.0,
  },
  {
    date: '2023-01-01',
    blockNumber: 34469182,
    numberOfBlocksReorg: 5,
    monetaryImpact: 120322.0,
  },
  {
    date: '2022-12-15',
    blockNumber: 34450841,
    numberOfBlocksReorg: 3,
    monetaryImpact: 3242043.0,
  },
  {
    date: '2022-10-01',
    blockNumber: 34950201,
    numberOfBlocksReorg: 15,
    monetaryImpact: 62391031.249,
  },
  {
    date: '2023-01-01',
    blockNumber: 500001,
    numberOfBlocksReorg: 2,
    monetaryImpact: 1200.0,
  },
  {
    date: '2023-01-01',
    blockNumber: 34469182,
    numberOfBlocksReorg: 5,
    monetaryImpact: 120322.0,
  },
  {
    date: '2022-12-15',
    blockNumber: 34450841,
    numberOfBlocksReorg: 3,
    monetaryImpact: 3242043.0,
  },
  {
    date: '2022-10-01',
    blockNumber: 34950201,
    numberOfBlocksReorg: 15,
    monetaryImpact: 62391031.249,
  },
]

function TablePaginationActions(props: TablePaginationActionsProps) {
  const theme = useTheme()
  const { count, page, rowsPerPage, onPageChange } = props

  const handleFirstPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, 0)
  }

  const handleBackButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page - 1)
  }

  const handleNextButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, page + 1)
  }

  const handleLastPageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
  }

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  )
}

function LastReorgsTable() {
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - mockData.length) : 0

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <TableContainer>
      <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                backgroundColor: 'var(--dark-background-color)',
                color: 'white',
              }}
            >
              Date
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: 'var(--dark-background-color)',
                color: 'white',
              }}
              align="right"
            >
              L2 block height
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: 'var(--dark-background-color)',
                color: 'white',
              }}
              align="right"
            >
              Reorg length
            </TableCell>
            <TableCell
              sx={{
                backgroundColor: 'var(--dark-background-color)',
                color: 'white',
              }}
              align="right"
            >
              Monetary Impact
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(rowsPerPage > 0
            ? mockData.slice(
                page * rowsPerPage,
                page * rowsPerPage + rowsPerPage
              )
            : mockData
          ).map((row, index) => (
            <TableRow
              key={index}
              sx={{
                '&:nth-of-type(odd)': {
                  backgroundColor: 'var(--light-gray)',
                },
              }}
            >
              <TableCell component="th" scope="row">
                {row.date}
              </TableCell>
              <TableCell align="right">{row.blockNumber}</TableCell>
              <TableCell align="right">{row.numberOfBlocksReorg}</TableCell>
              <TableCell align="right">
                {`$${row.monetaryImpact.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              </TableCell>
            </TableRow>
          ))}
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
              colSpan={4}
              count={mockData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              // @ts-ignore
              ActionsComponent={TablePaginationActions}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  )
}

export default LastReorgsTable
