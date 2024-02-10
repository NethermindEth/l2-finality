import fs from "fs";
import { LogProcessors } from "./LogProcessor";
import { expect } from "earl";
import contracts from "../../../clients/ethereum/contracts/contracts.json";
import { ethers } from "ethers";
import {
  SubmissionType,
  SyncStatusRecord,
} from "../../../../database/repositories/SyncStatusRepository";
import { OptimismOutputProposed } from "@/core/controllers/indexers/shared/types";
describe(LogProcessors.name, () => {
  it("should have a callback for every topic in contracts.json", () => {
    const callbackMapping = LogProcessors.callbackMapping;

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
      );

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
});
