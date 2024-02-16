import { ethers } from "ethers";
import { BaseHandler, TransferEvent } from './BaseHandler';
import { UnixTime } from '../../../../core/types/UnixTime';
import { PriceService } from '../services/PriceService';
import { WhitelistedAsset } from '../../../../core/clients/coincap/assets/types';
import Logger from '../../../../tools/Logger';

export class TokenTransferHandler extends BaseHandler {
  private priceService: PriceService;
  private monitoredAssets: WhitelistedAsset[];

  constructor(provider: ethers.Provider, logger: Logger, priceService: PriceService, monitoredAssets: WhitelistedAsset[]) {
    super(provider, logger);
    this.priceService = priceService;
    this.monitoredAssets = monitoredAssets;
  }

  async handleTransferEvents(tx: ethers.TransactionResponse, timestamp: UnixTime): Promise<TransferEvent[]> {
    const receipt = await this.provider.getTransactionReceipt(tx.hash);
    if (!receipt) return [];

    const transferEvents = this.extractTransferEvents(receipt.logs);
    const netTransfers = this.calculateNetTransfers(transferEvents);
    const isSwapLike = this.isSwapLikeTransaction(netTransfers);

    return isSwapLike
      ? this.valueSwapLikeTransfers(netTransfers, timestamp)
      : this.valueDistributionLikeTransfers(netTransfers, timestamp);
  }

  private extractTransferEvents(logs: ethers.Log[]): TransferEvent[] {
    const transferEvents: TransferEvent[] = [];
    for (const log of logs) {
      if (log.topics[0] === ethers.id("Transfer(address,address,uint256)")) {
        const contractAddress = log.address;
        const rawAmount = BigInt(log.data);
        transferEvents.push({ contractAddress, rawAmount });
      }
    }
    return transferEvents;
  }

  private calculateNetTransfers(transferEvents: TransferEvent[]): Map<string, bigint> {
    const netTransfers = new Map<string, bigint>();

    for (const event of transferEvents) {
      const { contractAddress, rawAmount } = event;
      const asset = this.monitoredAssets.find(a => a.address === contractAddress);

      if (!asset) {
        this.logger.warn(`Token ${contractAddress} is not whitelisted and will be ignored in net transfer calculation.`);
        continue;
      }

      netTransfers.set(contractAddress, (netTransfers.get(contractAddress) || BigInt(0)) + rawAmount);
    }

    return netTransfers;
  }

  private isSwapLikeTransaction(netTransfers: Map<string, bigint>): boolean {
    // Logic to determine if the net transfers indicate a swap-like transaction
    // For simplicity, let's say if we have more than one token with net transfers, it's swap-like
    return netTransfers.size > 1;
  }

