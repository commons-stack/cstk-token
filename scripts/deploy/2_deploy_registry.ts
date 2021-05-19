import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deployer, adminFirst, adminSecond } = await getNamedAccounts();
  const cstkManagerMock = await deployments.get("CSTKTokenManagerMock");

  const { deploy } = deployments;

  console.log("===================================");
  console.log("Deploying Registry");
  console.log("===================================");

  const admins = [adminFirst, adminSecond];
  const cstkTokenAddress = cstkManagerMock.address;

  console.log("\nReferencing Addresses:");
  console.log(`Admins: ${admins}`);

  const { address, receipt } = await deploy("Registry", {
    contract: "Registry",
    from: deployer,
    args: [admins, cstkTokenAddress],
  });

  console.log(`\Registry deployed to ${hre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
