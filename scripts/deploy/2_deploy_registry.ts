import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

import { log } from "../util/log";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
  const { deployer, adminFirst, adminSecond } = await getNamedAccounts();
  const { deploy } = deployments;

  log(bre, "===================================");
  log(bre, "Deploying Registry");
  log(bre, "===================================");

  const admins = [adminFirst, adminSecond];

  log(bre, "\nReferencing Addresses:");
  log(bre, `Admins: ${admins}`);

  const { address, receipt } = await deploy("Registry", {
    contractName: "Registry",
    from: deployer,
    args: [admins],
  });

  log(bre, `\Registry deployed to ${bre.network.name}\n`);
  log(bre, `Deploy tx: ${receipt.transactionHash}`);
  log(bre, `Address: ${address}\n`);
};

export default func;
