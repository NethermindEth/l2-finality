import { LogProcessors } from "./LogProcessor";
import { expect } from "earl";
import contracts from "@/core/clients/blockchain/ethereum/contracts/contracts.json";
import { ethers } from "ethers";
import { SyncStatusRecord } from "@/database/repositories/SyncStatusRepository";
import {
  OptimismOutputProposed,
  PolygonSequenceBatchPOL,
} from "@/core/controllers/indexers/shared/types";
import { beforeEach } from "mocha";
import Logger from "@/tools/Logger";
import { getConfig } from "@/config";
import EthereumClient from "@/core/clients/blockchain/ethereum/EthereumClient";
import PolygonZkEvmClient from "@/core/clients/blockchain/polygonzk/PolygonZkEvmClient";
import { PolygonZkEvmBatch } from "@/core/clients/blockchain/polygonzk/types";
import { Block } from "@/core/clients/blockchain/IBlockchainClient";
import { SubmissionType } from "@/shared/api/viewModels/SyncStatusEndpoint";
describe(LogProcessors.name, () => {
  let ethClient: EthereumClient;
  let polygonZkEvmClient: PolygonZkEvmClient;

  let loggerProcessor: LogProcessors;

  beforeEach(() => {
    const logger = new Logger();
    const config = getConfig();
    ethClient = new EthereumClient(config, logger.for("Ethereum Client"));
    polygonZkEvmClient = new PolygonZkEvmClient(
      config,
      logger.for("PolygonZkEvm Client"),
    );

    mockBlockchainClients(ethClient, polygonZkEvmClient);

    loggerProcessor = new LogProcessors(ethClient, polygonZkEvmClient);
  });

  it("should have a callback for every topic in contracts.json", () => {
    const callbackMapping = loggerProcessor.callbackMapping;

    const contractsInJson = Object.keys(contracts);
    const contractsInCallbackMapping = Object.keys(callbackMapping);

    const missingContracts = contractsInJson.filter(
      (contract) => !contractsInCallbackMapping.includes(contract),
    );

    let allPresent: boolean = true;
    if (missingContracts.length > 0) {
      allPresent = false;
    }
    expect(allPresent).toEqual(true);
  });

  describe(LogProcessors.optimismStateUpdate.name, () => {
    it("should correctly process logs in optimismStateUpdate function", () => {
      // @ts-ignore
      const log: ethers.Log = {
        blockNumber: 123,
        blockHash: "0x123",
      };
      const decodedLog: OptimismOutputProposed = {
        outputRoot:
          "0x0b69c4981ddade1dc372384c57d969aabb89adb97626118a370f4b3138328743",
        l2OutputIndex: 5954n,
        l2BlockNumber: 115954063n,
        l1Timestamp: 1707508199n,
      };

      const result: SyncStatusRecord = LogProcessors.optimismStateUpdate(
        log,
        decodedLog,
      ) as SyncStatusRecord;

      const expected: SyncStatusRecord = {
        chain_id: 10,
        l2_block_number: decodedLog.l2BlockNumber,
        l2_block_hash: null,
        l1_block_number: Number(log.blockNumber.toString()),
        l1_block_hash: log.blockHash,
        timestamp: new Date(Number(decodedLog.l1Timestamp) * 1000),
        submission_type: SubmissionType.StateUpdates,
      };

      expect(result).toEqual(expected);
    });
  });

  describe(LogProcessors.prototype.polygonZkEvmProcessBatchUpdate.name, () => {
    it("polygonZkEvmProcessBatchUpdate correctly processes batches", async () => {
      const log: ethers.Log = {
        blockNumber: 2222222,
        blockHash: "LogL1BlockHash",
      } as ethers.Log;

      const decodedLog: PolygonSequenceBatchPOL = {
        rollupID: 1n,
        lastBatchSequenced: BigInt(1),
      };

      const expected: SyncStatusRecord = {
        chain_id: 1101,
        l2_block_number: BigInt(8888888),
        l2_block_hash: "0xpolygonBlockHashMock",
        l1_block_number: 2222222,
        l1_block_hash: "LogL1BlockHash",
        timestamp: new Date(Number("1111111111") * 1000),
        submission_type: SubmissionType.DataSubmission, // or StateUpdates, based on your logic
      };

      const result = await loggerProcessor.polygonZkEvmProcessBatchUpdate(
        log,
        decodedLog,
      );
      expect(result).toEqual(expected);
    });
  });
});

function mockBlockchainClients(
  ethClient: EthereumClient,
  polygonZkEvmClient: PolygonZkEvmClient,
) {
  ethClient.getBlock = async (blockNumber: number): Promise<Block> => {
    const mockBlock: Block = {
      timestamp: 1111111111,
      number: blockNumber,
      hash: "0xethBlockHashMock",
      transactions: [],
    } as unknown as Block;

    return mockBlock;
  };

  polygonZkEvmClient.getBatchByNumber = async (
    numBatch: number,
  ): Promise<PolygonZkEvmBatch> =>
    ({
      blocks: ["early1", "2", "3", "latest1"],
    }) as PolygonZkEvmBatch;

  polygonZkEvmClient.getBlock = async (
    blockNumber: number | string,
  ): Promise<Block> => {
    const mockBlock = {
      timestamp: 1234567890,
      number: 8888888,
      hash: "0xpolygonBlockHashMock",
      transactions: [],
    } as unknown as Block;

    return mockBlock;
  };
}
