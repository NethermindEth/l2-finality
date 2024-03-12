import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { WhitelistedAsset } from "@/core/clients/coingecko/assets/types";
import { Logger } from "@/tools/Logger";
import chains from "@/core/types/chains.json";
import { ethers } from "ethers";
import { getChecksumAddress } from "starknet";

const logger = new Logger({ logLevel: "info" }).for("Add L2 Addresses");

const optimismUrl =
  "https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/f023572ab94140ab5c5e37226521ff7326badc1e/optimism.tokenlist.json";
const starknetUrl =
  "https://raw.githubusercontent.com/starknet-io/starknet-addresses/a200bcbeccc8b1cf1bfd9ce423dd0356a2ebab12/bridged_tokens/mainnet.json";
const zkEvmUrl =
  "https://raw.githubusercontent.com/maticnetwork/polygon-token-list/45c653bd85643772999fe9af52b986dcaf2e0669/src/tokens/zkevmPopularTokens.json";

type AssetL2Data = {
  chainId: number;
  addressL1?: string;
  addressL2: string;
  decimals?: number;
};

type OptimismResponse = {
  tokens: {
    symbol: string;
    chainId: number;
    address: string;
    decimals: number;
  }[];
};

async function getOptimismAddressMapAsync(): Promise<Map<string, AssetL2Data>> {
  const response = await axios.get<OptimismResponse>(optimismUrl);

  return new Map<string, AssetL2Data>(
    response.data.tokens
      .filter((t) => t.chainId == chains.Optimism.chainId)
      .map((t) => [
        t.symbol,
        {
          chainId: chains.Optimism.chainId,
          addressL2: ethers.getAddress(t.address),
          decimals: t.decimals,
        },
      ]),
  );
}

type StarknetResponse = {
  symbol: string;
  l1_token_address: string;
  l2_token_address: string;
  decimals: number;
}[];

async function getStarknetAddressMapAsync(): Promise<Map<string, AssetL2Data>> {
  const response = await axios.get<StarknetResponse>(starknetUrl);

  return new Map<string, AssetL2Data>(
    response.data
      .filter((t) => t.l2_token_address)
      .map((t) => [
        t.symbol,
        {
          chainId: chains.Starknet.chainId,
          addressL2: getChecksumAddress(t.l2_token_address),
          decimals: t.decimals,
          addressL1: t.l1_token_address
            ? ethers.getAddress(t.l1_token_address)
            : undefined,
        },
      ]),
  );
}

type zkEvmResponse = {
  symbol: string;
  address: string;
  decimals: number;
}[];

async function getZkEvmAddressMapAsync(): Promise<Map<string, AssetL2Data>> {
  const response = await axios.get<zkEvmResponse>(zkEvmUrl);

  return new Map<string, AssetL2Data>(
    response.data.map((t) => [
      t.symbol,
      {
        chainId: chains.zkEVM.chainId,
        addressL2: ethers.getAddress(t.address),
        decimals: t.decimals,
      },
    ]),
  );
}

function match(asset: WhitelistedAsset, dataL2: AssetL2Data): boolean {
  if (
    asset.chainId == chains.Ethereum.chainId &&
    dataL2.addressL1 &&
    asset.address &&
    dataL2.addressL1.toUpperCase() !== asset.address.toUpperCase()
  ) {
    return false;
  }

  if (
    asset.chainId == dataL2.chainId &&
    dataL2.addressL2 &&
    asset.address &&
    dataL2.addressL2.toUpperCase() !== asset.address.toUpperCase()
  ) {
    return false;
  }

  if (
    dataL2.decimals != undefined &&
    asset.decimals &&
    dataL2.decimals !== asset.decimals
  ) {
    return false;
  }

  return true;
}

async function main() {
  const whitelistedPath = path.resolve(__dirname, "whitelisted.json");
  const whitelisted = JSON.parse(
    await fs.readFile(whitelistedPath, "utf8"),
  ) as WhitelistedAsset[];

  const l2Data: { [chainId: number]: Map<string, AssetL2Data> } = {
    [chains.Optimism.chainId]: await getOptimismAddressMapAsync(),
    [chains.zkEVM.chainId]: await getZkEvmAddressMapAsync(),
    [chains.Starknet.chainId]: await getStarknetAddressMapAsync(),
  };

  // Skip (with address update if needed) existing L2 entries
  for (const asset of whitelisted) {
    if (asset.chainId == chains.Ethereum.chainId) continue;

    const assetL2Data = l2Data[asset.chainId]?.get(asset.symbol);
    if (!assetL2Data) continue;

    if (match(asset, assetL2Data)) {
      if (asset.address == assetL2Data.addressL2) {
        logger.debug(
          `Skipping ${asset.symbol} on chain #${asset.chainId} as present`,
        );
      } else {
        asset.address = assetL2Data.addressL2;
        logger.info(
          `Updating ${asset.symbol} address to ${assetL2Data.addressL2} on chain #${asset.chainId}`,
        );
      }

      l2Data[asset.chainId].delete(asset.symbol);
    } else {
      logger.warn(
        `L2 data mismatch for ${asset.symbol} on chain #${asset.chainId}`,
      );
    }
  }

  // Insert new L2 entries
  const whitelistedNew: WhitelistedAsset[] = [];
  for (const asset of whitelisted) {
    whitelistedNew.push(asset);

    for (const chainId in l2Data) {
      const assetL2Data = l2Data[chainId]?.get(asset.symbol);
      if (!assetL2Data || !match(asset, assetL2Data)) continue;

      l2Data[chainId].delete(asset.symbol);
      whitelistedNew.push({
        name: asset.name,
        coingeckoId: asset.coingeckoId,
        address: assetL2Data.addressL2,
        symbol: asset.symbol,
        decimals: asset.decimals,
        deploymentTimestamp: asset.deploymentTimestamp,
        coingeckoListingTimestamp: asset.coingeckoListingTimestamp,
        chainId: +chainId,
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
