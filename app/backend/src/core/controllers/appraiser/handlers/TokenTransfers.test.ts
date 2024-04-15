import { expect, mockFn } from "earl";
import { ethers } from "ethers";
import { PriceService } from "../services/PriceService";
import Logger from "@/tools/Logger";
import { UnixTime } from "@/core/types/UnixTime";
import { TokenTransferHandler } from "@/core/controllers/appraiser/handlers/TokenTransfers";
import whitelisted from "@/core/clients/coingecko/assets/whitelisted.json";
import { Knex } from "knex";
import { getConfig } from "@/config";
import PricingRepository from "@/database/repositories/PricingRepository";
import { getTestDatabase } from "@/database/getTestDatabase";
import { afterEach } from "mocha";
import {
  Block,
  IBlockchainClient,
  Transaction,
} from "@/core/clients/blockchain/IBlockchainClient";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";
import { AppraisalSummary } from "@/core/controllers/appraiser/handlers/BaseHandler";
import { WhitelistedAsset } from "@/core/clients/coingecko/assets/types";

describe(TokenTransferHandler.name, () => {
  let knexInstance: Knex;
  let ethersProvider: IBlockchainClient;
  let priceService: PriceService;
  let monitoredAssets: WhitelistedAsset[];

  beforeEach(async () => {
    const logger = new Logger();
    const config = getConfig();
    const priceRepository = new PricingRepository(knexInstance);

    knexInstance = await getTestDatabase();
    ethersProvider = new OptimismClient(config, logger);
    priceService = new PriceService(priceRepository, logger, false);
    monitoredAssets = whitelisted.filter(
      (a) => a.chainId == config.optimismModule.chainId,
    );
  });

  afterEach(async () => {
    await knexInstance.destroy();
  });

  it("Appraise distribution-like transfer with all known assets", async () => {
    const mockTransactionReceiptLogs = {
      logs: [
        {
          address: monitoredAssets[0].address,
          topics: [
            ethers.id("Transfer(address,address,uint256)"),
            "0x0000000000000000000000001111111111111111111111111111111111111111",
            "0x0000000000000000000000002222222222222222222222222222222222222222",
          ],
          data: "0x1000",
        },
        {
          address: monitoredAssets[0].address,
          topics: [
            ethers.id("Transfer(address,address,uint256)"),
            "0x0000000000000000000000001111111111111111111111111111111111111111",
            "0x0000000000000000000000003333333333333333333333333333333333333333",
          ],
          data: "0x1000",
        },
      ],
      hash: "0xmockTransactionHash",
    };

    const { mockProvider, mockPriceService } = setUpMockProvider(
      ethersProvider,
      priceService,
      mockTransactionReceiptLogs,
    );
    const mockLogger = new Logger();
    const handler = new TokenTransferHandler(
      mockProvider,
      mockLogger,
      mockPriceService,
    );

    const timestamp: UnixTime = UnixTime.now();
    const mockTxResponse: Transaction = {
      hash: mockTransactionReceiptLogs.hash,
    } as Transaction;

    const receipts = await mockProvider.getBlockTransactionReceipts(
      1 as unknown as Block,
    );
    const values = await handler.handleTransferEvents(
      mockTxResponse,
      receipts,
      timestamp,
    );
    const totalUsdValue = Object.values(values.byContract!).reduce(
      (sum, v) => sum + (v?.value_usd || 0),
      0,
    );

    const expectedUsdValue =
      (Number("0x1000") * 5 * 2) / Math.pow(10, monitoredAssets[0].decimals);

    expect(totalUsdValue).toEqual(expectedUsdValue);
  });

  it("Appraise distribution-like transfer with some unknown assets", async () => {
    const unknownAddress = "0x1234567890123456789012345678901234567890";
    const mockTransactionReceiptLogs = {
      logs: [
        {
          address: monitoredAssets[0].address,
          topics: [
            ethers.id("Transfer(address,address,uint256)"),
            "0x0000000000000000000000001111111111111111111111111111111111111111",
            "0x0000000000000000000000002222222222222222222222222222222222222222",
          ],
          data: "0x1000",
        },
        {
          address: unknownAddress,
          topics: [
            ethers.id("Transfer(address,address,uint256)"),
            "0x0000000000000000000000001111111111111111111111111111111111111111",
            "0x0000000000000000000000003333333333333333333333333333333333333333",
          ],
          data: "0x1000",
        },
      ],
      hash: "0xmockTransactionHash",
    };

    const { mockProvider, mockPriceService } = setUpMockProvider(
      ethersProvider,
      priceService,
      mockTransactionReceiptLogs,
    );
    const mockLogger = new Logger();
    const handler = new TokenTransferHandler(
      mockProvider,
      mockLogger,
      mockPriceService,
    );

    const timestamp: UnixTime = UnixTime.now();
    const mockTxResponse: Transaction = {
      hash: mockTransactionReceiptLogs.hash,
    } as Transaction;

    const receipts = await mockProvider.getBlockTransactionReceipts(
      1 as unknown as Block,
    );
    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      receipts,
      timestamp,
    );

    const adjustedAmount =
      Number("0x1000") / Math.pow(10, monitoredAssets[0].decimals);

    const expectedAppraisals = {
      byContract: {
        [unknownAddress]: {
          value_asset: 0,
          value_usd: 0,
        },
        [monitoredAssets[0].address!]: {
          value_asset: adjustedAmount,
          value_usd: adjustedAmount * 5,
        },
      },
      byType: {
        token_transfer: {
          value_asset: adjustedAmount,
          value_usd: adjustedAmount * 5,
        },
      },
    };

    expect(appraisals).toEqual(expectedAppraisals);
  });

  it("Appraise transfer with other logs", async () => {
    const mockTransactionReceiptLogs = {
      logs: [
        {
          address: monitoredAssets[0].address,
          topics: [
            ethers.id("Transfer(address,address,uint256)"),
            "0x0000000000000000000000001111111111111111111111111111111111111111",
            "0x0000000000000000000000002222222222222222222222222222222222222222",
          ],
          data: "0x1000",
        },
        {
          address: monitoredAssets[0].address,
          topics: [
            ethers.id("Swap(address,address,uint256)"),
            "0x1",
            "0x2",
            "0x3",
          ],
          data: "0x1000232",
        },
      ],
      hash: "0xmockTransactionHash",
    };

    const { mockProvider, mockPriceService } = setUpMockProvider(
      ethersProvider,
      priceService,
      mockTransactionReceiptLogs,
    );
    const mockLogger = new Logger();
    const handler = new TokenTransferHandler(
      mockProvider,
      mockLogger,
      mockPriceService,
    );

    const timestamp: UnixTime = UnixTime.now();
    const mockTxResponse: Transaction = {
      hash: mockTransactionReceiptLogs.hash,
    } as Transaction;

    const receipts = await mockProvider.getBlockTransactionReceipts(
      1 as unknown as Block,
    );
    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      receipts,
      timestamp,
    );
    const adjustedAmount =
      Number("0x1000") / Math.pow(10, monitoredAssets[0].decimals);

    const expectedAppraisals = {
      byContract: {
        [monitoredAssets[0].address!]: {
          value_asset: adjustedAmount,
          value_usd: adjustedAmount * 5,
        },
      },
      byType: {
        token_transfer: {
          value_asset: adjustedAmount,
          value_usd: adjustedAmount * 5,
        },
      },
    };

    expect(appraisals).toEqual(expectedAppraisals);
  });

  it("Appraise swap-like event", async () => {
    const mockTransactionReceiptLogs = {
      logs: [
        {
          address: monitoredAssets[0].address,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x0000000000000000000000001d3286a3348fa99852d147c57a79045b41c4f713",
            "0x000000000000000000000000099596aa2bd893d8418f9e649c875ca73cd86688",
          ],
          data: "0x84d81ba3a140c16df", // Hexadecimal representation of 153158902361199744735
        },
        {
          address: monitoredAssets[0].address,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000099596aa2bd893d8418f9e649c875ca73cd86688",
            "0x000000000000000000000000c5c247580a4a6e4d3811c0da6215057aac480bac",
          ],
          data: "0x84d81ba3a140c16df", // Hexadecimal representation of 153158902361199744735
        },
        {
          address: monitoredAssets[1].address,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000c5c247580a4a6e4d3811c0da6215057aac480bac",
            "0x0000000000000000000000001d3286a3348fa99852d147c57a79045b41c4f713",
          ],
          data: "0x22bb10b3393b07d", // Hexadecimal representation of 156413273742487677
        },
        {
          address: monitoredAssets[0].address,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000c5c247580a4a6e4d3811c0da6215057aac480bac",
            "0x0000000000000000000000001c0c20d15a9ad9558d5b782bd7382f0a034451ab",
          ],
          data: "0x66063a17448bd82", // Hexadecimal representation of 459476707083599234
        },
      ],
      hash: "0xmockTransactionHash",
    };

    const { mockProvider, mockPriceService } = setUpMockProvider(
      ethersProvider,
      priceService,
      mockTransactionReceiptLogs,
    );
    const mockLogger = new Logger();
    const handler = new TokenTransferHandler(
      mockProvider,
      mockLogger,
      mockPriceService,
    );

    const timestamp: UnixTime = UnixTime.now();
    const mockTxResponse: Transaction = {
      hash: mockTransactionReceiptLogs.hash,
    } as Transaction;

    const receipts = await mockProvider.getBlockTransactionReceipts(
      1 as unknown as Block,
    );
    const values = await handler.handleTransferEvents(
      mockTxResponse,
      receipts,
      timestamp,
    );
    const appraisalsWithMaxUsdValue = Object.values(values.byContract!).map(
      (value) => {
        const tokenAmount = value?.value_asset ?? 0;
        const usdValue = tokenAmount! * 5;
        return {
          maxUsdValue: usdValue,
        };
      },
    );

    expect(values.byContract![monitoredAssets[0].address!]?.value_usd).toEqual(
      appraisalsWithMaxUsdValue[0].maxUsdValue,
    );
  });
});

function setUpMockProvider(
  mockProvider: IBlockchainClient,
  mockPriceService: PriceService,
  mockTransactionData: any,
): { mockProvider: IBlockchainClient; mockPriceService: PriceService } {
  mockProvider.getBlockTransactionReceipts = mockFn().returns([
    mockTransactionData,
  ]);
  mockPriceService.getPriceForContract = mockFn().returns({ priceUsd: 5 });

  return { mockProvider, mockPriceService };
}
