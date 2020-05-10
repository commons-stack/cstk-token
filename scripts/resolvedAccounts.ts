import { resolveAccounts } from "./util/resolveAccounts";
import { task } from "@nomiclabs/buidler/config";

async function logAccount(name: string, address: string) {
  console.log(`${name}:     \t${address}`);
}

task("resolved-accounts", "Print resolved account names and balances").setAction(
  async (_, { ethers }) => {
    console.log("======================================================================");
    console.log("NAME:     \tADDRESS:");
    console.log("======================================================================");

    const signers = await ethers.getSigners();
    const resolved = await resolveAccounts(signers);

    await logAccount("owner", resolved.owner);
    await logAccount("deployer", resolved.deployer);
    await logAccount("other", resolved.other);

    console.log("======================================================================");
  },
);
