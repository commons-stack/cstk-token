import { BuidlerRuntimeEnvironment } from "@nomiclabs/buidler/types";

const allowedNetworks = ["mainnet", "ropsten", "rinkeby", "localhost", "coverage"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(bre: BuidlerRuntimeEnvironment, message?: any): void {
  if (allowedNetworks.includes(bre.network.name)) {
    console.log(message);
  }
}
