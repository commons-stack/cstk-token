import { resolveAccounts } from "./util/resolveAccounts";
import { task } from "@nomiclabs/buidler/config";
import { writeDeploymentFile } from "./util/manifestFile";

require("./deployContract");

task("deploy", "Deploy the smart contracts")
  .addFlag("force", "Ignore cache on contract compilation")
  .addFlag("quiet", "Do not print to stdout")
  .setAction(async ({ force, quiet }, { config, ethers, run, network }) => {
    const log = quiet ? () => {} : console.log;

    const signers = await ethers.getSigners();
    const resolved = await resolveAccounts(signers);

    // Registry contract:

    const registry = await run("deploy-contract", {
      name: "Registry",
      args: [resolved.admins],
      deployer: resolved.signers.deployer,
      quiet,
      force,
    });

    // Finalize deployment:

    log(`\nFinished deployment, writing deployment manifest for network ${network.name}`);
    await writeDeploymentFile(config.paths.artifacts, {
      network: network.name,
      contracts: ["Registry"],
    });
  });
