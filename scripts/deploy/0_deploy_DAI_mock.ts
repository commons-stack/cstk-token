import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

import { get } from "../accounts";
import { log } from "../util/log";
import { parseEther } from "ethers/utils";

const MNEMONIC = process.env.MNEMONIC || "";
const DEVCHAIN_ACCOUNT_NUM = Number(process.env.DEVCHAIN_ACCOUNT_NUM || "20");
const MOCK_DAI_BALANCE = process.env.MOCK_DAI_BALANCE || "1000000";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  log(bre, "================================");
  log(bre, "Deploying DAI Mock Contract");
  log(bre, "================================");

  const { address, receipt } = await deploy("DAIMock", {
    from: deployer,
    args: [get(MNEMONIC, DEVCHAIN_ACCOUNT_NUM), parseEther(MOCK_DAI_BALANCE)],
  });

  log(bre, `\nDAI Mock deployed to ${bre.network.name}\n`);
  log(bre, `Deploy tx: ${receipt.transactionHash}`);
  log(bre, `Address: ${address}\n`);
};

export default func;
