import EthereumClient from "./EthereumClient";
import { expect, mockFn } from "earl";
import { beforeEach } from "mocha";
import { ethers } from "ethers";
import Logger from "../../../tools/Logger";
import { getConfig } from "../../../config";
import { undefined } from "zod";
import contractsData from "./contracts/contracts.json";

describe(EthereumClient.name, () => {
  let ethClient: EthereumClient;

  beforeEach(() => {
    const logger = new Logger();
    const config = getConfig();
    ethClient = new EthereumClient(config, logger);
  });

  describe(EthereumClient.prototype.getCurrentHeight.name, () => {
    it("returns the current block height", async () => {
      createMockProvider(ethClient, 123456, undefined);
      const currentHeight = await ethClient.getCurrentHeight();
      expect(currentHeight).toEqual(123456);
    });
  });

  describe(EthereumClient.prototype.getBlock.name, () => {
    it("returns the block and transactions", async () => {
      const blockNumber = 19106838;
      const mockTransactionResponse: Partial<ethers.TransactionResponse> = {
        hash: "0x123",
        to: "0x456",
        from: "0x789",
        nonce: 1,
        gasLimit: 100n,
        gasPrice: 100n,
        data: "0x",
        value: 0n,
        blockNumber: blockNumber,
        blockHash: "0x1234567890abcdef",
      };

      const block: Partial<ethers.Block> = {
        baseFeePerGas: 1n,
        number: blockNumber,
        hash: "0x1234567890abcdef",
        parentHash: "0xabcdef1234567890",
        timestamp: 1629700000,
        nonce: "0x1234567890abcdef",
        difficulty: 2n,
        gasLimit: 100000n,
        gasUsed: 50000n,
        miner: "0xMinerAddress",
        extraData: "0xExtraData",
        transactions: ["0x1234567890abcdef", "0xabcdef1234567890"],
        // @ts-ignore
        getTransaction: (hash: string | number) =>
          Promise.resolve(mockTransactionResponse),
      };

      createMockProvider(ethClient, undefined, block);
      const [actualBlock, actualTransactions] =
        await ethClient.getBlock(blockNumber);

      // @ts-ignore
      expect(actualBlock).toEqual(block);
      // @ts-ignore
      expect(actualTransactions.length).toEqual(2);
      // @ts-ignore
      actualTransactions.forEach((actualTransaction, index) =>
        // @ts-ignore
        expect(actualTransaction).toEqual(mockTransactionResponse),
      );
    });
  });

  describe(EthereumClient.prototype.getContractLogs.name, () => {
    it("calls provider.getLogs with correct parameters for an existing contract", async () => {
      const contractNames = Object.keys(contractsData) as Array<
        keyof typeof contractsData
      >;
      const contractName = contractNames[0];

      const fromBlock = 100;
      const toBlock = 200;

      const contractAddress = contractsData[contractName].address;
      const contractTopics = Object.values(contractsData[contractName].topics);

      const mockGetLogs = mockFn().returns(Promise.resolve([]));
      ethClient.getProvider().getLogs = mockGetLogs;

      await ethClient.getContractLogs(contractName, fromBlock, toBlock);

      const actualArgs = mockGetLogs.calls[0].args[0];
      expect(mockGetLogs).toHaveBeenCalledTimes(1);
      expect(actualArgs).toEqual({
        fromBlock: ethers.toBeHex(fromBlock),
        toBlock: ethers.toBeHex(toBlock),
        address: contractAddress,
        topics: [contractTopics],
      });
    });

    it("throws an error if the contract name does not exist in contracts.json", async () => {
      const nonExistentContractName = Math.random()
        .toString(36)
        .substring(2, 15);

      const call = async () => {
        // @ts-ignore
        await ethClient.getContractLogs(nonExistentContractName, 100, 200);
      };
      await expect(call).toBeRejectedWith(
        Error,
        `Contract ${nonExistentContractName} not found in contracts.json`,
      );
    });
  });
});

function createMockProvider(
  ethClient: EthereumClient,
  getBlockNumberResponse: any,
  getBlockResponse: any,
) {
  const mockProvider = ethClient.getProvider();

  mockProvider.getBlockNumber = mockFn().returns(
    Promise.resolve(getBlockNumberResponse),
  );
  mockProvider.getBlock = mockFn().returns(Promise.resolve(getBlockResponse));
  mockProvider.getLogs = mockFn().returns(Promise.resolve([]));
  return mockProvider;
}
