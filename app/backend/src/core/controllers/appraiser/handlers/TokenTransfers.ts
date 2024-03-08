import { ethers } from "ethers";
import {
  AppraisalSummary,
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

export class TokenTransferHandler extends BaseHandler {
  private readonly priceService: PriceService;

  private readonly transferEventHash;

  constructor(
    provider: IBlockchainClient,
    logger: Logger,
    priceService: PriceService,
  ) {
    super(provider, logger);
    this.priceService = priceService;
    this.transferEventHash = provider.getEventHash("Transfer", [
      "address",
      "address",
      "uint256",
    ]);
  }

  async handleTransferEvents(
    tx: Transaction,
    txReceipts: TransactionReceipt[] | undefined,
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]> {
    if (!txReceipts) return [];

    const receipt = txReceipts.find((rcpt) => rcpt.hash === tx.hash);
    if (!receipt) return [];
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
      if (log.topics[0] === this.transferEventHash && log.topics.length == 3) {
        const contractAddress = ethers.getAddress(log.address);
        const fromAddress = ethers.getAddress(`0x${log.topics[1].slice(26)}`);
        const toAddress = ethers.getAddress(`0x${log.topics[2].slice(26)}`);
        const rawAmount = log.data === "0x" ? BigInt(0) : BigInt(log.data);
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
