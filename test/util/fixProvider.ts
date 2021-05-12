/* eslint-disable @typescript-eslint/no-explicit-any */
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
import * as hre from "hardhat";

function fixProvider(env: HardhatRuntimeEnvironment): void {
  // alow it to be used by ethers without any change
  const provider = env.network.provider;
  if (provider.sendAsync === undefined) {
    provider.sendAsync = (
      req: {
        id: number;
        jsonrpc: string;
        method: string;
        params: any[];
      },
      callback: (error: any, result: any) => void,
    ): void => {
      provider
        .send(req.method, req.params)
        .then((result: any) => callback(null, { result, id: req.id, jsonrpc: req.jsonrpc }))
        .catch((error: any) => callback(error, null));
    };
  }
}

fixProvider(hre);
