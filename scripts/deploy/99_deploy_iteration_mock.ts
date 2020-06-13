import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  if (bre.network.name === "mainnet" || bre.network.name === "ropsten") {
    return;
  }
  const { deployments, getNamedAccounts } = bre;
  const { deploy } = deployments;

  const { deployer, adminFirst } = await getNamedAccounts();

  await deploy("IterationMock", {
    contractName: "IterationMock",
    from: deployer,
  });
};

export default func;
