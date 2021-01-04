import { task, types } from "@nomiclabs/buidler/config";

import { Registry } from "../build/types/Registry";

task("remove-trusted", "Remove a trusted account from the registry")
  .addPositionalParam("account", "Address of an exisitng trusted account", undefined, types.string)
  .setAction(async ({ account }, bre) => {
    const { ethers, deployments, network } = bre;
    const registryAddress = (await deployments.get("Registry")).address;
    const registry = (await ethers.getContractAt("Registry", registryAddress)) as Registry;

    console.log(`Connected to Registry contract: [${network.name}] ${registryAddress}`);
    console.log(`Removing trusted account ${account}`);

    const trust = await registry.getMaxTrust(account);
    if (trust.isZero()) {
      console.error(`Account ${account} is not in the trust list`);
      return;
    }

    const tx = await registry.removeContributor(account);
    const receipt = await tx.wait();

    console.log("\nSuccess!");
    console.log(`Tx hash: ${receipt.transactionHash}`);
  });
