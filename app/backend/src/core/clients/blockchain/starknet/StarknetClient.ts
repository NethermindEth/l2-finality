import { ethers, Network } from "ethers";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import {
  Block,
  ethersToBlock,
  ethersToTransactionReceipt,
  IBlockchainClient,
  TransactionReceipt,
} from "@/core/clients/blockchain/IBlockchainClient";

class StarknetClient implements IBlockchainClient {
  private provider: any;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.logger = logger;
  }

  public async getCurrentHeight(): Promise<number> {
    // TODO: implement
  }

  public async getBlock(
    blockHeight: number | string,
  ): Promise<Block | undefined> {
      // TODO: implement
    }

  public async getBlockTransactionReceipts(
    block: Block,
  ): Promise<TransactionReceipt[] | undefined> {
    // TODO: implement
  }

  public async getTransactionReceipt(
    txHash: string,
  ): Promise<TransactionReceipt | undefined> {
    // TODO: implement
}

export default StarknetClient;


// TODO:
// - Create a class `StarknetClient` that implements the `IBlockchainClient` interface.
//   Make sure to implement the `getCurrentHeight`, `getBlock`, `getBlockTransactionReceipts`, and `getTransactionReceipt` methods.
// - Instead of using ethersToBlock() you can create your custom Block object.
//   Make sure it has gas and block reward metrics so it works with Appraiser.
// - You will need to update Appraiser to also filter for Starknet's "Transfer" topic hash, which is different than ethers one.
// - Run locally on blocks and add tests to BlockAppraiser to ensure it works as expected.
