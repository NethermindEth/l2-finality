Based on the file structure in the screenshot and your instructions, here is an updated README for the Block Appraiser System:

````markdown
# Block Appraiser System

The Block Appraiser System is engineered to analyze and appraise blockchain transactions with a keen focus on both token and native currency transfers. Its primary function is to ascertain the value of these transfers in fiat currency (USD) by leveraging real-time asset price data.

## File Structure

```plaintext
core/
├── controllers/
│   └── appraiser/
│       ├── aggregators/
│       │   ├── TransferAggregator.ts          # Placeholder for future transfer aggregation logic.
│       │   └── TransferValueSummarizer.ts     # Aggregates and summarizes transfer value data.
│       ├── handlers/
│       │   ├── BaseHandler.ts                 # Abstract base class for all transfer handlers.
│       │   ├── BlockRewardsHandler.ts         # Handles block rewards and appraises their value.
│       │   ├── NativeTransfers.ts             # Manages native currency transfers and valuation.
│       │   └── TokenTransfers.ts              # Manages ERC20 token transfers and valuation.
│       ├── services/
│       │   ├── PriceService.ts                # Retrieves and manages price data for assets.
│       │   └── TransferService.ts             # Coordinates the transfer handling workflow.
│       └── BlockAppraiser.ts                  # Main orchestrator for the block appraisal process.
├── tests/
│   └── appraiser/
│       ├── aggregators/
│       │   └── TransferValueSummarizer.test.ts # Tests for transfer value summarization.
│       ├── handlers/
│       │   ├── BlockRewardsHandler.test.ts    # Tests for block rewards handling.
│       │   ├── NativeTransfers.test.ts        # Tests for native transfer handling.
│       │   └── TokenTransfers.test.ts         # Tests for token transfer handling.
│       └── services/
│           ├── PriceService.test.ts           # Tests for the Price Service.
│           └── TransferService.test.ts        # Tests for the Transfer Service.
└── types.ts                                   # Type definitions used across the appraiser module.
```
````

## Components

### Aggregators

- **`TransferValueSummarizer.ts`**: Collates transfer event data from different transactions, sorting them by asset type and computing total values and averages when necessary.

### Handlers

### Handlers Overview

- **BaseHandler.ts**

  - Serves as the abstract base for all transfer event handlers.
  - Defines common properties and methods used by all specific handler implementations.

- **BlockRewardsHandler.ts**

  - Processes block rewards and calculates their USD value.
  - Aggregates total gas fees and tips from transaction receipts.
  - Computes effective gas price using base and priority fee per gas.
  - Fetches the current price of the native currency using `PriceService`.
  - Calculates and appraises the USD value of block rewards based on aggregated fees and real-time price data.

- **NativeTransfers.ts**

  - Handles native currency transfers, such as ETH.
  - Analyzes transactions within a block to determine the native currency amount transferred.
  - Utilizes `PriceService` to get the latest USD price for the native currency.
  - Appraises the USD value of each native currency transfer by adjusting the amount for decimal scale and applying the current price.

- **TokenTransfers.ts**
  - Manages ERC20 token transfers by parsing transaction logs for `Transfer` events.
  - Identifies and appraises swap-like transfers, singling out the transfer with the highest USD value.
  - Appraises distribution-like transfers individually, calculating the USD value for each.
  - Uses `PriceService` to fetch prices for whitelisted tokens and calculates USD values based on market prices.
  - Includes a mechanism to determine if transfers are reciprocal within the same transaction.
  - Notes non-whitelisted assets without appraising their value.

Note: A swap-like transfer refers to a scenario where an address participates as both sender and receiver within the same transaction, indicative of a trading or swapping activity. Conversely, a distribution-like transfer occurs when the sender does not receive any assets back in the same transaction, suggesting a one-way transfer or distribution.

### Services

- **`PriceService.ts`** & **`TransferService.ts`**: These services are crucial to the Block Appraiser's operations. The Price Service is tasked with fetching real-time prices for various assets, while the Transfer Service orchestrates the process of handling transfers, selecting the right handler, and aggregating the results.

### Main Class

- **`BlockAppraiser.ts`**: This is the core class that orchestrates the appraisal workflow. It uses the Transfer Service to process transactions and the Transfer Value Summarizer to create comprehensive summaries of the appraisals.
