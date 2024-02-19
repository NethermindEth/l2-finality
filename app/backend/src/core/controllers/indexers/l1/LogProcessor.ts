import {
  SubmissionType,
  SyncStatusRecord,
} from "@/database/repositories/SyncStatusRepository";
import { ethers } from "ethers";
import { ContractName } from "@/core/clients/ethereum/contracts/types";
import { OptimismOutputProposed } from "@/core/controllers/indexers/shared/types";

type CallbackFunction = (...args: any[]) => any;

export class LogProcessors {
  static readonly callbackMapping: Record<
    ContractName,
    Record<string, CallbackFunction>
  > = {
    L2OutputOracle: {
      OutputProposed: LogProcessors.optimismStateUpdate.bind(LogProcessors),
    },
    StarknetCoreContract: {
      LogStateUpdate: LogProcessors.pass.bind(LogProcessors),
    },
    PolygonZkEVMProxy: {
      VerifyBatchesTrustedAggregator: LogProcessors.pass.bind(LogProcessors),
      SequenceBatches: LogProcessors.pass.bind(LogProcessors),
    },
  };

  static pass() {
    return;
  }

  static optimismStateUpdate(
    log: ethers.Log,
    decodedLog: OptimismOutputProposed,
  ): SyncStatusRecord {
    return {
      chain_id: 10,
      l2_block_number: decodedLog.l2BlockNumber,
      l2_block_hash: null,
      l1_block_number: Number(log.blockNumber),
      l1_block_hash: log.blockHash,
      timestamp: new Date(Number(decodedLog.l1Timestamp) * 1000),
      submission_type: SubmissionType.StateUpdates,
    };
  }
}

export default LogProcessors;
