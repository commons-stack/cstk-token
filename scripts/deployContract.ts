import { ManifestEntry, writeManifestEntryFile } from "./util/manifestFile";

import config from "../buidler.config";
import { join } from "path";
import { task } from "@nomiclabs/buidler/config";
import { writeFile } from "fs-extra";

task(
  "deploy-contract",
  "Deploy an instance of a smart contract and write a manifest file",
).setAction(async ({ name, args, deployer, force, quiet }, { run, ethers, network }) => {
  const log = quiet ? () => {} : console.log;
  const factory = await ethers.getContract(name);
  await factory.connect(deployer);

  // Run compile task, pass --force flag:
  await run("compile", { force });

  const instance = await factory.deploy(...args);

  await writeManifestEntryFile(config.paths?.artifacts || "artifacts", {
    name,
    network: network.name,
    chainID: instance.deployTransaction.chainId,
    address: instance.address,
    blockNumber: instance.deployTransaction.blockNumber,
    txHash: instance.deployTransaction.hash,
  });

  log(`Deployed ${name} to ${instance.address}, tx hash: ${instance.deployTransaction.hash}`);

  return instance.deployed();
});
