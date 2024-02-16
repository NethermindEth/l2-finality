# Block Appraiser System

The Block Appraiser System is designed to process blockchain transactions, specifically focusing on token and native currency transfers. It appraises these transfers by calculating their fiat currency (USD) value based on real-time asset prices.

## File Structure

```plaintext
core/
├── controllers/
│   └── appraiser/
│       ├── aggregators/
│       │   └── TransferValueSummarizer.ts     # Aggregates transfer events into summarized data.
│       ├── handlers/
│       │   ├── BaseHandler.ts            # Abstract base class for transfer event handlers.
│       │   ├── NativeTransfers.ts        # Processes native currency transfers.
│       │   └── TokenTransfers.ts         # Processes ERC20 token transfers.
│       ├── services/
│       │   ├── PriceService.ts           # Fetches and retries price data for assets.
│       │   └── TransferService.ts        # Orchestrates the transfer handling process.
│       └── BlockAppraiser.ts             # Main class, entry point for the appraisal process.
```

## Components

### Aggregators

- **`TransferValueSummarizer.ts`**: Consolidates transfer events from various transactions, organizing them by asset and calculating total and average values as needed. This is useful for summarizing transaction data within a block.

### Handlers

- **`BaseHandler.ts`**: Serves as the foundation for transfer event handlers, defining common properties and methods. All specific handler implementations inherit from this class.

- **`NativeTransfers.ts`**: Specializes in handling native currency (e.g., ETH) transfers, utilizing the provided price service to evaluate transfers in USD.

- **`TokenTransfers.ts`**: Focuses on ERC20 token transfers, parsing transaction logs for transfer events, and using the price service to determine their USD value.

### Services

- **`PriceService.ts`**: Responsible for fetching the current price data for various assets. Includes logic for retrying requests in case of failures or data availability issues.

- **`TransferService.ts`**: Acts as the coordinator for the transfer handling process, determining the appropriate handler for each transaction and collating the results.

### Main Class

- **`BlockAppraiser.ts`**: The central component of the system, orchestrating the appraisal process by leveraging the `TransferService` to process transactions and the `TransferValueSummarizer` to compile the results into a coherent summary.

