import { outputFile, readJSON } from "fs-extra";

import { EOL } from "os";
import { ManifestEntry } from "./manifestFile";
import { join } from "path";

export async function generateAddressFile(path: string, entry: ManifestEntry) {
  const filePath = join(path, entry.name, `${entry.name}.address.js`);
  const file = `module.exports = ${entry.address}${EOL}`;

  return outputFile(filePath, file, { encoding: "utf8" });
}

export async function generateABIAndBytecode(
  path: string,
  artifactPath: string,
  entry: ManifestEntry,
) {
  const { abi, bytecode } = await parseArtifact(artifactPath, entry.name);

  const abiPath = join(path, entry.name, `${entry.name}.abi.js`);
  const abiFile = `module.exports = ${JSON.stringify(abi)}${EOL}`;
  await outputFile(abiPath, abiFile, { encoding: "utf8" });

  const bytecodePath = join(path, entry.name, `${entry.name}.bytecode.js`);
  const bytecodeFile = `module.exports = ${bytecode}${EOL}`;
  await outputFile(bytecodePath, bytecodeFile, { encoding: "utf8" });
}

async function parseArtifact(
  artifactPath: string,
  contractName: string,
): Promise<{ abi: Array<any>; bytecode: string }> {
  const artifact = await readJSON(join(artifactPath, `${contractName}.json`));

  return {
    abi: artifact.abi,
    bytecode: artifact.bytecode,
  };
}
