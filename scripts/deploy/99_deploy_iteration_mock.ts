import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  if (bre.network.name === "mainnet" || bre.network.name === "ropsten") {
    console.log(`Skipping deployment to network ${bre.network.name}`);
    return; // Do not deploy this to mainnet.
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