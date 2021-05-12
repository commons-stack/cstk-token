import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const {
    deployer,
    adminFirst,
    adminSecond,
    drainVaultReceiver,
    escapeHatchCaller,
    escapeHatchDestination,
  } = await getNamedAccounts();

  const daiMock = await deployments.get("DAIMock");

  const daiTokenAddress = daiMock.address;
  const admins = [adminFirst, adminSecond];

  console.log("===================================");
  console.log("Deploying Token Bank");
  console.log("===================================");

  console.log("\nReferencing deployed contracts:\n");
  console.log(`DAI Token at '${daiTokenAddress}'`);

  console.log("\nReferencing addresses:\n");
  console.log(`Admins: ${admins}`);
  console.log(`DrainVault Receiver: ${drainVaultReceiver}`);
  console.log(`EscapeHatch Caller: ${escapeHatchCaller}`);
  console.log(`EscapeHatch Destination: ${escapeHatchDestination}`);

  const { address, receipt } = await deployments.deploy("TokenBank", {
    contract: "TokenBank",
    from: deployer,
    args: [daiTokenAddress, admins, drainVaultReceiver, escapeHatchCaller, escapeHatchDestination],
  });

  console.log(`\nRSCTK Token deployed to ${hre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
