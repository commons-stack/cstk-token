import { resolveAccounts } from "./util/resolveAccounts";
import { task } from "@nomiclabs/buidler/config";

task("deploy", "Deploy the smart contracts")
  .addFlag("quiet", "Do not print to stdout")
  .setAction(async (taskArguments, { ethers }) => {
    const log = taskArguments.quiet ? () => {} : console.log;

    const signers = await ethers.getSigners();
    const resolved = await resolveAccounts(signers);

    log("Deploying Registry contract:");

    const registryFactory = await ethers.getContract("Registry");
    const registry = await registryFactory.deploy(resolved.admins);

    log(`Registry address: ${registry.address}`);
  });
