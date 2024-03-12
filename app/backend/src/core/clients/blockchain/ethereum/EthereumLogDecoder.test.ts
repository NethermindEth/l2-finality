import { expect } from "earl";
import contracts from "./contracts/contracts.json";
import path from "path";
import fs from "fs";
import { ethers } from "ethers";
import assets from "@/core/clients/coingecko/assets/whitelisted.json";
import { getChecksumAddress } from "starknet";

describe("ABI Files Check", () => {
  it("should have an ABI file for each contract in contracts.json", () => {
    const abiDirectory = path.join(__dirname, "/contracts/abis");
    const contractNames = Object.keys(contracts) as (keyof typeof contracts)[];

    contractNames.forEach((contractName) => {
      const abiFilePath = path.join(abiDirectory, `${contractName}.json`);
      const exists = fs.existsSync(abiFilePath);
      expect(exists).toEqual(true);
    });
  });

  it("should have checksummed addresses for all assets", () => {
    assets.forEach((asset) => {
      if (!asset.address) {
        expect(asset.coingeckoId).toEqual("ethereum");
      } else if (asset.address.length > 42) {
        // Proceed with checksum validation for Starknet chain addresses
        try {
          const checksummedAddress: string = getChecksumAddress(asset.address);
          expect(checksummedAddress).toEqual(asset.address);
        } catch (error) {
          throw new Error(
            `Address ${asset.address} for ${asset.name} (${asset.symbol}) on chain #${asset.chainId} is not checksummed: ${error}`,
          );
        }
      } else {
        // Proceed with checksum validation for EVM chain addresses
        try {
          const checksummedAddress: string = ethers.getAddress(asset.address);
          expect(checksummedAddress).toEqual(asset.address);
        } catch (error) {
          throw new Error(
            `Address ${asset.address} for ${asset.name} (${asset.symbol}) on chain #${asset.chainId} is not checksummed: ${error}`,
          );
        }
      }
    });
  });
});
