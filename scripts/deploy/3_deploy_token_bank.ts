import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
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
    contractName: "TokenBank",
    from: deployer,
    args: [daiTokenAddress, admins, drainVaultReceiver, escapeHatchCaller, escapeHatchDestination],
  });

  console.log(`\nRSCTK Token deployed to ${bre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
