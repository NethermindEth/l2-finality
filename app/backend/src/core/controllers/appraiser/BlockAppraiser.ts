import { ethers } from "ethers";
import { Database } from '../../../database/Database'
import { PriceRecord } from '../../../database/repositories/PricingRepository'
import { Logger } from '../../../tools/Logger'
import PricingRepository from '../../../database/repositories/PricingRepository'
import { UnixTime } from '../../../core/types/UnixTime'
import { WhitelistedAsset } from '../../../core/clients/coincap/assets/types'
import whitelisted from '../../../core/clients/coincap/assets/whitelisted.json'

interface UnmappedTransferEvent {
  contractAddress: string;
  rawAmount: bigint;
}

interface MappedTransferEvent extends UnmappedTransferEvent {
  adjustedAmount: number;
  usdValue: number;
}

type UnmappedTransfers = UnmappedTransferEvent[];
type MappedTransfers = MappedTransferEvent[];

type AggregatedTransferResults = {
  mapped: AggregatedMappedTransfer[];
  unmapped: AggregatedUnmappedTransfer[];
};

type AggregatedMappedTransfer = {
  contractAddress: string;
  usdTotalValue: number;
};

type AggregatedUnmappedTransfer = {
  contractAddress: string;
  rawTotalAmount: bigint;
};


export class BlockAppraiser {
  private provider: ethers.Provider;
  private database: Database;
  private logger: Logger;

  private pricingRepository: PricingRepository;
  private monitoredAssets: WhitelistedAsset[];

  constructor(
    provider: ethers.Provider,
    database: Database,
    logger: Logger,
  ) {
    this.provider = provider;
    this.database = database;
    this.logger = logger.for("BlockAppraiser");

    this.pricingRepository = new PricingRepository(this.database.getKnex());
    this.monitoredAssets = whitelisted;

  }

  public async value(txs: ethers.TransactionResponse[], timestamp: Date): Promise<AggregatedTransferResults> {
    const [mappedTransfers, unmappedTransfers] = await this.handleTransfers(txs, timestamp);
    console.log(mappedTransfers, unmappedTransfers)
    return this.aggregateTransfers(mappedTransfers, unmappedTransfers);
  }

  private aggregateTransfers(mappedTransfers: MappedTransferEvent[], unmappedTransfers: UnmappedTransferEvent[]): AggregatedTransferResults {
    const aggregatedMapped: { [contractAddress: string]: number } = {};
    const aggregatedUnmapped: { [contractAddress: string]: bigint } = {};

    mappedTransfers.forEach(({ contractAddress, usdValue }) => {
      aggregatedMapped[contractAddress] = (aggregatedMapped[contractAddress] || 0) + usdValue;
    });

    unmappedTransfers.forEach(({ contractAddress, rawAmount }) => {
      aggregatedUnmapped[contractAddress] = (aggregatedUnmapped[contractAddress] || BigInt(0)) + rawAmount;
    });

    const mappedResults: AggregatedMappedTransfer[] = Object.entries(aggregatedMapped).map(([contractAddress, usdTotalValue]) => ({ contractAddress, usdTotalValue }));
    const unmappedResults: AggregatedUnmappedTransfer[] = Object.entries(aggregatedUnmapped).map(([contractAddress, rawTotalAmount]) => ({ contractAddress, rawTotalAmount }));

    return { mapped: mappedResults, unmapped: unmappedResults };
  }

  /**
   * Processes all transactions within a block, categorizing and handling each as either a token or native transfer.
   *
   * @param txs - An array of transaction responses from the block.
   * @param timestamp - The timestamp associated with the block containing these transactions.
   * @returns A tuple of two arrays: the first contains all mapped transfers (with USD values), and the second contains all unmapped transfers.
   */
  private async handleTransfers(txs: ethers.TransactionResponse[], timestamp: Date): Promise<[MappedTransfers, UnmappedTransfers]> {
    const mappedTransfers: MappedTransfers = [];
    const unmappedTransfers: UnmappedTransfers = [];

    for (const tx of txs) {
      if (tx.value.toString() === "0") {
        const tokenTransfers = await this.handleTokenTransfers(tx, timestamp);
        tokenTransfers.forEach(event => {
          if ('usdValue' in event) {
            mappedTransfers.push(event);
          } else {
            unmappedTransfers.push(event);
          }
        });
      } else {
        const nativeTransfer = await this.handleNativeTransfers(tx, timestamp);
        if (nativeTransfer) {
          if ('usdValue' in nativeTransfer) {
            mappedTransfers.push(nativeTransfer);
          } else {
            unmappedTransfers.push(nativeTransfer);
          }
        }
      }
    }

    return [mappedTransfers, unmappedTransfers];
  }


