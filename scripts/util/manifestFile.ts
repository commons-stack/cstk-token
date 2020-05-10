import { writeFile } from "fs-extra";

export interface Deployment {
  network: string;
  contracts: string[];
}

export interface ManifestEntry {
  chainID: number;
  address: string;
  blockHash: string | undefined;
  txHash: string | undefined;
}
