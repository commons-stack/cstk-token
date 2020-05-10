import { resolveAccounts } from "./util/resolveAccounts";
import { task } from "@nomiclabs/buidler/config";

require("./deployContract");

task("deploy", "Deploy the smart contracts")
  .addFlag("force", "Ignore cache on contract compilation")
  .addFlag("quiet", "Do not print to stdout")
  .setAction(async ({ force, quiet }, { ethers, run }) => {
    const log = quiet ? () => {} : console.log;

    const signers = await ethers.getSigners();
    const resolved = await resolveAccounts(signers);

    const registry = await run("deploy-contract", {
      name: "Registry",
      args: [resolved.admins],
      deployer: resolved.signers.deployer,
      quiet,
      force,
    });
  });
