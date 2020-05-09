import { task } from "@nomiclabs/buidler/config";
import { utils } from "ethers";

task("accounts", "Print pre-defined accounts and balances").setAction(async (_, { ethers }) => {
  console.log("======================================================================");
  console.log("NUM:\tADDRESS:\t\t\t\t\tETH:");
  console.log("======================================================================");

  const signers = await ethers.getSigners();
  let i = 0;
  for (const sig of signers) {
    i++;
    const addr = await sig.getAddress();
    const balanceEth = utils.formatEther(await ethers.provider.getBalance(addr));

    console.log(`${i}\t${addr}\t${balanceEth}`);
  }

  console.log("======================================================================");
});
