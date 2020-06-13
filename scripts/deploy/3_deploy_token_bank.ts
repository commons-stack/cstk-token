import { BuidlerRuntimeEnvironment, DeployFunction } from "@nomiclabs/buidler/types";

import { log } from "../util/log";

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

  log(bre, "===================================");
  log(bre, "Deploying Token Bank");
  log(bre, "===================================");

  log(bre, "\nReferencing deployed contracts:\n");
  log(bre, `DAI Token at '${daiTokenAddress}'`);

  log(bre, "\nReferencing addresses:\n");
  log(bre, `Admins: ${admins}`);
  log(bre, `DrainVault Receiver: ${drainVaultReceiver}`);
  log(bre, `EscapeHatch Caller: ${escapeHatchCaller}`);
  log(bre, `EscapeHatch Destination: ${escapeHatchDestination}`);

  const { address, receipt } = await deployments.deploy("TokenBank", {
    contractName: "TokenBank",
    from: deployer,
    args: [daiTokenAddress, admins, drainVaultReceiver, escapeHatchCaller, escapeHatchDestination],
  });

  log(bre, `\nRSCTK Token deployed to ${bre.network.name}\n`);
  log(bre, `Deploy tx: ${receipt.transactionHash}`);
  log(bre, `Address: ${address}\n`);
};

export default func;
