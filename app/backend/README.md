# Backend Setup Guide

This guide provides instructions for setting up the backend environment for our project, including the configuration of environment variables and the setup of the L1 Log Monitor module.

## Environment Setup

## Starting the Application

To start the application in development mode, follow these steps:

1. Navigate to the root directory of the backend project in your terminal.
2. Run the command `npm run dev`.

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

**L1 Log Monitor module configuration:**

- `ETHEREUM_RPC_ENDPOINT`: The RPC endpoint URL for interacting with the Ethereum blockchain.
- `ETHEREUM_MONITOR_TASK_INTERVAL_MS`: The interval in milliseconds for the cron job that checks for new log events on Ethereum L1.
- `ETHEREUM_LOGS_START_BLOCK`: The blockchain start block number from which to begin fetching log events.
- `ETHEREUM_LOGS_MAX_BLOCKS_PER_LOG_FETCH`: The maximum number of blocks to query for log events in a single fetch operation.

## Modules

### L1 Log Monitor

The L1 Log Monitor module is responsible for fetching contract log events from Ethereum at specified intervals. It updates a local metadata table with the latest processed block number to keep track of the synchronization progress.

#### Setup:

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
