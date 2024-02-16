import { getConfig } from "./config";
import Logger from './tools/Logger'
import { Database } from './database/Database'
import OptimismClient from './core/clients/optimism/OptimismClient'
import BlockAppraiser from './core/controllers/appraiser/BlockAppraiser'
import optimismClient from './core/clients/optimism/OptimismClient'
import { ethers, Network } from 'ethers'

async function main() {
  try {
    const config = getConfig();
    const logger = new Logger();
    const database = new Database(config.database, new Logger());
    await database.migrateToLatest();

    const network = Network.from(ethers.Network.from(config.optimismModule.chainId))

    const provider = new ethers.JsonRpcProvider(
      config.indexers.optimismRpcEndpoint, network,{staticNetwork: network}
    );


    const optimismClient = new OptimismClient(config, logger.for("OP client"));
    const blockAppraiser = new BlockAppraiser(provider, database, logger)
    const [block, txs] = await optimismClient.getBlock(115952816)
    if (txs && block) {
      const status = await blockAppraiser.value(txs, new Date(block.timestamp * 1000))
      console.log(status)
    }



  } catch (e) {
    console.error(e);
    throw e;
  }
}

main().catch(() => {
  process.exit(1);
});
