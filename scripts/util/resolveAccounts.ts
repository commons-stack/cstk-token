import { Signer } from "ethers";

const resolvedAccountIndexes = {
  owner: 0,
  deployer: 0,
  admins: [0, 1, 2],
  other: 9,
};

export interface ResolvedAccounts {
  owner: string;
  deployer: string;
  admins: string[];
  other: string;
  signers: {
    owner: Signer;
    deployer: Signer;
    admins: Signer[];
    other: Signer;
  };
}

export const TOTAL_ACCOUNTS = 10;

export async function resolveAccounts(signers: Signer[]): Promise<ResolvedAccounts> {
  const owner = await signers[resolvedAccountIndexes["owner"]].getAddress();
  const other = await signers[resolvedAccountIndexes["other"]].getAddress();

  let admins: string[] = [];
  let adminSigners: Signer[] = [];
  const adminIndexes = resolvedAccountIndexes["admins"];
  for (const idx in adminIndexes) {
    const signer = signers[idx];
    adminSigners.push(signer);
    admins.push(await signer.getAddress());
  }
  return {
    owner,
    deployer: owner,
    admins,
    other,
    signers: {
      owner: signers[resolvedAccountIndexes["owner"]],
      deployer: signers[resolvedAccountIndexes["deployer"]],
      admins: adminSigners,
      other: signers[resolvedAccountIndexes["other"]],
    },
  };
}
