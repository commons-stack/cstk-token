import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
  const { deployer, adminFirst, adminSecond } = await getNamedAccounts();
  const { deploy } = deployments;

  await deploy("Whitelist Registry", {
    contractName: "Registry",
    from: deployer,
    args: [[adminFirst, adminSecond]],
  });
};

export default func;
