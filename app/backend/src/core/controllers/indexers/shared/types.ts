export interface OptimismOutputProposed {
  outputRoot: string;
  l2OutputIndex: bigint;
  l2BlockNumber: bigint;
  l1Timestamp: bigint;
}

export interface PolygonVerifyBatchStale {
  numBatch: bigint;
  stateRoot: string;
  aggregator: string;
}

export interface PolygonSequenceBatchStale {
  numBatch: bigint;
}

export interface PolygonVerifyBatchPOL {
  rollupID: bigint;
  numBatch: bigint;
  stateRoot: string;
  exitRoot: string;
  aggregator: string;
}

export interface PolygonSequenceBatchPOL {
  rollupID: bigint;
  lastBatchSequenced: bigint;
}

export type PolygonDecodedLog =
  | PolygonVerifyBatchStale
  | PolygonSequenceBatchStale
  | PolygonVerifyBatchPOL
  | PolygonSequenceBatchPOL;
