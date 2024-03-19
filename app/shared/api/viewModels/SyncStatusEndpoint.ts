
export enum SubmissionType {
  DataSubmission = "data_submission",
  L2Finalization = "l2_finalization",
  ProofSubmission = "proof_submission",
  StateUpdates = "state_updates",
}

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
  success: boolean;
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
