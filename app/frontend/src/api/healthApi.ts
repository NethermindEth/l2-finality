import { HealthStatusViewModel } from '../../../shared/api/viewModels/HealthEndpoint'
import { ApiClient } from './ApiClient'

const apiClient = new ApiClient()

export const healthApi = {
  getHealthData(): Promise<HealthStatusViewModel> {
    return apiClient.get<HealthStatusViewModel>('/api/health')
  },
}
