import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

import { log } from "../util/log";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  log(bre, "===================================");
  log(bre, "Deploying Mock CSTK Token Manager");
  log(bre, "===================================");

  const { address, receipt } = await deploy("CSTKTokenManagerMock", {
    contractName: "CSTKTokenManagerMock",
    from: deployer,
  });

  log(bre, `\nMock CSTK Token Manager deployed to ${bre.network.name}\n`);
  log(bre, `Deploy tx: ${receipt.transactionHash}`);
  log(bre, `Address: ${address}\n`);
};

export default func;
