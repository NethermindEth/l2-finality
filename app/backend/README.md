# Backend Setup Guide

This guide provides instructions for setting up the backend environment for our project, including the configuration of environment variables and the setup of the L1 Log Monitor module.

## Environment Setup

## Starting the Application

To start the application in development mode, follow these steps:

1. Navigate to the root directory of the backend project in your terminal.
2. Create a `.env` file in the root directory and configure the environment variables as described below. You can copy the `.env.local` file and modify the values as required.
3. Run the command `npm run dev`.

This will start the backend server in development mode with hot reloading enabled.

### Environment variables

To run the backend service, you need to configure the following environment variables in a `.env` file:

**General configuration:**

- `DEPLOYMENT_ENV`: Specifies the deployment environment (e.g., `local`, `development`, `staging`, `production`). Use `local` for local development setups.

**API configuration:**

- `API_PORT`: The port on which the backend API will be served. Default is `3005`.

**Database configuration:**

- `DB_URI`: Connection string for the PostgreSQL database. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`. Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your database credentials.
- `DB_FRESH_START`: When set to `true`, the database schema will be dropped and recreated on startup. Useful for development environments.

**Important**: For module specific environment variables, refer to the respective module documentation below.

## Modules

### Pricing module

The Price Updater Module is responsible for keeping cryptocurrency price data up-to-date. It works as follows:

**Environment Variables**

- **`PRICING_MODULE_ENABLED`**: Enables the Pricing module.

  - Recommended: `true`

- **`PRICING_COINCAP_BASE_URL`**: Base URL for CoinCap API.

  - Default: `https://api.coincap.io/v2`

- **`PRICING_COINCAP_API_KEY`**: API key for CoinCap access. Request one from [CoinCap](https://coincap.io/).

  - Set as required.

- **`PRICING_MINUTE_RATE_LIMIT`**: Maximum API requests per minute.
  - Recommended: `500`

**Logic**:

- It fetches the latest timestamp available in the database.
- If the difference between the latest timestamp and the current time is greater than 15 minutes or the asset is new (i.e., it exists in `core/clients/coincap/assets/whitelisted.json`), the module will fetch historical data going back 1 month.
- We receive pricing data every 15 minutes.
- The module checks the boundaries from the database every 10 seconds. If the data is stale (older than 15 minutes), it fetches new data using CoinCap.

Please note that the CoinCap module has a rate limit of 500 requests per minute

### Block Appraisal Module

The Block Appraisal Module is responsible for fetching and appraising blocks from EVM compatible network.

**WIP**

### L1 Log Monitor

The L1 Log Monitor module is responsible for fetching contract log events from Ethereum at specified intervals. It updates a local metadata table with the latest processed block number to keep track of the synchronization progress.

**Environment Variables**

- **`ETHEREUM_MONITOR_MODULE_ENABLED`**: Activates the Ethereum Monitor module.

  - Recommended: `true`

- **`ETHEREUM_RPC_ENDPOINT`**: The RPC endpoint URL for interacting with the Ethereum blockchain.

  - Set as required.

- **`ETHEREUM_MONITOR_START_BLOCK`**: Initial block for log processing.

  - Set as required.

- **`ETHEREUM_MONITOR_MAX_LOG_RANGE`**: Maximum range of blocks for log fetching.

  - Quicknodes max: `5`
  - Set as required.

- **`ETHEREUM_MONITOR_POLL_INTERVAL_MS`**: Frequency of update checks (in ms).
  - Recommended: `30000`

**Configuration**:

1. **Contract Addition**:  
   To monitor new contracts, you need to add their details to the `contracts.json` file located at `core/clients/ethereum/contracts/`. Use the following schema to add a new contract:

```json
"[CONTRACT NAME]": {
  "address": "[CONTRACT ADDRESS]",
  "topics": {
    "LogEventName": "[TOPIC[0]]"
  }
}
```

2. **ABI Addition**: For each new contract, add the corresponding ABI file to the `/abi` folder located at `core/clients/ethereum/contracts/abis`.

3. **Add Parsing Function**: Create a new function in `LogProcessors` to parse the log events of the contract and event name.

### Optimism Module

The Optimism Module measures finality of blocks on the Optimism network by monitoring synchronization status for each data submission and gets each block for it to be appraised.

**Environment Variables**

- **`OPTIMISM_MODULE_ENABLED`**: Enables the Optimism module.
  - Recommended: `true`
- **`OPTIMISM_RPC_ENDPOINT`**: The RPC endpoint URL for interacting with the Optimism network.
  - Set as required.
- **`OPTIMISM_START_BLOCK`**: Starting block for processing.

  - Set as required.

- **`OPTIMISM_MAX_BLOCK_RANGE`**: Max range of blocks fetched per operation.

  - Recommended: `50`

- **`OPTIMISM_POLL_INTERVAL_MS`**: Interval for polling status sync updates and getBlock (in ms).
  - Recommended: `15000`

### PolygonZkEVM Module

The PolygonZkEVM Module gets blocks only gets each block for it to be appraised.

**Environment Variables**

- **`POLYGONZK_MODULE_ENABLED`**: Enables the PolygonZkEVM module.
  - Recommended: `true`
- **`POLYGONZK_RPC_ENDPOINT`**: The RPC endpoint URL for interacting with the PolygonZkEVM network.
  - Set as required.
- **`POLYGONZK_START_BLOCK`**: Starting block for processing.

  - Set as required.

- **`POLYGONZK_MAX_BLOCK_RANGE`**: Max range of blocks fetched per operation.

  - Recommended: `50`

- **`POLYGONZK_POLL_INTERVAL_MS`**: Interval for polling getBlock for live data (in ms).
  - Recommended: `15000`

**Key Components**:

- **OptimismFinalityController**: This class interacts with the OptimismClient to fetch the current synchronization status, comparing it with the previous state to detect any changes in the safe L2 origin number.
- **OptimismBlockController**: This class is responsible for fetching blocks within a specified range from the Optimism network
- **PolygonZkEvmBlockController**: This class is responsible for fetching blocks within a specified range from the PolygonZkEvm network

### Proxy module

This module is responsible for setting up a proxy for all the external requests.

**Environment Variables**

- **`HTTPS_PROXY`**: Proxy URL

  - Example: http://127.0.0.1:8888
  - No proxy will be used if the variable is missing or empty.

- **`NODE_TLS_REJECT_UNAUTHORIZED`**: Whether disable certificate validation for TLS connections.

  - Default: `1`.
  - You may need to set it to `0` if your proxy certificate is not trusted by Node.js.

**Logic**:

- The `HTTPS_PROXY` variable is picked up by the Axios client out of the box and applies to all requests made using it.
  This module ensures that all other libraries respect it, for example, ether.js.
