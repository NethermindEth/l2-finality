import { SubmissionType } from '../../../backend/src/database/repositories/SyncStatusRepository'

export interface SyncStatusViewModel {
  success: boolean
  data: {
    chain_id: number;
    l2_block_number: bigint;
    l2_block_hash: string | null;
    l1_block_number: number | null;
    l1_block_hash: string | null;
    timestamp: Date;
    submission_type: SubmissionType;
  }
}

export interface FinalityTimeRecord {
  timestamp: string;
  timeDiff: number;
  blockDiff: number;
}

export interface AverageFinalityTimeViewModel {
  status: boolean;
  data: {
    data_submission: FinalityTimeRecord[];
    l2_finalization: FinalityTimeRecord[];
    proof_submission: FinalityTimeRecord[];
    state_updates: FinalityTimeRecord[];
  }
}

export interface LiveVaREntry {
  [key: string]: number;
}

export interface VaRLiveDataViewModel {
  success: boolean;
  data: {
    data_submission: LiveVaREntry;
    l2_finalization: LiveVaREntry;
    proof_submission: LiveVaREntry;
    state_updates: LiveVaREntry;
  };
}


export interface HistoryVaREntry {
  timestamp: string;
  avg_var: number;
}

export type AvgVarHistoryMap = {
  [contract: string]: HistoryVaREntry[];
};

export interface VaRHistoryDataViewModel {
  success: boolean;
  data: {
    data_submission: AvgVarHistoryMap;
    l2_finalization: AvgVarHistoryMap;
    proof_submission: AvgVarHistoryMap;
    state_updates: AvgVarHistoryMap;
  };
}
