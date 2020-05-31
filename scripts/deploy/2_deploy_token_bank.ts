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

  await deployments.deploy("TokenBank", {
    contractName: "TokenBank",
    from: deployer,
    args: [
      daiMock.address,
      [adminFirst, adminSecond],
      drainVaultReceiver,
      escapeHatchCaller,
      escapeHatchDestination,
    ],
  });
};

export default func;
