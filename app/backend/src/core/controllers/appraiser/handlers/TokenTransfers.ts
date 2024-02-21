import { ethers } from "ethers";
import {
  AppraisalSummary,
  BaseHandler,
  PricedTransferLogEvent,
  TransferLogEvent,
} from "./BaseHandler";
import { UnixTime } from "@/core/types/UnixTime";
import { PriceService } from "../services/PriceService";
import { WhitelistedAsset } from "@/core/clients/coincap/assets/types";
import Logger from "@/tools/Logger";
import monitoredAssets from "@/core/clients/coincap/assets/whitelisted.json";

export class TokenTransferHandler extends BaseHandler {
  private priceService: PriceService;
  private monitoredAssets: WhitelistedAsset[];

  constructor(
    provider: ethers.Provider,
    logger: Logger,
    priceService: PriceService,
  ) {
    super(provider, logger);
    this.priceService = priceService;
    this.monitoredAssets = monitoredAssets as WhitelistedAsset[];
  }

  async handleTransferEvents(
    tx: ethers.TransactionResponse,
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]> {
    const receipt = await this.provider.getTransactionReceipt(tx.hash);
    if (!receipt) return [];
    const transferEvents: TransferLogEvent[] = this.extractTransferEvents(
      receipt.logs,
    );

    const hasReciprocal = this.hasReciprocalTransfers(transferEvents);
    return hasReciprocal
      ? await this.handleSwapLikeTransfers(transferEvents, timestamp)
      : await this.handleDistributionLikeTransfers(transferEvents, timestamp);
  }

  private extractTransferEvents(
    logs: readonly ethers.Log[],
  ): TransferLogEvent[] {
    const transferEvents: TransferLogEvent[] = [];

    const transferEventSigHash = ethers.id("Transfer(address,address,uint256)");

    for (const log of logs) {
      if (log.topics[0] === transferEventSigHash) {
        const contractAddress = log.address;
        const fromAddress = ethers.getAddress(`0x${log.topics[1].slice(26)}`);
        const toAddress = ethers.getAddress(`0x${log.topics[2].slice(26)}`);
        const rawAmount = BigInt(log.data);
        transferEvents.push({
          fromAddress,
          toAddress,
          contractAddress,
          rawAmount,
        });
      }
    }
    return transferEvents;
  }

  private async handleSwapLikeTransfers(
    transferEvents: TransferLogEvent[],
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]> {
    const pricedTransferLogEvents: PricedTransferLogEvent[] =
      await this.priceTransferLogEvents(transferEvents, timestamp);
    const maxTransferEvent = pricedTransferLogEvents.reduce(
      (max, event) =>
        (max.usdValue || 0) < (event.usdValue || 0) ? event : max,
      pricedTransferLogEvents[0],
    );

    return [
      {
        contractAddress: maxTransferEvent.contractAddress,
        rawAmount: maxTransferEvent.rawAmount,
        adjustedAmount: maxTransferEvent.adjustedAmount,
        usdValue: maxTransferEvent.usdValue,
      },
    ];
  }

  private async handleDistributionLikeTransfers(
    transferEvents: TransferLogEvent[],
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]> {
    const pricedTransferLogEvents: PricedTransferLogEvent[] =
      await this.priceTransferLogEvents(transferEvents, timestamp);

    return pricedTransferLogEvents.map((event) => ({
      contractAddress: event.contractAddress,
      rawAmount: event.rawAmount,
      adjustedAmount: event.adjustedAmount,
      usdValue: event.usdValue,
    }));
  }

  private hasReciprocalTransfers(transferEvents: TransferLogEvent[]): boolean {
    const senders = new Set();
    const receivers = new Set();

    for (const event of transferEvents) {
      senders.add(event.fromAddress);
      receivers.add(event.toAddress);
    }

    return [...senders].some((sender) => receivers.has(sender));
  }

  private async priceTransferLogEvents(
    transferEvents: TransferLogEvent[],
    timestamp: UnixTime,
  ): Promise<PricedTransferLogEvent[]> {
    const pricedTransferEventPromises: Promise<PricedTransferLogEvent>[] =
      transferEvents.map(async (event) => {
        const asset = this.monitoredAssets.find(
          (a) => a.address === event.contractAddress,
        );
        let adjustedAmount: number | undefined = undefined;
        let usdValue: number | undefined = undefined;

        if (asset) {
          // Asset is whitelisted
          const decimals = asset.decimals;
          const priceRecord = await this.priceService.getPriceWithRetry(
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
