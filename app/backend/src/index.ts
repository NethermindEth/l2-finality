import { getConfig } from "./config";
import logger, { Logger } from './tools/Logger'
import OptimismClient from './core/clients/optimism/OptimismClient'

async function main() {
  try {
    const config = getConfig();
    const logger = new Logger();
    const optimismClient = new OptimismClient(config, logger);
    // const [block, transfer] = await optimismClient.getBlock(115867686);
    const result = await optimismClient.getSyncStatus()
    console.log(result)

  } catch (e) {
    console.error(e);
    throw e;
  }
}

main().catch(() => {
  process.exit(1);
});
