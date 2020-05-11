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
  all: string[];
  signers: {
    owner: Signer;
    deployer: Signer;
    admins: Signer[];
    other: Signer;
    all: Signer[];
  };
}

export const TOTAL_ACCOUNTS = 10;

export async function resolveAccounts(signers: Signer[]): Promise<ResolvedAccounts> {
  let accounts: string[] = [];
  for (const sig of signers) {
    accounts.push(await sig.getAddress());
  }

  const owner = accounts[resolvedAccountIndexes["owner"]];
  const ownerSigner = signers[resolvedAccountIndexes["owner"]];

  const deployer = owner;
  const deployerSigner = ownerSigner;

  const other = accounts[resolvedAccountIndexes["other"]];
  const otherSigner = signers[resolvedAccountIndexes["other"]];

  let admins: string[] = [];
  let adminSigners: Signer[] = [];
  const adminIndexes = resolvedAccountIndexes["admins"];
  for (const idx in adminIndexes) {
    adminSigners.push(signers[idx]);
    admins.push(accounts[idx]);
  }

  return {
    owner,
    deployer,
    admins,
    other,
    all: accounts,
    signers: {
      owner: ownerSigner,
      deployer: deployerSigner,
      admins: adminSigners,
      other: otherSigner,
      all: signers,
    },
  };
}
