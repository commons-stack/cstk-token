import { parseEther } from "ethers/utils";
import { resolveAccounts } from "./fixture/resolveAccounts";
import { task } from "@nomiclabs/buidler/config";
import { writeDeploymentFile } from "./util/manifestFile";

require("./util/deployContract");

task("deploy", "Deploy the smart contracts")
  .addFlag("force", "Ignore cache on contract compilation")
  .addFlag("quiet", "Do not print to stdout")
  .setAction(async ({ force, quiet }, { config, ethers, run, network }) => {
    const log = quiet ? () => {} : console.log;

    // Run compile task, pass --force flag:
    await run("compile", { force });

    const signers = await ethers.getSigners();
    const resolved = await resolveAccounts(signers);

    // DAI mock contract:

    // TODO: figure out a way to interact with the deployed contract without using Typechain bindings:

    const daiMock = await run("deploy-contract", {
      name: "DAIMock",
      args: [resolved.all, parseEther("1000000000")],
      deployer: resolved.signers.deployer,
      quiet,
      force,
    });

    // Registry contract:

    await run("deploy-contract", {
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
      contracts: ["DAIMock", "Registry"],
    });
  });
