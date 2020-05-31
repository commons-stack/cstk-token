import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  if (bre.network.name === "mainnet") {
    return; // Do not deploy this to mainnet.
  }
  const { deployments, getNamedAccounts } = bre;
  const { deploy } = deployments;

  const { deployer, adminFirst } = await getNamedAccounts();

  await deploy("TestAdminRole", {
    contractName: "AdminRoleMock",
    from: deployer,
    args: [[adminFirst]],
  });
};

export default func;
