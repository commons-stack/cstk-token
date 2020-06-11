import { AddressZero } from "ethers/constants";
import { CSTKTokenManagerMock } from "../build/types/CSTKTokenManagerMock";
import { task } from "@nomiclabs/buidler/config";
import { types } from "@nomiclabs/buidler/config";

task("mint-cstk", "Mint test CSTK tokens to an account")
  .addPositionalParam("account", "Beneficiary address", undefined, types.string)
  .addPositionalParam("amount", "Amount of CSTK to mint", undefined, types.string)
  .setAction(async ({ account, amount }, bre) => {
    if (account === AddressZero) {
      console.error("Cannot mint to zero address");
      return;
    }
    if (amount === "0") {
      console.error("Cannot mint 0 tokens");
      return;
    }

    const { ethers, deployments, network } = bre;
    const mockAddress = (await deployments.get("CSTKTokenManagerMock")).address;
    const token = (await ethers.getContractAt(
      "CSTKTokenManagerMock",
      mockAddress,
    )) as CSTKTokenManagerMock;

    console.log(
      `Minting ${amount} CSTK => ${account} on contract [${network.name}] ${mockAddress}`,
    );

    const tx = await token.mint(account, ethers.utils.parseEther(amount));
    const receipt = await tx.wait();

    console.log("\nSuccess!");
    console.log(`tx hash: ${receipt.transactionHash}`);
  });
