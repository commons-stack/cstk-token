import { Registry } from "../build/types/Registry";
import { task } from "@nomiclabs/buidler/config";

task("trusted-accounts", "Print all trusted accounts and their max trust").setAction(
  async ({}, bre) => {
    const { ethers, deployments } = bre;

    const registryAddress = (await deployments.get("Registry")).address;
    const registry = (await ethers.getContractAt("Registry", registryAddress)) as Registry;

    const info = await registry.getContributorInfo();

    for (let i = 0; i < info.contributors.length; i++) {
      console.log(`${info.contributors[i]},${info.trusts[i]}`);
    }
  },
);
