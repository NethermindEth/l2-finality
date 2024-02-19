export interface OptimismSyncStatus {
  current_l1: BlockDetails;
  current_l1_finalized: BlockDetails;
  head_l1: BlockDetails;
  safe_l1: BlockDetails;
  finalized_l1: BlockDetails;
  unsafe_l2: L2BlockDetails;
  safe_l2: L2BlockDetails;
  finalized_l2: L2BlockDetails;
  pending_safe_l2: L2BlockDetails;
}

export interface BlockDetails {
  hash: string;
  number: number;
  parentHash: string;
  timestamp: number;
}

export interface L2BlockDetails extends BlockDetails {
  l1origin: BlockDetails;
  sequenceNumber: number;
}
