import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

const func: DeployFunction = async (bre: BuidlerRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = bre;
  const { deploy } = deployments;

  const {
    deployer,
    adminFirst,
    adminSecond,
    adminThird,
    adminFourth,
    escapeHatchCaller,
    escapeHatchDestination,
    drainVaultReceiver,
  } = await getNamedAccounts();

  const cstkManagerMock = await deployments.get("CSTKTokenManagerMock");
  const tokenBank = await deployments.get("TokenBank");
  const registry = await deployments.get("Whitelist Registry");

  // Construction parameters:
  // TODO: set this to correct values.
  const numerators = [1, 1, 1, 1, 1];
  const denominators = [1, 1, 1, 1, 1];
  const softCaps = [900, 900, 900, 900, 900];
  const hardCaps = [1000, 1000, 1000, 1000, 1000];
  const tokenBankAddress = tokenBank.address;
  const cstkTokenAddress = cstkManagerMock.address;
  const cstkTokenManagerAddress = cstkManagerMock.address;
  const registryAddress = registry.address;
  const admins = [adminFirst, adminSecond, adminThird, adminFourth];

  console.log("================================");
  console.log("Deploying RCSTK Token");
  console.log("================================");

  console.log("\nReferencing deployed contracts:\n");
  console.log(`TokenBank at '${tokenBankAddress}'`);
  console.log(`CSTK Token at '${cstkTokenAddress}`);
  console.log(`CSTK Token Manager at '${cstkTokenManagerAddress}'`);
  console.log(`Whitelist Registry at: '${registryAddress}`);

  console.log("\nReferencing addresses\n");
  console.log(`Admins: ${admins}`);
  console.log(`EscapeHatch Caller: ${escapeHatchCaller}`);
  console.log(`EscapeHatch Destination: ${escapeHatchDestination}`);
  console.log(`DrainVault Receiver: ${drainVaultReceiver}`);

  const { address, receipt } = await deploy("RCSTKToken", {
    contractName: "RCSTKToken",
    from: deployer,
    args: [
      numerators,
      denominators,
      softCaps,
      hardCaps,
      tokenBankAddress,
      cstkTokenAddress,
      cstkTokenManagerAddress,
      registryAddress,
      admins,
      escapeHatchCaller,
      escapeHatchDestination,
    ],
  });

  console.log(`\nRSCTK Token deployed to ${bre.network.name}\n`);
  console.log(`Deploy tx: ${receipt.transactionHash}`);
  console.log(`Address: ${address}\n`);
};

export default func;
