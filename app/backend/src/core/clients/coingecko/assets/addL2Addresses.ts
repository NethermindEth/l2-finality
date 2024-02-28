import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { WhitelistedAsset } from "@/core/clients/coingecko/assets/types";
import { Logger } from "@/tools/Logger";

const ChainIds = { Ethereum: 1, Optimism: 10, Starknet: -1 };
const logger = new Logger({ logLevel: "info" }).for("Add L2 Addresses");

const optimismUrl =
  "https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json";
const starknetUrl =
  "https://raw.githubusercontent.com/starknet-io/starknet-addresses/master/bridged_tokens/mainnet.json";

type AssetL2Data = { addressL1?: string; addressL2: string; decimals?: number };

async function getOptimismAddressMapAsync(): Promise<Map<string, AssetL2Data>> {
  type OptimismResponse = {
    tokens: {
      symbol: string;
      chainId: number;
      address: string;
      decimals: number;
    }[];
  };
  const response = await axios.get<OptimismResponse>(optimismUrl);

  return new Map<string, AssetL2Data>(
    response.data.tokens
      .filter((t) => t.chainId == ChainIds.Optimism)
      .map((t) => [t.symbol, { addressL2: t.address, decimals: t.decimals }]),
  );
}

async function getStarknetAddressMapAsync(): Promise<Map<string, AssetL2Data>> {
  type StarknetResponse = {
    symbol: string;
    l1_token_address: string;
    l2_token_address: string;
    decimals: number;
  }[];
  const response = await axios.get<StarknetResponse>(starknetUrl);

  return new Map<string, AssetL2Data>(
    response.data
      .filter((t) => t.l2_token_address)
      .map((t) => [
        t.symbol,
        {
          addressL2: t.l2_token_address,
          decimals: t.decimals,
          addressL1: t.l1_token_address,
        },
      ]),
  );
}

function match(assetL1: WhitelistedAsset, dataL2: AssetL2Data): boolean {
  if (
    dataL2.addressL1 &&
    assetL1.address &&
    dataL2.addressL1.toUpperCase() !== assetL1.address.toUpperCase()
  )
    return false;

  if (
    dataL2.decimals != undefined &&
    assetL1.decimals &&
    dataL2.decimals !== assetL1.decimals
  )
    return false;

  return true;
}

async function main() {
  try {
    const whitelistedPath = path.resolve(__dirname, "whitelisted.json");
    const whitelisted = JSON.parse(
      await fs.readFile(whitelistedPath, "utf8"),
    ) as WhitelistedAsset[];

    const l2Data: { [chainId: number]: Map<string, AssetL2Data> } = {
      [ChainIds.Optimism]: await getOptimismAddressMapAsync(),
      [ChainIds.Starknet]: await getStarknetAddressMapAsync(),
    };

    // Skip existing L2 entries
    for (const asset of whitelisted) {
      if (asset.chainId != ChainIds.Ethereum) continue;

      const assetL2Data = l2Data[asset.chainId]?.get(asset.symbol);
      if (!assetL2Data) continue;

      if (match(asset, assetL2Data!))
        logger.debug(
          `Skipping ${asset.symbol} on chain #${asset.chainId} as present`,
        );
      else
        logger.warn(
          `L2 address mismatch for ${asset.symbol} on chain #${asset.chainId}`,
        );
    }

    // Insert new L2 entries
    const whitelistedNew: WhitelistedAsset[] = [];
    for (const asset of whitelisted) {
      whitelistedNew.push(asset);

      if (asset.chainId != ChainIds.Ethereum) continue;

      for (const chainId of [ChainIds.Optimism, ChainIds.Starknet]) {
        const assetL2Data = l2Data[chainId]?.get(asset.symbol);
        if (!assetL2Data || !match(asset, assetL2Data)) continue;

        whitelistedNew.push({
          name: asset.name,
          coingeckoId: asset.coingeckoId,
          address: assetL2Data.addressL2,
          symbol: asset.symbol,
          decimals: asset.decimals,
          deploymentTimestamp: asset.deploymentTimestamp,
          coingeckoListingTimestamp: asset.coingeckoListingTimestamp,
          chainId: chainId,
        });

        logger.info(
          `Adding ${asset.symbol} as ${assetL2Data.addressL2} on chain #${chainId}`,
        );
      }
    }

    // Save new JSON
    if (whitelistedNew.length > whitelisted.length) {
      await fs.writeFile(
        whitelistedPath,
        JSON.stringify(whitelistedNew, null, 2) + "\n",
        "utf8",
      );
      logger.info(
        `Added ${whitelistedNew.length - whitelisted.length} new L2 addresses`,
      );
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
}

main().catch(() => {
  process.exit(1);
});
