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
  const registry = await deployments.get("Registry");

  // Construction parameters:

  // Iteration 1: CSTK rate = 2.5 CSTK/DAI, Soft Cap =  984000 DAI, Hard Cap =  1250000 DAI
  // _newIteration(5, 2, 984000, 1250000);
  // Iteration 2: CSTK rate = 2 CSTK/DAI, Soft Cap =  796000 DAI, Hard Cap =  1000000 DAI
  // _newIteration(2, 1, 796000, 1000000);
  // Iteration 3: CSTK rate = 1.5 CSTK/DAI, Soft Cap =  1170000 DAI, Hard Cap =  1500000 DAI
  // _newIteration(3, 2, 1170000, 1500000);
  // Iteration 4: CSTK rate = 1.25 CSTK/DAI, Soft Cap =  820000 DAI, Hard Cap =  1000000 DAI
  // _newIteration(5, 4, 820000, 1000000);
  // Iteration 5: CSTK rate = 1 CSTK/DAI, Soft Cap =  2950000 DAI, Hard Cap =  3750000 DAI
  // _newIteration(1, 1, 2950000, 3750000);

  const numerators = [5, 2, 3, 5, 1];
  const denominators = [2, 1, 2, 4, 1];
  const softCaps = [984000, 796000, 1170000, 820000, 2950000];
  const hardCaps = [1250000, 1000000, 1500000, 1000000, 3750000];
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
  console.log(`Registry at: '${registryAddress}`);

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
