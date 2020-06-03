import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  console.log("===================================");
  console.log("Deploying Mock CSTK Token Manager");
  console.log("===================================");

  const { address, receipt } = await deploy("CSTKTokenManagerMock", {
    contractName: "CSTKTokenManagerMock",
    from: deployer,
  });

  console.log(`\nMock CSTK Token Manager deployed to ${bre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
