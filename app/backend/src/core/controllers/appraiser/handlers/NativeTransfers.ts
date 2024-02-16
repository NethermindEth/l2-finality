import { ethers } from "ethers";
import { BaseHandler, TransferEvent } from './BaseHandler';
import { UnixTime } from '../../../../core/types/UnixTime';
import { PriceService } from '../services/PriceService';
import Logger from '../../../../tools/Logger'

export class NativeTransferHandler extends BaseHandler {
  private priceService: PriceService;
  private ethContract: string;

  constructor(provider: ethers.Provider, logger: Logger, priceService: PriceService) {
    super(provider, logger);
    this.priceService = priceService;

    this.ethContract  = "0x0000000000000000000000000000000000000000"

  }

  async handleTransferEvents(tx: ethers.TransactionResponse, timestamp: UnixTime): Promise<TransferEvent[]> {
    const adjustedAmount = Number(tx.value) / 1e18;
    const priceRecord = await this.priceService.getPriceWithRetry(this.ethContract, timestamp);

    return [{
      contractAddress: this.ethContract,
      rawAmount: tx.value,
      adjustedAmount,
      usdValue: priceRecord ? adjustedAmount * priceRecord.priceUsd : undefined,
    }];
  }
}
