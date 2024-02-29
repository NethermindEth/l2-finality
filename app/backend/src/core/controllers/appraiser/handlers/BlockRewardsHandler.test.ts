import Logger from "@/tools/Logger";
import { BlockRewardsHandler } from "@/core/controllers/appraiser/handlers/BlockRewardsHandler";
import { PriceService } from "@/core/controllers/appraiser/services/PriceService";
import { getConfig } from "@/config";
import PricingRepository from "@/database/repositories/PricingRepository";
import { UnixTime } from "@/core/types/UnixTime";
import { expect, mockFn } from "earl";
import { getTestDatabase } from "@/database/getTestDatabase";
import { Knex } from "knex";
import { afterEach } from "mocha";
import {
  Block,
  IBlockchainClient,
  Transaction,
} from "@/core/clients/blockchain/IBlockchainClient";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";

interface MockTransactionData {
  hash: string;
  gasUsed: bigint;
  baseFeePerGas: bigint;
  priorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  blockNumber: number;
  blockBaseFeePerGas: bigint;
}

describe(BlockRewardsHandler.name, () => {
  let blockRewardsHandler: BlockRewardsHandler;
  let knexInstance: Knex;
  let ethersProvider: IBlockchainClient;
  let priceService: PriceService;

  beforeEach(async () => {
    const logger = new Logger();
    const config = getConfig();
    const priceRepository = new PricingRepository(knexInstance);

    knexInstance = await getTestDatabase();
    priceService = new PriceService(priceRepository, logger, false);
    ethersProvider = new OptimismClient(config, logger);
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  describe(BlockRewardsHandler.prototype.handleBlockRewards.name, () => {
    it("calculates gas fees and block rewards correctly for one transfer", async () => {
      const timestamp = UnixTime.now();
      const mockTransactionData: MockTransactionData[] = [
        {
          hash: "0xe591c36ad35c3ee602d065691a4f9dff4cd997e34a81cfa222e6fcd2c9c1ea73",
          gasUsed: BigInt(4217747),
          baseFeePerGas: BigInt(101223550),
          priorityFeePerGas: BigInt(2745050),
          maxFeePerGas: BigInt(120000000),
          blockNumber: 116121074,
          blockBaseFeePerGas: BigInt(101223550),
        },
      ];

      const { mockProvider, mockPriceService } = setUpMockProvider(
        ethersProvider,
        priceService,
        mockTransactionData,
      );
      blockRewardsHandler = new BlockRewardsHandler(
        mockProvider,
        mockPriceService,
      );

      const txs = mockTransactionData.map((txData) => ({
        hash: txData.hash,
        maxPriorityFeePerGas: txData.priorityFeePerGas,
        maxFeePerGas: txData.maxFeePerGas,
      })) as Transaction[];

      const block = (await mockProvider.getBlock(
        mockTransactionData[0].blockNumber,
      )) as Block;

      const result = await blockRewardsHandler.handleBlockRewards(block);
      const expected = {
        gasFees: 438513250744200n,
        gasFeesUsd: (Number(438513250744200n) / 1e18) * 5,
        blockReward: 11577926402350n,
        blockRewardUsd: (Number(11577926402350n) / 1e18) * 5,
      };

      expect(result).toEqual(expected);
    });

    it("aggregates rewards correctly for several transfers", async () => {
      const timestamp = UnixTime.now();
      const mockTransactionData: MockTransactionData[] = [
        {
          hash: "0xe591c36ad35c3ee602d065691a4f9dff4cd997e34a81cfa222e6fcd2c9c1ea73",
          gasUsed: BigInt(52501),
          baseFeePerGas: BigInt(101223550),
          priorityFeePerGas: BigInt(0),
          maxFeePerGas: BigInt(0),
          blockNumber: 116121074,
          blockBaseFeePerGas: BigInt(101223550),
        },
        {
          hash: "0x813dcf690099ae283c350429260801e5c66bf0abaafc174f28e532cffaaf3f6d",
          gasUsed: BigInt(51508),
          baseFeePerGas: BigInt(101223550),
          priorityFeePerGas: BigInt(778462590),
          maxFeePerGas: BigInt(1000000000),
          blockNumber: 116121074,
          blockBaseFeePerGas: BigInt(101223550),
        },
        {
          hash: "0x0fa6f1b75e79ad3d1c6286007c6298039cf6645936d65fa434d511879736cd97",
          gasUsed: BigInt(203902),
          baseFeePerGas: BigInt(101223550),
          priorityFeePerGas: BigInt(0),
          maxFeePerGas: BigInt(0),
          blockNumber: 116121074,
          blockBaseFeePerGas: BigInt(101223550),
        },
        {
          hash: "0xc54ce6966222b355ec19a44e7919f14bdc418fcef9d9056d24652c62864ee71a",
          gasUsed: BigInt(136091),
          baseFeePerGas: BigInt(101223550),
          priorityFeePerGas: BigInt(4339004),
          maxFeePerGas: BigInt(308723945),
          blockNumber: 116121074,
          blockBaseFeePerGas: BigInt(101223550),
        },
        {
          hash: "0xd613f68aea43ecd39e06b46ff9fc22caed7935e26393210cced949c3f1d2e870",
          gasUsed: BigInt(4217747),
          baseFeePerGas: BigInt(101223550),
          priorityFeePerGas: BigInt(2745050),
          maxFeePerGas: BigInt(120000000),
          blockNumber: 116121074,
          blockBaseFeePerGas: BigInt(101223550),
        },
      ];

      const { mockProvider, mockPriceService } = setUpMockProvider(
        ethersProvider,
        priceService,
        mockTransactionData,
      );
      blockRewardsHandler = new BlockRewardsHandler(
        mockProvider,
        mockPriceService,
      );

      const block = (await mockProvider.getBlock(
        mockTransactionData[0].blockNumber,
      )) as Block;

      const result = await blockRewardsHandler.handleBlockRewards(block);
      const expected = {
        gasFees: 498190237979734n,
        gasFeesUsd: (Number(498190237979734n) / 1e18) * 5,
        blockReward: 52265476881434n,
        blockRewardUsd: (Number(52265476881434n) / 1e18) * 5,
      };

      expect(result).toEqual(expected);
    });
  });
});

function setUpMockProvider(
  mockProvider: IBlockchainClient,
  mockPriceService: PriceService,
  mockTransactionData: MockTransactionData[],
) {
  const mockGetPriceWithRetry = mockFn();

  const mockGetTransactionReceipt = mockFn<(hash: string) => any>().executes(
    (hash: string) => {
      const txData = mockTransactionData.find((tx) => tx.hash === hash);
      return {
        transactionHash: txData ? txData.hash : "",
        gasUsed: txData ? txData.gasUsed : BigInt(0),
      };
    },
  );

  const mockGetBlock = mockFn<(blockNumber: number) => any>().executes(
    (blockNumber: number) => {
      const txData = mockTransactionData.find(
        (tx) => tx.blockNumber === blockNumber,
      );
      return {
        number: txData ? txData.blockNumber : 0,
        timestamp: 1629782400,
        baseFeePerGas: txData ? txData.blockBaseFeePerGas : BigInt(0),
        transactions: mockTransactionData.map((tx) => ({
          hash: tx.hash,
          maxPriorityFeePerGas: tx.priorityFeePerGas,
          maxFeePerGas: tx.maxFeePerGas,
        })),
      };
    },
  );

  mockProvider.getTransactionReceipt = mockGetTransactionReceipt;
  mockProvider.getBlock = mockGetBlock;

  mockGetPriceWithRetry.returns({
    priceUsd: 5,
  });

  mockPriceService.getPriceForContract = mockGetPriceWithRetry;

  return { mockProvider, mockPriceService };
}
