import { Config } from "@/config";
import Logger from "@/tools/Logger";
import {
  Block,
  IBlockchainClient,
  Log,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";
import { RpcProvider, constants, hash, getChecksumAddress } from "starknet";
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
    const response = await this.provider.getBlockLatestAccepted();
    return response.block_number;
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
      baseFeePerGas: 0n, // TODO
      gasUsed: 0n, // TODO
      transactions: block.transactions.map((t) => ({
        blockNumber: block.block_number,
        hash: t.transaction_hash,
        value: 0n,
        // fee payment emit ERC20 transfer to the sequencer address
        // instead of being included into transaction data
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
      this.starknetToTransactionReceipt(t.receipt),
    );
  }

  public async getTransactionReceipt(
    txHash: string,
  ): Promise<TransactionReceipt | undefined> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    return this.starknetToTransactionReceipt(receipt);
  }

  public getTransferEvent(log: Log): TransferLogEvent | undefined {
    if (log.topics[0] === this.TransferEventHash && log.topics.length == 5) {
      const contractAddress = this.getAddress(log.address);
      const fromAddress = this.getAddress(log.topics[1]);
      const toAddress = this.getAddress(log.topics[2]);
      const rawAmount = (BigInt(log.topics[4]) << 128n) | BigInt(log.topics[3]);

      return {
        fromAddress,
        toAddress,
        contractAddress,
        rawAmount,
      };
    }
  }

  private getAddress(address: string): string {
    if (address == "0x0" || address == "0x1") return address;
    return getChecksumAddress(address);
  }

  private starknetToTransactionReceipt(t: any): TransactionReceipt {
    return {
      hash: t.transaction_hash,
      gasUsed: BigInt(0), // TODO
      gasPrice: BigInt(0), // TODO
      logs: t.events.map((e: any) => ({
        address: e.from_address,
        data: "0x",
        topics: e.keys.concat(e.data),
        transactionHash: t.transaction_hash,
      })),
    };
  }
}

export default StarknetClient;

// TODO:
// - Create a class `StarknetClient` that implements the `IBlockchainClient` interface.
//   Make sure to implement the `getCurrentHeight`, `getBlock`, `getBlockTransactionReceipts`, and `getTransactionReceipt` methods.
// - Instead of using ethersToBlock() you can create your custom Block object.
//   Make sure it has gas and block reward metrics so it works with Appraiser.
// - You will need to update Appraiser to also filter for Starknet's "Transfer" topic hash, which is different than ethers one.
// - Run locally on blocks and add tests to BlockAppraiser to ensure it works as expected.
