import { SyncStatusRecord } from "@/database/repositories/SyncStatusRepository";
import { ethers } from "ethers";
import { ContractName } from "@/core/clients/blockchain/ethereum/contracts/types";
import {
  OptimismOutputProposed,
  PolygonDecodedLog,
  PolygonVerifyBatchPOL,
  PolygonVerifyBatchStale,
  StarknetLogStateUpdate,
} from "@/core/controllers/indexers/shared/types";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import EthereumClient from "@/core/clients/blockchain/ethereum/EthereumClient";
import chains from "@/shared/chains.json";
import Logger from "@/tools/Logger";
import { SubmissionType } from "@/shared/api/viewModels/SyncStatusEndpoint";

type CallbackFunction = (...args: any[]) => any;

export class LogProcessors {
  private readonly ethereumClient: EthereumClient;
  private readonly polygonZkEvmClient: PolygonZkEvmClient;
  private readonly logger: Logger;

  public readonly callbackMapping: Record<
    ContractName,
    Record<string, CallbackFunction>
  >;

  constructor(
    ethereumClient: EthereumClient,
    polygonZkEvmClient: PolygonZkEvmClient,
    logger: Logger,
  ) {
    this.ethereumClient = ethereumClient;
    this.polygonZkEvmClient = polygonZkEvmClient;
    this.logger = logger;

    this.callbackMapping = {
      L2OutputOracle: {
        OutputProposed: LogProcessors.optimismStateUpdate,
      },
      StarknetCoreContract: {
        LogStateUpdate: this.starknetStateUpdate.bind(this),
      },
      PolygonZkEVMProxyStale: {
        VerifyBatchesTrustedAggregator:
          this.polygonZkEvmProcessBatchUpdate.bind(this),
        SequenceBatches: this.polygonZkEvmProcessBatchUpdate.bind(this),
      },
      PolygonZkEVMProxyPOL: {
        VerifyBatchesTrustedAggregator:
          this.polygonZkEvmProcessBatchUpdate.bind(this),
        OnSequenceBatches: this.polygonZkEvmProcessBatchUpdate.bind(this),
      },
    };
  }

  static optimismStateUpdate(
    log: ethers.Log,
    decodedLog: OptimismOutputProposed,
  ): SyncStatusRecord | null {
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

  async starknetStateUpdate(
    log: ethers.Log,
    decodedLog: StarknetLogStateUpdate,
  ): Promise<SyncStatusRecord | null> {
    const ethBlock = await this.ethereumClient.getBlock(log.blockNumber);

    if (!ethBlock) {
      throw new Error(
        `StarknetStateUpdate: Could not get block for log ${log.blockNumber}, ${log.blockHash}`,
      );
    }

    return {
      chain_id: chains.Starknet.chainId,
      l2_block_number: BigInt(decodedLog.blockNumber),
      l2_block_hash: String(decodedLog.blockHash),
      l1_block_number: Number(log.blockNumber),
      l1_block_hash: log.blockHash,
      timestamp: new Date(Number(ethBlock.timestamp) * 1000),
      submission_type: SubmissionType.StateUpdates,
    };
  }

  async polygonZkEvmProcessBatchUpdate(
    log: ethers.Log,
    decodedLog: PolygonDecodedLog,
  ): Promise<SyncStatusRecord | null> {
    const getBatchNumberFromDecodedLog = (
      decodedLog: PolygonDecodedLog,
    ): bigint => {
      if ("numBatch" in decodedLog) {
        return decodedLog.numBatch;
      } else if ("lastBatchSequenced" in decodedLog) {
        return decodedLog.lastBatchSequenced;
      } else {
        throw new Error(
          "Decoded log does not have a recognizable batch number field.",
        );
      }
    };

    if ("rollupID" in decodedLog) {
      if (decodedLog.rollupID !== BigInt(1)) {
        return null;
      }
    }

    const batchNumber = getBatchNumberFromDecodedLog(decodedLog);

    const batchDetails = await this.polygonZkEvmClient.getBatchByNumber(
      Number(batchNumber),
    );

    if (!batchDetails?.blocks?.length) {
      this.logger.warn(
        `Batch number ${batchNumber} is likely empty, batch blocks: ${batchDetails.blocks}`,
      );
      return null;
    }

    const ethBlock = await this.ethereumClient.getBlock(log.blockNumber);
    const l2Block = await this.polygonZkEvmClient.getBlock(
      batchDetails.blocks[batchDetails.blocks.length - 1],
    );

    if (!l2Block || !ethBlock) {
      throw new Error(
        `Could not get block for batch ${batchNumber}, l2Block: ${l2Block?.number}, ethBlock: ${ethBlock?.number}`,
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
  decodedLog: PolygonDecodedLog,
): decodedLog is PolygonVerifyBatchStale | PolygonVerifyBatchPOL {
  return "aggregator" in decodedLog;
}

export default LogProcessors;
