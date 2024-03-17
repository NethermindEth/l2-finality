export interface LatestBlockViewModel {
  success: boolean
  data: {
    l2_block_number: number
    l2_block_timestamp: string
  }
}