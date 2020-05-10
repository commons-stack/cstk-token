import { generateABIAndBytecode, generateAddressFile } from "./util/generators";
import { readDeploymentFile, readManifestEntryFile } from "./util/manifestFile";

import { task } from "@nomiclabs/buidler/config";

task("publish", "Publish deployed contract artifacts")
  .addPositionalParam(
    "networkName",
    "Name of the network to which the contract were deployed",
    "localhost",
  )
  .addOptionalParam("dir", "Directory path to write the generated code to")
  .setAction(async ({ networkName, dir }, { config }) => {
    const distPath = dir || "dist";

    console.log(`Publishing generated code to \\${distPath}\n`);

    const deployment = await readDeploymentFile(config.paths.artifacts, networkName);
    if (deployment === undefined) {
      console.log(`No deployment exists for network ${networkName}, please run deploy task first`);
      return false;
    }

    for (const contractName of deployment.contracts) {
      console.log(`Publishing contract ${contractName}`);
      const entry = await readManifestEntryFile(config.paths.artifacts, contractName, networkName);
      if (entry === undefined) {
        console.log(
          `Error fetching manifest entry file for ${contractName} on network ${networkName}. Make sure a deployment was performed and all files are in place`,
        );
        return false;
      }
      await generateAddressFile(distPath, entry);
      await generateABIAndBytecode(distPath, config.paths.artifacts, entry);
    }

    console.log("\nFinished publishing");
  });
