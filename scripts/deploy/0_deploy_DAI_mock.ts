import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import { get } from "../accounts";
import { parseEther } from "ethers/lib/utils";

const MNEMONIC = process.env.MNEMONIC || "";
const DEVCHAIN_ACCOUNT_NUM = Number(process.env.DEVCHAIN_ACCOUNT_NUM || "20");
const MOCK_DAI_BALANCE = process.env.MOCK_DAI_BALANCE || "1000000";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  console.log("================================");
  console.log("Deploying DAI Mock Contract");
  console.log("================================");

  const { address, receipt } = await deploy("DAIMock", {
    from: deployer,
    args: [get(MNEMONIC, DEVCHAIN_ACCOUNT_NUM), parseEther(MOCK_DAI_BALANCE)],
  });

  console.log(`\nDAI Mock deployed to ${hre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
