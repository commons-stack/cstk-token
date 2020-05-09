import { Provider } from "ethers/providers";
import { resolveAccounts } from "./util/resolveAccounts";
import { task } from "@nomiclabs/buidler/config";
import { utils } from "ethers";

async function logAccount(provider: Provider, name: string, address: string) {
  const balance = utils.formatEther(await provider.getBalance(address));
  console.log(`${name}:  ${address}\t${balance}`);
}

task("resolved-accounts", "Print resolved account names and balances").setAction(
  async (_, { ethers }) => {
    console.log("======================================================================");
    console.log("NAME:\tADDRESS:\t\t\t\t\tETH:");
    console.log("======================================================================");

    const signers = await ethers.getSigners();
    const resolved = await resolveAccounts(signers);

    await logAccount(ethers.provider, "owner", resolved.owner);
    await logAccount(ethers.provider, "deployer", resolved.deployer);
    await logAccount(ethers.provider, "other", resolved.other);

    console.log("======================================================================");
  },
);
