import { Wallet, utils } from "ethers";
import { Provider } from "ethers/providers";
import { BigNumberish } from "ethers/utils";

import { DAIMockFactory } from "../../typechain/DAIMockFactory";

export async function setupDAIToken(
  wallet: Wallet,
  initialReceivers: string[],
  balance: BigNumberish,
) {
  const token = await new DAIMockFactory(wallet).deploy(initialReceivers, balance);
  const address = token.address;
  return {
    token,
    address,
    initialReceivers,
    balance,
  };
}

export async function setupDAITokenFixture(provider: Provider, wallets: Wallet[]) {
  return setupDAIToken(
    wallets[0],
    wallets.slice(0, 5).map((w) => {
      return w.address;
    }),
    utils.parseEther("1000000"),
  );
}
