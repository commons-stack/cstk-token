import { Wallet, utils } from "ethers";

interface BuidlerNetworkAccount {
  privateKey: string;
  balance: string;
}

const DEFAULT_WALLET_HDPATH = "m/44'/60'/0'/0/";

/**
 * Generate an array of BuidlerNetworkAccounts from a given mnemonic.
 * Useful for initailizing buidlerevm.
 * @param mnemonic <string> Mnemonic seed (usually from env)
 * @param count <number> Accounts to generate
 * @param balance <number> Amount of ether to allocate
 */
export function generate(
  mnemonic: string,
  count: number,
  balance: number,
): BuidlerNetworkAccount[] {
  const accounts: BuidlerNetworkAccount[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const hdPath = DEFAULT_WALLET_HDPATH + i;
    const wallet = Wallet.fromMnemonic(mnemonic, hdPath);
    const ethBalance = utils.parseEther(balance.toString());
    accounts[i] = { privateKey: wallet.privateKey, balance: ethBalance.toString() };
  }
  return accounts;
}

/**
 * Get a given number of accounts generated from a mnemonic.
 * @param mnemonic <string> Mnemonic seed (usually from env)
 * @param count <number> Number of accounts to get
 */
export function get(mnemonic: string, count: number): string[] {
  const accounts: string[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const hdPath = DEFAULT_WALLET_HDPATH + i;
    const wallet = Wallet.fromMnemonic(mnemonic, hdPath);
    accounts[i] = wallet.address;
  }
  return accounts;
}

// TODO: extract this to consts.
const DEFAULT_MNEMONIC = process.env.MNEMONIC || "";
const DEVCHAIN_ACCOUNT_NUM = Number(process.env.DEVCHAIN_ACCOUNT_NUM || "20");

/**
 * Get default accounts configured from the environment.
 */
export function getDefault(): string[] {
  return get(DEFAULT_MNEMONIC, DEVCHAIN_ACCOUNT_NUM);
}
