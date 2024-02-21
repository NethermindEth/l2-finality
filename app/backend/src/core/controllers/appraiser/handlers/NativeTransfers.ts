import { ethers } from "ethers";
import { AppraisalSummary, BaseHandler } from "./BaseHandler";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import Logger from "@/tools/Logger";

export class NativeTransferHandler extends BaseHandler {
  private priceService: PriceService;
  private ethContract: string;

  constructor(
    provider: ethers.Provider,
    logger: Logger,
    priceService: PriceService,
  ) {
    super(provider, logger);
    this.priceService = priceService;

    this.ethContract = ethers.ZeroAddress;
  }

  async handleTransferEvents(
    tx: ethers.TransactionResponse,
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]> {
    const adjustedAmount = Number(tx.value) / 1e18;
    const priceRecord = await this.priceService.getPriceWithRetry(
      this.ethContract,
      timestamp,
    );

    return [
      {
        contractAddress: this.ethContract,
        rawAmount: tx.value,
        adjustedAmount,
        usdValue: priceRecord
          ? adjustedAmount * priceRecord.priceUsd
          : undefined,
      },
    ];
  }
}
