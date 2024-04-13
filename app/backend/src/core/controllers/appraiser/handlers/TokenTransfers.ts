import {
  BaseHandler,
  PricedTransferLogEvent,
  TransferLogEvent,
} from "./BaseHandler";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import { whitelistedMap } from "@/core/clients/coingecko/assets/types";
import Logger from "@/tools/Logger";
import {
  IBlockchainClient,
  Log,
  Transaction,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import { mergeValues, ValueMapping } from "@/core/controllers/appraiser/types";
import { ValueRecord } from "@/database/repositories/BlockValueRepository";
import { ValueType } from "@/shared/api/viewModels/SyncStatusEndpoint";

export class TokenTransferHandler extends BaseHandler {
  private readonly priceService: PriceService;

  constructor(
    provider: IBlockchainClient,
    logger: Logger,
    priceService: PriceService,
  ) {
    super(provider, logger);
    this.priceService = priceService;
  }

  async handleTransferEvents(
    tx: Transaction,
    txReceipts: TransactionReceipt[] | undefined,
    timestamp: UnixTime,
  ): Promise<ValueMapping> {
    if (!txReceipts) return {};

    const receipt = txReceipts.find((rcpt) => rcpt.hash === tx.hash);
    if (!receipt) return {};
    const transferEvents: TransferLogEvent[] = this.extractTransferEvents(
      receipt.logs,
    );

    const hasReciprocal = this.hasReciprocalTransfers(transferEvents);
    return hasReciprocal
      ? await this.handleSwapLikeTransfers(transferEvents, timestamp)
      : await this.handleDistributionLikeTransfers(transferEvents, timestamp);
  }

  private extractTransferEvents(logs: Log[]): TransferLogEvent[] {
    const transferEvents: TransferLogEvent[] = [];

    for (const log of logs) {
      const transferEvent = this.provider.getTransferEvent(log);
      if (transferEvent) transferEvents.push(transferEvent);
    }
    return transferEvents;
  }

  private async handleSwapLikeTransfers(
    transferEvents: TransferLogEvent[],
    timestamp: UnixTime,
  ): Promise<ValueMapping> {
    const pricedTransferLogEvents: PricedTransferLogEvent[] =
      await this.priceTransferLogEvents(transferEvents, timestamp);
    const maxTransferEvent = pricedTransferLogEvents.reduce(
      (max, event) =>
        (max.usdValue || 0) < (event.usdValue || 0) ? event : max,
      pricedTransferLogEvents[0],
    );

    const value: ValueRecord = {
      value_asset: maxTransferEvent.adjustedAmount ?? 0,
      value_usd: maxTransferEvent.usdValue ?? 0,
    };

    return {
      byContract: { [maxTransferEvent.contractAddress]: value },
      byType: { [ValueType.token_swap]: value },
    };
  }

  private async handleDistributionLikeTransfers(
    transferEvents: TransferLogEvent[],
    timestamp: UnixTime,
  ): Promise<ValueMapping> {
    const pricedEvents: PricedTransferLogEvent[] =
      await this.priceTransferLogEvents(transferEvents, timestamp);

    return mergeValues(
      pricedEvents.map((e) => {
        const value: ValueRecord = {
          value_asset: e.adjustedAmount ?? 0,
          value_usd: e.usdValue ?? 0,
        };

        return {
          byContract: { [e.contractAddress]: value },
          byType: { [ValueType.token_transfer]: value },
        };
      }),
    );
  }

  private hasReciprocalTransfers(transferEvents: TransferLogEvent[]): boolean {
    if (transferEvents.length <= 1) {
      return false;
    }

    const senders = new Set();
    const receivers = new Set();

    for (const event of transferEvents) {
      senders.add(event.fromAddress);
      receivers.add(event.toAddress);
    }

    return Array.from(senders).some((sender) => receivers.has(sender));
  }

  private async priceTransferLogEvents(
    transferEvents: TransferLogEvent[],
    timestamp: UnixTime,
  ): Promise<PricedTransferLogEvent[]> {
    const pricedTransferEventPromises: Promise<PricedTransferLogEvent>[] =
      transferEvents.map(async (event) => {
        const asset = whitelistedMap.getAssetByAddress(
          this.provider.chainId,
          event.contractAddress,
        );
        let adjustedAmount: number | undefined = undefined;
        let usdValue: number | undefined = undefined;

        if (asset) {
          // Asset is whitelisted
          const decimals = asset.decimals;
          const priceRecord = await this.priceService.getPriceForContract(
            event.contractAddress,
            timestamp,
          );

          adjustedAmount = Number(event.rawAmount) / Math.pow(10, decimals);
          usdValue = priceRecord
            ? adjustedAmount * priceRecord.priceUsd
            : undefined;
        } else {
          // Asset is not whitelisted
        }

        return {
          ...event,
          adjustedAmount,
          usdValue,
        };
      });

    return Promise.all(pricedTransferEventPromises);
  }
}
