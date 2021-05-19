import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  console.log("===================================");
  console.log("Deploying Mock CSTK Token Manager");
  console.log("===================================");

  const { address, receipt } = await deploy("CSTKTokenManagerMock", {
    contract: "CSTKTokenManagerMock",
    from: deployer,
  });

  console.log(`\nMock CSTK Token Manager deployed to ${hre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
