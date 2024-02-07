export interface OptimismSyncStatus {
  current_l1: BlockDetails;
  current_l1_finalized: BlockDetails;
  head_l1: BlockDetails;
  safe_l1: BlockDetails;
  finalized_l1: BlockDetails;
  unsafe_l2: BlockDetails & { l1origin: BlockDetails; sequenceNumber: number; };
  safe_l2: BlockDetails & { l1origin: BlockDetails; sequenceNumber: number; };
  finalized_l2: BlockDetails & { l1origin: BlockDetails; sequenceNumber: number; };
  pending_safe_l2: BlockDetails & { l1origin: BlockDetails; sequenceNumber: number; };
}

interface BlockDetails {
  hash: string;
  number: number;
  parentHash: string;
  timestamp: number;
}
