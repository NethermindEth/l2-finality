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
  }[]
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

export enum ValueType {
  gas_fees = "gas_fees",
  block_reward = "block_reward",
  native_transfer = "native_transfer",
  token_transfer = "token_transfer",
  token_swap = "token_swap",
}

export interface VarByContractViewModel {
  symbol?: string;
  address: string;
  var: number;
  var_usd: number;
}

export interface VarByTypeViewModel {
  type: ValueType;
  var: number;
  var_usd: number;
}

export interface BlockVarViewModel {
  block_number: number;
  timestamp: Date;
  by_contract: VarByContractViewModel[];
  by_type: VarByTypeViewModel[];
}

export interface AverageDetailsViewModel {
  min_period_sec: number;
  avg_period_sec: number;
  max_period_sec: number;
  timestamps: number[];
  min_usd: number[];
  avg_usd: number[];
  max_usd: number[];
  by_contract: {
    [symbol: string]: number[];
  };
  by_type: {
    [type in ValueType]?: number[];
  };
}

export interface VaRAverageDataViewModel {
  success: boolean;
  data: AverageDetailsViewModel
}
