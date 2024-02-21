import { ethers } from "ethers";
import { UnixTime } from "@/core/types/UnixTime";
import { TokenTransferHandler } from "../handlers/TokenTransfers";
import { NativeTransferHandler } from "../handlers/NativeTransfers";
import { AppraisalSummary } from "../handlers/BaseHandler";

export class TransferService {
  constructor(
    private tokenHandler: TokenTransferHandler,
    private nativeHandler: NativeTransferHandler,
  ) {}

  async handleTransfers(
    txs: ethers.TransactionResponse[],
    timestamp: UnixTime,
  ): Promise<AppraisalSummary[]> {
    const allEvents: AppraisalSummary[] = [];

    for (const tx of txs) {
      const isTokenTransfer = Number(tx.value) === 0;
      const handler = isTokenTransfer ? this.tokenHandler : this.nativeHandler;
      const events = await handler.handleTransferEvents(tx, timestamp);
      allEvents.push(...events);
    }

    return allEvents;
  }
}
