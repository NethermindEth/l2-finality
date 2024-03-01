import { expect, mockFn } from "earl";
import { PriceService } from "../services/PriceService";
import Logger from "@/tools/Logger";
import { UnixTime } from "@/core/types/UnixTime";
import { Knex } from "knex";
import { getConfig } from "@/config";
import PricingRepository from "@/database/repositories/PricingRepository";
import { getTestDatabase } from "@/database/getTestDatabase";
import { afterEach } from "mocha";
import { NativeTransferHandler } from "@/core/controllers/appraiser/handlers/NativeTransfers";
import {
  IBlockchainClient,
  Transaction,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";

interface MockTransactionData {
  hash: string;
  value: number;
}

describe(NativeTransferHandler.name, () => {
  let knexInstance: Knex;
  let ethersProvider: IBlockchainClient;
  let priceService: PriceService;

  beforeEach(async () => {
    const logger = new Logger();
    const config = getConfig();
    const priceRepository = new PricingRepository(knexInstance);

    knexInstance = await getTestDatabase();
    ethersProvider = new OptimismClient(config, logger);
    priceService = new PriceService(priceRepository, logger, false);
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  it("correctly appraises native transfers and asserts function calls", async () => {
    const mockTransactionData: MockTransactionData = {
      hash: "0xmockTransactionHash",
      value: 123456789,
    };

    const { mockProvider, mockPriceService } = setUpMockProvider(
      ethersProvider,
      priceService,
      mockTransactionData,
    );
    const mockLogger = new Logger();
    const handler = new NativeTransferHandler(
      mockProvider,
      mockLogger,
      mockPriceService,
    );

    const timestamp: UnixTime = UnixTime.now();

    const mockTxResponse: Transaction = {
      hash: mockTransactionData.hash,
      value: BigInt(mockTransactionData.value),
    } as Transaction;

    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      [] as TransactionReceipt[],
      timestamp,
    );
    const expectedValue = (mockTransactionData.value / 1e18) * 5;

    expect(appraisals).toHaveLength(1);
    expect(appraisals[0].usdValue).toEqual(expectedValue);
  });

  it("handles a transaction with zero value", async () => {
    const mockTransactionData: MockTransactionData = {
      hash: "0xzeroValueTxHash",
      value: 0, // Zero value transaction
    };

    const { mockProvider, mockPriceService } = setUpMockProvider(
      ethersProvider,
      priceService,
      mockTransactionData,
    );
    const mockLogger = new Logger();
    const handler = new NativeTransferHandler(
      mockProvider,
      mockLogger,
      mockPriceService,
    );

    const timestamp: UnixTime = UnixTime.now();

    const mockTxResponse: Transaction = {
      hash: mockTransactionData.hash,
      value: BigInt(mockTransactionData.value),
    } as Transaction;

    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      [] as TransactionReceipt[],
      timestamp,
    );

    expect(appraisals).toHaveLength(1);
    expect(appraisals[0].usdValue).toEqual(0);
  });
});

function setUpMockProvider(
  mockProvider: IBlockchainClient,
  mockPriceService: PriceService,
  mockTransactionData: MockTransactionData,
): { mockProvider: IBlockchainClient; mockPriceService: PriceService } {
  const mockGetPriceWithRetry = mockFn<
    (contract: string, timestamp: UnixTime) => any
  >().returns({
    priceUsd: 5,
  });

  mockProvider.getTransaction = mockFn<(hash: string) => any>().returns({
    hash: mockTransactionData.hash,
    value: mockTransactionData.value,
  });
  mockPriceService.getPriceForContract = mockGetPriceWithRetry;

  return { mockProvider, mockPriceService };
}
