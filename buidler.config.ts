import { BuidlerConfig, task, usePlugin } from "@nomiclabs/buidler/config";

import { remove } from "fs-extra";

require("dotenv-safe").config();

require("./scripts/accounts");
require("./scripts/deploy");
require("./scripts/publish");
require("./scripts/resolvedAccounts");

usePlugin("@nomiclabs/buidler-ethers");
usePlugin("@nomiclabs/buidler-etherscan");
usePlugin("buidler-typechain");
usePlugin("buidler-gas-reporter");
usePlugin("solidity-coverage");

// Default values:
const SOLC_VERSION = process.env.SOLC_VERSION || "0.5.17";
const SOLC_OPTIMIZER_ENABLED = process.env.SOLC_OPTIMIZER_ENABLED ? true : false;
const GAS_REPORTER_ENABLED = process.env.GAS_REPORTER_ENABLED ? true : false;
// const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

const config: BuidlerConfig = {
  paths: {
    artifacts: "artifacts",
    tests: "test",
  },
  defaultNetwork: "buidlerevm",
  solc: {
    version: SOLC_VERSION,
    optimizer: {
      runs: 200,
      enabled: SOLC_OPTIMIZER_ENABLED,
    },
  },
  gasReporter: {
    enabled: GAS_REPORTER_ENABLED,
    artifactType: "buidler-v1",
  },
  networks: {
    local: {
      url: " http://127.0.0.1:8545/",
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
  },
  etherscan: {
    url: "https://api.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers",
  },
};

task("clean", "Cleans the cache, deletes artifacts and generated coverage reports")
  .addFlag("keepCoverage", "Skip deleting coverage")
  .addFlag("keepDist", "Keep generated contract acessor code")
  .setAction(async ({ keepCoverage, keepDist }, bre, runSuper) => {
    if (!keepCoverage) {
      await remove("coverage");
      await remove("coverage.json");
    }
    if (!keepDist) {
      await remove("dist");
    }
    await runSuper(); // Run the default clean operation:
  });

export default config;
