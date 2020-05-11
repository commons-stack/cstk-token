import { ManifestEntry, writeManifestEntryFile } from "./manifestFile";

import config from "../../buidler.config";
import { join } from "path";
import { task } from "@nomiclabs/buidler/config";
import { writeFile } from "fs-extra";

task(
  "deploy-contract",
  "Deploy an instance of a smart contract and write a manifest file",
).setAction(async ({ name, args, deployer, quiet }, { ethers, network }) => {
  const log = quiet ? () => {} : console.log;
  const factory = await ethers.getContract(name);
  await factory.connect(deployer);

  const instance = await factory.deploy(...args);

  await writeManifestEntryFile(config.paths?.artifacts || "artifacts", {
    name,
    network: network.name,
    chainID: instance.deployTransaction.chainId,
    address: instance.address,
    blockNumber: instance.deployTransaction.blockNumber,
    txHash: instance.deployTransaction.hash,
    deployArgs: [...args],
  });

  log(`Deployed ${name} to ${instance.address}, tx hash: ${instance.deployTransaction.hash}`);

  return instance.deployed();
});