  /**
   * Handles token transfers by parsing transaction logs for ERC20 'Transfer' events, extracting transfer details, and attempting to fetch corresponding USD values.
   *
   * @param tx - A single transaction response to be processed for token transfers.
   * @param timestamp - The timestamp associated with the block containing this transaction.
   * @returns An array of transfer events, each either mapped with a USD value if the price was successfully fetched, or unmapped otherwise. Mapped events include 'adjustedAmount' and 'usdValue', while unmapped events only include 'adjustedAmount'.
   */
  private async handleTokenTransfers(tx: ethers.TransactionResponse, timestamp: Date): Promise<(MappedTransferEvent | UnmappedTransferEvent)[]> {
    const receipt = await this.provider.getTransactionReceipt(tx.hash);
    if (!receipt) return [];

    const transferEvents: (MappedTransferEvent | UnmappedTransferEvent)[] = [];

    for (const log of receipt.logs) {
      if (log.topics[0] === ethers.id("Transfer(address,address,uint256)")) {
        const contractAddress = log.address;
        const rawAmount = BigInt(log.data);

        const asset = this.monitoredAssets.find(asset => asset.address === contractAddress);

        if (asset) {
          const decimals = asset.decimals;
          const adjustedAmount = Number(rawAmount) / (10 ** decimals);
          const priceRecord = await this.getPriceWithRetry(contractAddress, UnixTime.fromDate(timestamp));
          if (priceRecord) {
            transferEvents.push({
              contractAddress,
              rawAmount,
              adjustedAmount,
              usdValue: adjustedAmount * priceRecord.priceUsd,
            });
          } else {
            this.logger.error(`Failed to fetch price for mapped token ${asset.ticker} at timestamp`, timestamp.toISOString());
            transferEvents.push({
              contractAddress,
              rawAmount,
              adjustedAmount,
            });
          }
        } else {
          console.info(`Token ${contractAddress} is not whitelisted`);
          transferEvents.push({
            contractAddress,
            rawAmount,
          });
        }
      }
    }
    return transferEvents;
  }

  /**
   * Handles native transfers (e.g., Ether transfers on Ethereum) by extracting the transfer amount and attempting to fetch the corresponding USD value.
   *
   * @param tx - A single transaction response to be processed for native transfers.
   * @param timestamp - The timestamp associated with the block containing this transaction.
   * @returns A single transfer event, either mapped with a USD value if the ETH price was successfully fetched, or unmapped otherwise. Mapped events include 'adjustedAmount' and 'usdValue', while unmapped events only include 'adjustedAmount'.
   */
  private async handleNativeTransfers(tx: ethers.TransactionResponse, timestamp: Date): Promise<MappedTransferEvent | UnmappedTransferEvent | null> {
    const ethPriceRecord = await this.getPriceWithRetry("0x0000000000000000000000000000000000000000", UnixTime.fromDate(timestamp));
    const ethContract: string  = "0x0000000000000000000000000000000000000000"

    const rawAmount = tx.value;
    const adjustedAmount = Number(rawAmount) / 1e18;

    this.logger.info(`ETH price record: ${ethPriceRecord?.priceUsd}`)
    if (ethPriceRecord) {
      return {
        contractAddress: ethContract,
        rawAmount,
        adjustedAmount,
        usdValue: Number(adjustedAmount) * ethPriceRecord.priceUsd,
      };
    } else {
      this.logger.error("Failed to fetch ETH price at timestamp", timestamp.toISOString());
      return {
        contractAddress: ethContract,
        rawAmount,
      };
    }
  }

  private async getPriceWithRetry(contractAddress: string, timestamp: UnixTime, retryInterval = 5000, maxRetries = 12): Promise<PriceRecord | undefined> {
      return {
        assetId: "string",
        priceUsd: 15,
        timestamp: timestamp
      }
    }

  // private async getPriceWithRetry(contractAddress: string, timestamp: UnixTime, retryInterval = 5000, maxRetries = 12): Promise<PriceRecord | undefined> {
  //   for (let i = 0; i < maxRetries; i++) {
  //     const priceRecord = await this.pricingRepository.findByTimestampAndToken(timestamp, contractAddress);
  //     if (priceRecord) return priceRecord;
  //
  //     if (this.monitoredAssets.some(asset => asset.address === contractAddress)) {
  //       await new Promise(resolve => setTimeout(resolve, retryInterval));
  //     } else {
  //       break;
  //     }
  //   }
  // }
}

export default BlockAppraiser;
