import { internalTask } from "@nomiclabs/buidler/config";
import { writeManifestEntryFile } from "./manifestFile";

internalTask(
  "deploy:contract",
  "Deploy an instance of a smart contract and write a manifest file",
).setAction(async ({ name, args, deployer, quiet }, { config, ethers, network }) => {
  const log = quiet ? () => {} : console.log;
  const factory = await ethers.getContractFactory(name);
  await factory.connect(deployer);

  const instance = await factory.deploy(...args);

  await writeManifestEntryFile(config.paths.artifacts, {
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
