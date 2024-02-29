import {
  SubmissionType,
  SyncStatusRecord,
} from "@/database/repositories/SyncStatusRepository";
import { ethers } from "ethers";
import { ContractName } from "@/core/clients/blockchain/ethereum/contracts/types";
import {
  OptimismOutputProposed,
  PolygonSequenceBatch,
  PolygonVerifyBatch,
} from "@/core/controllers/indexers/shared/types";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import EthereumClient from "@/core/clients/blockchain/ethereum/EthereumClient";
import chains from "@/core/types/chains.json";

type CallbackFunction = (...args: any[]) => any;

export class LogProcessors {
  private readonly ethereumClient: EthereumClient;
  private readonly polygonZkEvmClient: PolygonZkEvmClient;
  public readonly callbackMapping: Record<
    ContractName,
    Record<string, CallbackFunction>
  >;

  constructor(
    ethereumClient: EthereumClient,
    polygonZkEvmClient: PolygonZkEvmClient,
  ) {
    this.ethereumClient = ethereumClient;
    this.polygonZkEvmClient = polygonZkEvmClient;

    this.callbackMapping = {
      L2OutputOracle: {
        OutputProposed: LogProcessors.optimismStateUpdate,
      },
      StarknetCoreContract: {
        LogStateUpdate: LogProcessors.pass,
      },
      PolygonZkEVMProxy: {
        VerifyBatchesTrustedAggregator:
          this.polygonZkEvmProcessBatchUpdate.bind(this),
        SequenceBatches: this.polygonZkEvmProcessBatchUpdate.bind(this),
      },
    };
  }

  static pass() {
    return;
  }

  static optimismStateUpdate(
    log: ethers.Log,
    decodedLog: OptimismOutputProposed,
  ): SyncStatusRecord {
    return {
      chain_id: chains.Optimism.chainId,
      l2_block_number: decodedLog.l2BlockNumber,
      l2_block_hash: null,
      l1_block_number: Number(log.blockNumber),
      l1_block_hash: log.blockHash,
      timestamp: new Date(Number(decodedLog.l1Timestamp) * 1000),
      submission_type: SubmissionType.StateUpdates,
    };
  }

  async polygonZkEvmProcessBatchUpdate(
    log: ethers.Log,
    decodedLog: PolygonVerifyBatch | PolygonSequenceBatch,
  ): Promise<SyncStatusRecord> {
    const batchDetails = await this.polygonZkEvmClient.getBatchByNumber(
      Number(decodedLog.numBatch),
    );
    const ethBlock = await this.ethereumClient.getBlock(log.blockNumber);
    const l2Block = await this.polygonZkEvmClient.getBlock(
      batchDetails.blocks[batchDetails.blocks.length - 1],
    );

    if (!l2Block || !ethBlock) {
      throw new Error(
        `Could not get block for batch ${decodedLog.numBatch}, l2Block: ${l2Block?.number}, ethBlock: ${ethBlock?.number}`,
      );
    }

    let submissionType: SubmissionType;
    if (isPolygonVerifyBatch(decodedLog)) {
      submissionType = SubmissionType.StateUpdates;
    } else {
      submissionType = SubmissionType.DataSubmission;
    }
    return {
      chain_id: chains.zkEVM.chainId,
      l2_block_number: BigInt(l2Block.number),
      l2_block_hash: l2Block.hash,
      l1_block_number: Number(log.blockNumber),
      l1_block_hash: log.blockHash,
      timestamp: new Date(Number(ethBlock.timestamp) * 1000),
      submission_type: submissionType,
    };
  }
}

function isPolygonVerifyBatch(
  decodedLog: PolygonVerifyBatch | PolygonSequenceBatch,
): decodedLog is PolygonVerifyBatch {
  return (decodedLog as PolygonVerifyBatch).aggregator !== undefined;
}

export default LogProcessors;
