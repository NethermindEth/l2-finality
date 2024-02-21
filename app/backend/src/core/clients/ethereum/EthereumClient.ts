import { ethers, Network } from 'ethers'
import contracts from "./contracts/contracts.json";
import { Config } from "@/config";
import Logger from "@/tools/Logger";
import { ContractName } from "@/core/clients/ethereum/contracts/types";

class EthereumClient {
  private provider: ethers.JsonRpcProvider;
  private network: Network;
  private logger: Logger;

  constructor(config: Config, logger: Logger) {
    this.network = Network.from(
      ethers.Network.from(config.ethereumMonitorModule.chainId),
    );
    this.provider = new ethers.JsonRpcProvider(
      config.indexers.ethereumRpcEndpoint,
      this.network,
      { staticNetwork: this.network },
    );
    this.logger = logger;
  }

  public getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  public async getCurrentHeight(): Promise<number> {
    const blockNumber = await this.provider.getBlock("finalized");
    if (blockNumber) {
      return blockNumber.number;
    } else {
      throw new Error("Failed to get current block number, null returned");
    }
  }

  public async getBlock(
    blockHeight: number,
  ): Promise<[ethers.Block, ethers.TransactionResponse[]] | [null, null]> {
    const block = await this.provider.getBlock(blockHeight, true);
    if (!block) {
      return [null, null];
    }

    const txs = block.transactions.map((hash: string) =>
      block.getPrefetchedTransaction(hash),
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
