import { ApiClient } from './ApiClient'
import {
  AverageFinalityTimeViewModel,
  SyncStatusViewModel,
  VaRHistoryDataViewModel,
  VaRLiveDataViewModel,
} from '../../../shared/api/viewModels/SyncStatusEndpoint'

const apiClient = new ApiClient()

export const syncStatusApi = {
  getPaginatedEvents(
    chainId: number,
    page: number = 1,
    pageSize: number = 5
  ): Promise<SyncStatusViewModel> {
    return apiClient.get<SyncStatusViewModel>(
      `/api/state?chainId=${chainId}&page=${page}&pageSize=${pageSize}`
    )
  },

  getAverageFinalityTime(
    chainId: number,
    range: string,
    from?: Date,
    to?: Date
  ): Promise<AverageFinalityTimeViewModel> {
    let url = `/api/state/interval/?chainId=${chainId}&range=${range}`
    if (from) {
      url += `&from=${from.toISOString()}`
    }
    if (to) {
      url += `&to=${to.toISOString()}`
    }
    return apiClient.get<AverageFinalityTimeViewModel>(url)
  },

  getLiveVaR(
    chainId: number,
    useName: boolean = true
  ): Promise<VaRLiveDataViewModel> {
    return apiClient.get<VaRLiveDataViewModel>(
      `/api/state/var/live?chainId=${chainId}&useNames=${useName}`
    )
  },

  getHistoryVaR(
    chainId: number,
    from?: Date,
    to?: Date
  ): Promise<VaRHistoryDataViewModel> {
    let url = `/api/state/var/history?chainId=${chainId}`
    if (from) {
      url += `&from=${from.toISOString()}`
    }
    if (to) {
      url += `&to=${to.toISOString()}`
    }
    return apiClient.get<VaRHistoryDataViewModel>(url)
  },
}
