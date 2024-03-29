import { ethers } from "ethers";
import { AppraisalSummary, BaseHandler } from "./BaseHandler";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import Logger from "@/tools/Logger";
import {
  IBlockchainClient,
  Transaction,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";

export class NativeTransferHandler extends BaseHandler {
  private priceService: PriceService;
  private ethContract: string;

  constructor(
    provider: IBlockchainClient,
    logger: Logger,
    priceService: PriceService,
  ) {
    super(provider, logger);
    this.priceService = priceService;

    this.ethContract = ethers.ZeroAddress;
  }

  async handleTransferEvents(
    tx: Transaction,
    blockTransactionReceipts: TransactionReceipt[] | undefined,
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]> {
    const adjustedAmount = Number(tx.value) / 1e18;
    const priceRecord = await this.priceService.getPriceForContract(
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
