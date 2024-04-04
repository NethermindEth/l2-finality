import { Config } from "@/config";
import Logger from "@/tools/Logger";
import {
  Block,
  getStarknetAddress,
  IBlockchainClient,
  Log,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import { constants, hash, RpcProvider } from "starknet";
import { TransferLogEvent } from "@/core/controllers/appraiser/handlers/BaseHandler";

class StarknetClient implements IBlockchainClient {
  private readonly logger: Logger;
  private readonly provider: RpcProvider;

  public readonly chainId: number;

  private readonly TransferEventHash = hash.getSelectorFromName("Transfer");

  constructor(config: Config, logger: Logger) {
    this.logger = logger;
    this.chainId = config.starknetModule.chainId;

    const headers = config.indexers.starknetApiKey
      ? { "x-apikey": config.indexers.starknetApiKey }
      : undefined;

    this.provider = new RpcProvider({
      nodeUrl: config.indexers.starknetRpcEndpoint,
      headers: headers,
      chainId: constants.StarknetChainId.SN_MAIN,
    });
  }

  public async getCurrentHeight(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  public async getBlock(
    blockHeight: number | string,
  ): Promise<Block | undefined> {
    const block = await this.provider.getBlockWithTxs(blockHeight);

    if (!("block_hash" in block)) {
      this.logger.error(
        `Pending block parsing is not supported: ${blockHeight}`,
      );
      return undefined;
    }

    return {
      hash: block.block_hash,
      number: 1,
      timestamp: block.timestamp,
      baseFeePerGas: 0n,
      sequencerAddress: getStarknetAddress(block.sequencer_address),
      transactions: block.transactions.map((t) => ({
        blockNumber: block.block_number,
        hash: t.transaction_hash,
        value: 0n,
        gasPrice: 0n,
        maxPriorityFeePerGas: 0n,
        maxFeePerGas: "max_fee" in t ? BigInt(t.max_fee) : BigInt(-1),
      })),
    };
  }

  public async getBlockTransactionReceipts(
    block: Block,
  ): Promise<TransactionReceipt[] | undefined> {
    const blockWithReceipts = await this.provider.getBlockWithReceipts(
      block.hash,
    );
    return blockWithReceipts.transactions.map((t) =>
      this.starknetToTransactionReceipt(t.receipt, block),
    );
  }

  public getTransferEvent(log: Log): TransferLogEvent | undefined {
    if (log.topics[0] === this.TransferEventHash && log.topics.length == 5) {
      const contractAddress = getStarknetAddress(log.address);
      const fromAddress = getStarknetAddress(log.topics[1]);
      const toAddress = getStarknetAddress(log.topics[2]);
      const rawAmount = (BigInt(log.topics[4]) << 128n) | BigInt(log.topics[3]);

      return {
        fromAddress,
        toAddress,
        contractAddress,
        rawAmount,
      };
    }
  }

  private starknetToTransactionReceipt(
    t: any,
    block: Block,
  ): TransactionReceipt {
    const logs = t.events.map((e: any) => ({
      address: e.from_address,
      data: "0x",
      topics: e.keys.concat(e.data),
      transactionHash: t.transaction_hash,
    }));

    const gas = this.extractGasValue(logs, block, t);

    return {
      hash: t.transaction_hash,
      gasUsed: 1n,
      gasPrice: gas?.amount ?? 0n,
      gasAsset: gas?.asset,
      logs: logs,
    };
  }

  private extractGasValue(
    logs: Log[],
    block: Block,
    t: any,
  ): { amount: bigint; asset: string } | undefined {
    let gas: { amount: bigint; asset: string } | undefined = undefined;

    const actualFeeAmount = t.actual_fee?.amount;
    if (!actualFeeAmount || actualFeeAmount == "0x0") return gas;

    for (let i = logs.length - 1; i >= 0; i--) {
      const transfer = this.getTransferEvent(logs[i]);
      if (
        transfer?.toAddress == block.sequencerAddress &&
        transfer?.rawAmount == BigInt(t.actual_fee.amount)
      ) {
        gas = { amount: transfer!.rawAmount, asset: transfer!.contractAddress };
        logs.splice(i, 1);
        break;
      }
    }

    if (!gas) {
      this.logger.error(
        `No fee transfer found in Starknet tx ${t.transaction_hash}`,
      );
    }

    return gas;
  }
}

export default StarknetClient;
