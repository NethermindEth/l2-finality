import { Logger } from "@/tools/Logger";
import { Database } from "@/database/Database";
import BlockValueRepository from "@/database/repositories/BlockValueRepository";
import { Config } from "@/config";
import { FetchRequest } from "ethers";
import { HttpsProxyAgent } from "https-proxy-agent";

export interface BlockIndexerConfig {
  chainId: number;
  maxBlockRange: number;
  startBlockEnvVar: number;
}

class BlockIndexerController {
  private readonly proxy: string;
  private readonly logger: Logger;

  protected readonly timeoutMs = 1000;

  constructor(proxy: string, logger: Logger) {
    this.proxy = proxy;
    this.logger = logger;
  }

  public async start(): Promise<void> {
    try {
      FetchRequest.registerGetUrl(
        FetchRequest.createGetUrlFunc({
          agent: new HttpsProxyAgent(this.proxy),
        }),
      );
      this.logger.warn(`Using proxy: ${this.proxy}`);
    } catch (e) {
      this.logger.error("Failed to instantiate proxy");
    }
  }
}

export default BlockIndexerController;
