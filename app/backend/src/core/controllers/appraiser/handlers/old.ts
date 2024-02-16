// TokenTransfers.ts
import { ethers } from "ethers";
import { BaseHandler, TransferEvent } from './BaseHandler';
import { UnixTime } from '../../../../core/types/UnixTime';
import { PriceService } from '../services/PriceService';
import { WhitelistedAsset } from '../../../../core/clients/coincap/assets/types';
import Logger from '../../../../tools/Logger'

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
    const transferEvents: TransferEvent[] = [];

    for (const log of receipt.logs) {
      if (log.topics[0] === ethers.id("Transfer(address,address,uint256)")) {
        const contractAddress = log.address;
        const rawAmount = BigInt(log.data);

        const asset = this.monitoredAssets.find(a => a.address === contractAddress);
        if (asset) {
          // Asset is whitelisted
          const decimals = asset.decimals;
          const adjustedAmount = Number(rawAmount) / (10 ** decimals);
          const priceRecord = await this.priceService.getPriceWithRetry(contractAddress, timestamp);

          transferEvents.push({
            contractAddress,
            rawAmount,
            adjustedAmount,
            usdValue: priceRecord ? adjustedAmount * priceRecord.priceUsd : undefined,
          });
        } else {
          // We still keep a record on our database for non-whitelisted tokens
          this.logger.info(`Token ${contractAddress} is not whitelisted`);
          transferEvents.push({
            contractAddress,
            rawAmount,
          });
        }
      }
    }

    return transferEvents;
  }
}
