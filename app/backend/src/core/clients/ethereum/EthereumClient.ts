import { ethers } from "ethers";
import contracts from "./contracts/contracts.json";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { ContractName } from "@/core/clients/ethereum/contracts/types";

class EthereumClient {
  private provider: ethers.JsonRpcProvider;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.provider = new ethers.JsonRpcProvider(
      config.indexers.ethereumRpcEndpoint,
      ethers.Network.from(config.ethereumMonitor.chainId),
    );
    this.logger = logger;
  }

  public getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  public async getCurrentHeight(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  public async getBlock(
    blockHeight: number,
  ): Promise<[ethers.Block, ethers.TransactionResponse[]] | [null, null]> {
    const block = await this.provider.getBlock(blockHeight, true);
    if (!block) {
      return [null, null];
    }

    const txs = await Promise.all(
      block.transactions.map((hash: string) =>
        block.getPrefetchedTransaction(hash),
      ),
    );
    return [block, txs];
  }

  public async getContractLogs(
    contractName: ContractName,
    fromBlock: number,
    toBlock: number,
  ): Promise<ethers.Log[]> {
    const contractInfo = contracts[contractName];
    if (!contractInfo) {
      this.logger.error(`Contract ${contractName} not found in contracts.json`);
      throw new Error(`Contract ${contractName} not found in contracts.json`);
    }

    const topics = Object.values(contractInfo.topics);
    return await this.provider.getLogs({
      fromBlock: ethers.toBeHex(fromBlock),
      toBlock: ethers.toBeHex(toBlock),
      address: contractInfo.address,
      topics: [topics],
    });
  }
}

export default EthereumClient;
