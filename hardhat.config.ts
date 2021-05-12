import { HardhatUserConfig, task } from "hardhat/config";
import { generate, get } from "./scripts/accounts";

import { remove } from "fs-extra";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";

import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";

require("dotenv-safe").config({
  allowEmptyValues: true,
});

require("./scripts/trustedAccounts");
require("./scripts/addTrusted");
require("./scripts/removeTrusted");
require("./scripts/mintCSTK");
require("./scripts/mintDAI");

const MNEMONIC = process.env.MNEMONIC || "";
const DEVCHAIN_ACCOUNT_NUM = Number(process.env.DEVCHAIN_ACCOUNT_NUM || "20");
const DEVCHAIN_BALANCE_ETH = Number(process.env.DEVCHAIN_BALANCE_ETH || "1000");
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const SOLC_VERSION = process.env.SOLC_VERSION || "";
const SOLC_OPTIMIZER_ENABLED = process.env.SOLC_OPTIMIZER_ENABLED === "true";
const GAS_REPORTER_ENABLED = process.env.GAS_REPORTER_ENABLED === "true";

const config: HardhatUserConfig = {
  paths: {
    artifacts: "build/contracts",
    cache: "build/cache",
    deploy: "scripts/deploy",
    deployments: "build/deployments",
    tests: "test",
  },
  networks: {
    hardhat: {
      accounts: generate(MNEMONIC, DEVCHAIN_ACCOUNT_NUM, DEVCHAIN_BALANCE_ETH),
    },
    local: {
      url: " http://127.0.0.1:8545/",
    },
    coverage: {
      url: "http://127.0.0.1:5458",
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${INFURA_API_KEY}`,
      accounts: {
        mnemonic: MNEMONIC,
      },
    },
  },
  namedAccounts: {
    deployer: { default: 0 },
    owner: { default: 0 },
    adminFirst: { default: 0 },
    adminSecond: { default: 1 },
    adminThird: { default: 2 },
    adminFourth: { default: 3 },
    drainVaultReceiver: { default: 0 },
    escapeHatchCaller: { default: 0 },
    escapeHatchDestination: { default: 0 },
    other: { default: 9 },
  },
  solidity: {
    version: SOLC_VERSION,
    settings: {
      optimizer: {
        runs: 200,
        enabled: SOLC_OPTIMIZER_ENABLED,
      },
    },
  },
  gasReporter: {
    enabled: GAS_REPORTER_ENABLED,
    // artifactType: "buidler-v1",
  },
  etherscan: {
    // url: "https://api.etherscan.io/api",
    apiKey: ETHERSCAN_API_KEY,
  },
};

task("accounts", "Print devchain accounts").setAction(async () => {
  const accounts = get(MNEMONIC, DEVCHAIN_ACCOUNT_NUM);
  console.log("Accounts:\n");
  for (const a of accounts) {
    console.log(a);
  }
});

task("clean", "Cleans the cache, deletes artifacts and generated coverage reports")
  .addFlag("keepCoverage", "Skip deleting coverage")
  .addFlag("keepTypechain", "Skip deleting typechain code")
  .setAction(async ({ keepCoverage, keepTypechain }, _, runSuper) => {
    if (!keepCoverage) {
      await remove("build/coverage");
      await remove("coverage.json");
    }
    if (!keepTypechain) {
      await remove("build/types");
    }
    await runSuper();
  });

export default config;
