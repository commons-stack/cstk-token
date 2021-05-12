import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name === "mainnet" || hre.network.name === "ropsten") {
    console.log(`Skipping deployment to network ${hre.network.name}`);
    return; // Do not deploy this to mainnet.
  }
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, adminFirst } = await getNamedAccounts();

  await deploy("TestAdminRole", {
    contract: "AdminRoleMock",
    from: deployer,
    args: [[adminFirst]],
  });
};

export default func;
