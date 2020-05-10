import { pathExists, readFile, readJSON, writeFile, writeJSON } from "fs-extra";

import { join } from "path";

export interface Deployment {
  network: string;
  contracts: string[];
}

export interface ManifestEntry {
  name: string;
  network: string;
  chainID: number;
  address: string;
  blockNumber: number | undefined;
  txHash: string | undefined;
}

export async function readDeploymentFile(
  path: string,
  network: string,
): Promise<Deployment | undefined> {
  const deploymentPath = parseDeploymentPath(path, network);
  if (await pathExists(deploymentPath)) {
    return readJSON(deploymentPath, { encoding: "utf8" });
  }
  return undefined;
}

export async function writeDeploymentFile(path: string, deployment: Deployment): Promise<void> {
  return writeJSON(parseDeploymentPath(path, deployment.network), deployment, {
    encoding: "utf8",
    spaces: 2,
  });
}

export async function readManifestEntryFile(
  path: string,
  name: string,
  network: string,
): Promise<ManifestEntry | undefined> {
  const manifestEntryPath = parseManifestEntryPath(path, name, network);
  if (await pathExists(manifestEntryPath)) {
    return readJSON(manifestEntryPath, { encoding: "utf8" });
  }
  return undefined;
}

export async function writeManifestEntryFile(path: string, entry: ManifestEntry): Promise<void> {
  await writeJSON(parseManifestEntryPath(path, entry.name, entry.network), entry, {
    encoding: "utf8",
    spaces: 2,
  });
}

function parseDeploymentPath(path: string, network: string): string {
  return join(path, `deployment.${network}.manifest`);
}

function parseManifestEntryPath(path: string, name: string, network: string): string {
  return join(path, `${name}.${network}.manifest`);
}
