import { ethers } from "ethers";
import { BaseHandler } from "./BaseHandler";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import Logger from "@/tools/Logger";
import {
  IBlockchainClient,
  Transaction,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import { ValueMapping } from "@/core/controllers/appraiser/types";
import { ValueRecord } from "@/database/repositories/BlockValueRepository";
import { ValueType } from "@/shared/api/viewModels/SyncStatusEndpoint";

export class NativeTransferHandler extends BaseHandler {
  private readonly priceService: PriceService;
  private readonly ethContract: string;

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
  ): Promise<ValueMapping> {
    const adjustedAmount = Number(tx.value) / 1e18;
    const priceRecord = await this.priceService.getPriceForContract(
      this.ethContract,
      timestamp,
    );

    if (adjustedAmount == 0) return {};

    const value: ValueRecord = {
      value_asset: adjustedAmount,
      value_usd: priceRecord ? adjustedAmount * priceRecord.priceUsd : 0,
    };

    return {
      byContract: { [this.ethContract]: value },
      byType: { [ValueType.native_transfer]: value },
    };
  }
}
