import { ApiClient } from './ApiClient'
import { LatestBlockViewModel } from '@/shared/api/viewModels/BlocksEndpoint'

const apiClient = new ApiClient()

export const blocksApi = {
  getLatestBlock(chainId: number): Promise<LatestBlockViewModel> {
    return apiClient.get<LatestBlockViewModel>(
      '/api/blocks/latest?chainId=' + chainId
    )
  },
}
