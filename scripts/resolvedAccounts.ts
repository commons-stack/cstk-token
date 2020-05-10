import { Provider } from "ethers/providers";
import { resolveAccounts } from "./util/resolveAccounts";
import { task } from "@nomiclabs/buidler/config";

async function logAccount(provider: Provider, name: string, address: string) {
  console.log(`${name}:     \t${address}`);
}

task("resolved-accounts", "Print resolved account names and balances").setAction(
  async (_, { ethers }) => {
    console.log("======================================================================");
    console.log("NAME:     \tADDRESS:");
    console.log("======================================================================");

    const signers = await ethers.getSigners();
    const resolved = await resolveAccounts(signers);

    await logAccount(ethers.provider, "owner", resolved.owner);
    await logAccount(ethers.provider, "deployer", resolved.deployer);
    await logAccount(ethers.provider, "other", resolved.other);

    console.log("======================================================================");
  },
);
