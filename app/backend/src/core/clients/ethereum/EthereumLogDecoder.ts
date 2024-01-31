import { ethers } from "ethers";
import contracts from "./contracts/contracts.json";
import path from "path";
import fs from "fs/promises";
import { Logger } from "@/tools/Logger";

export interface EthereumDecodedLogRecord {
  contractName: string;
  eventName: string;
  log: ethers.Log;
  decodedLogEvents: Record<string, any>;
}

class EthereumLogDecoder {
  private readonly contractsPath = path.join(__dirname, "contracts");
  private readonly logger: Logger;
  constructor(logger: Logger) {
    this.logger = logger;
  }
  async loadAbi(
    contractName: keyof typeof contracts,
  ): Promise<ethers.Interface | null> {
    try {
      const abiPath = path.join(
        this.contractsPath,
        "abis",
        `${contractName}.json`,
      );
      const abi = JSON.parse(await fs.readFile(abiPath, "utf8"));
      return new ethers.Interface(abi);
    } catch (error) {
      this.logger.error(
        `Error loading ABI for contract ${contractName}:`,
        error,
      );
      return null;
    }
  }

  async decodeLog(
    log: ethers.Log,
    contractName: keyof typeof contracts,
  ): Promise<EthereumDecodedLogRecord | null> {
    const iface = await this.loadAbi(contractName);
    if (!iface) {
      this.logger.error(`Interface not found for contract ${contractName}`);
      return null;
    }

    try {
      // @ts-ignore
      const parsedLog: ethers.LogDescription | null = iface.parseLog(log);
      if (!parsedLog) {
        this.logger.error("Parsed log is undefined", log);
        return null;
      }
      const decodedParameters: Record<string, any> = {};
      parsedLog.fragment.inputs.forEach((input) => {
        decodedParameters[input.name] = parsedLog.args[input.name];
      });

      return {
        contractName: contractName,
        eventName: parsedLog.name,
        log: log,
        decodedLogEvents: decodedParameters,
      };
    } catch (error) {
      this.logger.error(
        `Error decoding log for contract ${contractName}: ${error}`,
      );
      return null;
    }
  }
}

export default EthereumLogDecoder;
