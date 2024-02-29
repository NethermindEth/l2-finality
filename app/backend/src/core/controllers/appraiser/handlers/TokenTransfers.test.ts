import { expect, mockFn } from "earl";
import { ethers } from "ethers";
import { PriceService } from "../services/PriceService";
import Logger from "@/tools/Logger";
import { UnixTime } from "@/core/types/UnixTime";
import { TokenTransferHandler } from "@/core/controllers/appraiser/handlers/TokenTransfers";
import monitoredAssets from "@/core/clients/coingecko/assets/whitelisted.json";
import { Knex } from "knex";
import { getConfig } from "@/config";
import PricingRepository from "@/database/repositories/PricingRepository";
import { getTestDatabase } from "@/database/getTestDatabase";
import { afterEach } from "mocha";
import {
  IBlockchainClient,
  Transaction,
} from "@/core/clients/blockchain/IBlockchainClient";
import OptimismClient from "@/core/clients/blockchain/optimism/OptimismClient";
import { AppraisalSummary } from "@/core/controllers/appraiser/handlers/BaseHandler";

interface MockLog {
  address: string;
  topics: string[];
  data: string;
}

describe(TokenTransferHandler.name, () => {
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
      transactionHash: "0xmockTransactionHash",
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
      hash: mockTransactionReceiptLogs.transactionHash,
    } as Transaction;

    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      timestamp,
    );
    const totalUsdValue = appraisals.reduce(
      (sum, appraisal) => sum + (appraisal.usdValue || 0),
      0,
    );

    const expectedUsdValue =
      (Number("0x1000") * 5 * 2) / Math.pow(10, monitoredAssets[0].decimals);

    expect(appraisals).toHaveLength(mockTransactionReceiptLogs.logs.length);
    expect(totalUsdValue).toEqual(expectedUsdValue);
  });

  it("Appraise distribution-like transfer with some unknown assets", async () => {
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
          address: "UNKNOWN_ADDRESS",
          topics: [
            ethers.id("Transfer(address,address,uint256)"),
            "0x0000000000000000000000001111111111111111111111111111111111111111",
            "0x0000000000000000000000003333333333333333333333333333333333333333",
          ],
          data: "0x1000",
        },
      ],
      transactionHash: "0xmockTransactionHash",
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
      hash: mockTransactionReceiptLogs.transactionHash,
    } as Transaction;

    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      timestamp,
    );
    const totalUsdValue = appraisals.reduce(
      (sum, appraisal) => sum + (appraisal.usdValue || 0),
      0,
    );

    const adjustedAmount =
      Number("0x1000") / Math.pow(10, monitoredAssets[0].decimals);

    const expectedAppraisals = [
      {
        contractAddress: monitoredAssets[0].address!,
        rawAmount: 4096n,
        adjustedAmount: adjustedAmount,
        usdValue: adjustedAmount * 5,
      },
      {
        contractAddress: "UNKNOWN_ADDRESS",
        rawAmount: 4096n,
        adjustedAmount: undefined,
        usdValue: undefined,
      },
    ];

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
      transactionHash: "0xmockTransactionHash",
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
      hash: mockTransactionReceiptLogs.transactionHash,
    } as Transaction;

    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      timestamp,
    );
    const adjustedAmount =
      Number("0x1000") / Math.pow(10, monitoredAssets[0].decimals);

    const expectedAppraisals: AppraisalSummary[] = [
      {
        contractAddress: monitoredAssets[0].address!,
        rawAmount: 4096n,
        adjustedAmount: adjustedAmount,
        usdValue: adjustedAmount * 5,
      },
    ];

    expect(appraisals).toHaveLength(mockTransactionReceiptLogs.logs.length - 1);
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
      transactionHash: "0xmockTransactionHash",
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
      hash: mockTransactionReceiptLogs.transactionHash,
    } as Transaction;

    const appraisals = await handler.handleTransferEvents(
      mockTxResponse,
      timestamp,
    );

    const appraisalsWithMaxUsdValue = appraisals.map((appraisal) => {
      const tokenAmount = appraisal.adjustedAmount;
      const usdValue = tokenAmount! * 5;
      return {
        ...appraisal,
        maxUsdValue: usdValue,
      };
    });

    expect(appraisals).toHaveLength(1);
    expect(appraisals[0].usdValue).toEqual(
      appraisalsWithMaxUsdValue[0].maxUsdValue,
    );
  });
});

function setUpMockProvider(
  mockProvider: IBlockchainClient,
  mockPriceService: PriceService,
  mockTransactionData: any,
): { mockProvider: IBlockchainClient; mockPriceService: PriceService } {
  mockProvider.getTransactionReceipt = mockFn().returns(mockTransactionData);
  mockPriceService.getPriceForContract = mockFn().returns({ priceUsd: 5 });

  return { mockProvider, mockPriceService };
}
