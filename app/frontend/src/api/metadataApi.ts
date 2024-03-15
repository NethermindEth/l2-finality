import { MetadataRecordsViewModel } from '../../../shared/api/viewModels/MetadataEndpoint'
import { ApiClient } from './ApiClient'

const apiClient = new ApiClient()

export const metadataApi = {
  getAll(): Promise<MetadataRecordsViewModel> {
    return apiClient.get<MetadataRecordsViewModel>('/api/metadata')
  },
}
