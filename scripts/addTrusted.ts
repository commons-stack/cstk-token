import { task, types } from "@nomiclabs/buidler/config";

import { Registry } from "../build/types/Registry";

task("add-trusted", "Add an account to the trusted accounts and set max trust")
  .addPositionalParam("account", "Address to add to trusted accounts", undefined, types.string)
  .addPositionalParam("maxTrust", "Max trust to set for the account", undefined, types.string)
  .setAction(async ({ account, maxTrust }, bre) => {
    const { ethers, deployments, network } = bre;
    maxTrust = ethers.utils.parseEther(maxTrust);
    const registryAddress = (await deployments.get("Registry")).address;
    const registry = (await ethers.getContractAt("Registry", registryAddress)) as Registry;

    console.log(`Connected to Registry contract: [${network.name}] ${registryAddress}`);
    console.log(`Trusting ${account}, max trust: ${maxTrust}`);

    const tx = await registry.registerContributor(account, maxTrust);
    const receipt = await tx.wait();

    console.log("Success!");
    console.log(`Tx hash: ${receipt.transactionHash}`);
  });
