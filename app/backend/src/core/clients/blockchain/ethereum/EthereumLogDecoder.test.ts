import { expect } from "earl";
import contracts from "./contracts/contracts.json";
import path from "path";
import fs from "fs";
import { ethers } from "ethers";
import assets from "@/core/clients/coingecko/assets/whitelisted.json";

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
    // Skip the test if running in GitHub Actions
    if (process.env.CI || process.env.GITHUB_ACTIONS) {
      console.log("Skipping checksum test in GitHub Actions");
      return;
    }

    assets.forEach((asset) => {
      if (!asset.address) {
        expect(asset.coingeckoId).toEqual("ethereum");
      } else {
        const checksummedAddress: string = ethers.getAddress(
          asset.address.toLowerCase(),
        );
        try {
          expect(checksummedAddress).toEqual(asset.address);
        } catch (error) {
          throw new Error(
            `Address ${asset.address} for ${asset.name} (${asset.symbol}) is not checksummed: ${error}`,
          );
        }
      }
    });
  });
});
