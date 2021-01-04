import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
  const { deployer, adminFirst, adminSecond } = await getNamedAccounts();
  const { deploy } = deployments;

  console.log("===================================");
  console.log("Deploying Registry");
  console.log("===================================");

  const admins = [adminFirst, adminSecond];

  console.log("\nReferencing Addresses:");
  console.log(`Admins: ${admins}`);

  const { address, receipt } = await deploy("Registry", {
    contractName: "Registry",
    from: deployer,
    args: [admins],
  });

  console.log(`\Registry deployed to ${bre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
