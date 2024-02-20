import { expect } from "earl";
import contracts from "./contracts/contracts.json";
import path from "path";
import fs from "fs";
import { ethers } from "ethers";
import assets from "@/core/clients/coincap/assets/whitelisted.json";

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
      try {
        const checksummedAddress = ethers.getAddress(asset.address);
        expect(checksummedAddress).toEqual(asset.address);
      } catch (error) {
        throw new Error(
          `Address ${asset.address} for ${asset.name} (${asset.ticker}) is not checksummed.`,
        );
      }
    });
  });
});
