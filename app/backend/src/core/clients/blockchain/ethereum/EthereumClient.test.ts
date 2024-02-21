import EthereumClient from "./EthereumClient";
import { expect, mockFn } from "earl";
import { beforeEach } from "mocha";
import { ethers } from "ethers";
import Logger from "@/tools/Logger";
import contractsData from "./contracts/contracts.json";
import { getConfig } from "@/config";
import { ethersToBlock } from "@/core/clients/blockchain/IBlockchainClient";

describe(EthereumClient.name, () => {
  let ethClient: EthereumClient;

  beforeEach(() => {
    const logger = new Logger();
    const config = getConfig();
    ethClient = new EthereumClient(config, logger.for("Ethereum Client"));
  });

  describe(EthereumClient.prototype.getCurrentHeight.name, () => {
    it("returns the current block height", async () => {
      const mockBlock: Partial<ethers.Block> = {
        number: 123456,
      };
      createMockProvider(ethClient, mockBlock);
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
        index: 1,
        type: 0,
        maxFeePerGas: 100n,
        maxPriorityFeePerGas: 100n,
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
        getPrefetchedTransaction: (hash: string | number) =>
          mockTransactionResponse,
      };

      createMockProvider(ethClient, block);
      const actualBlock = await ethClient.getBlock(blockNumber);
      // @ts-ignore
      expect(actualBlock).toEqual(ethersToBlock(block));
      // @ts-ignore
      expect(actualBlock?.transactions.length).toEqual(2);
      // @ts-ignore
      actualBlock?.transactions.forEach((actualTransaction, index) =>
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

function createMockProvider(ethClient: EthereumClient, getBlockResponse: any) {
  const mockProvider = ethClient.getProvider();

  mockProvider.getBlock = mockFn().returns(Promise.resolve(getBlockResponse));
  mockProvider.getLogs = mockFn().returns(Promise.resolve([]));
  return mockProvider;
}
