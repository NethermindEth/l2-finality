import { ApiClient } from './ApiClient'
import {
  AverageFinalityTimeViewModel,
  SyncStatusViewModel,
  VaRAverageDataViewModel,
  VaRHistoryDataViewModel,
} from '@/shared/api/viewModels/SyncStatusEndpoint'

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

  getHistoryVaR(
    chainId: number,
    from?: Date,
    to?: Date,
    precision?: number
  ): Promise<VaRHistoryDataViewModel> {
    let url = `/api/state/var/history?chainId=${chainId}`
    if (from) {
      url += `&from=${from.toISOString()}`
    }
    if (to) {
      url += `&to=${to.toISOString()}`
    }
    if (precision) {
      url += `&precision=${precision}`
    }
    return apiClient.get<VaRHistoryDataViewModel>(url)
  },

  getAverageVaR(
    chainId: number,
    from?: Date,
    to?: Date,
    precision?: number
  ): Promise<VaRAverageDataViewModel> {
    let url = `/api/state/var/average?chainId=${chainId}`
    if (from) {
      url += `&from=${from.toISOString()}`
    }
    if (to) {
      url += `&to=${to.toISOString()}`
    }
    if (precision) {
      url += `&precision=${precision}`
    }
    return apiClient.get<VaRAverageDataViewModel>(url)
  },
}
