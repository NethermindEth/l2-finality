import { UnixTime } from "@/core/types/UnixTime";
import { TokenTransferHandler } from "../handlers/TokenTransfers";
import { NativeTransferHandler } from "../handlers/NativeTransfers";
import {
  Transaction,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import { mergeValues, ValueMapping } from "@/core/controllers/appraiser/types";

export class TransferService {
  constructor(
    private tokenHandler: TokenTransferHandler,
    private nativeHandler: NativeTransferHandler,
  ) {}

  async handleTransfers(
    txs: Transaction[],
    blockTransactionReceipts: TransactionReceipt[] | undefined,
    timestamp: UnixTime,
  ): Promise<ValueMapping> {
    const values: ValueMapping[] = [];

    for (const tx of txs) {
      const isTokenTransfer = Number(tx.value) === 0;
      const handler = isTokenTransfer ? this.tokenHandler : this.nativeHandler;
      const value = await handler.handleTransferEvents(
        tx,
        blockTransactionReceipts,
        timestamp,
      );

      values.push(value);
    }

    return mergeValues(values);
  }
}
