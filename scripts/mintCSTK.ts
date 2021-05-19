import { constants } from "ethers";
// import { CSTKTokenManagerMock } from "../build/types/CSTKTokenManagerMock";
import { task, types } from "hardhat/config";

const { AddressZero } = constants;

task("mint-cstk", "Mint test CSTK tokens to an account")
  .addPositionalParam("account", "Beneficiary address", undefined, types.string)
  .addPositionalParam("amount", "Amount of CSTK to mint", undefined, types.string)
  .setAction(async ({ account, amount }, hre) => {
    if (account === AddressZero) {
      console.error("Cannot mint to zero address");
      return;
    }
    if (amount === "0") {
      console.error("Cannot mint 0 tokens");
      return;
    }

    const { ethers, deployments, network } = hre;
    const mockAddress = (await deployments.get("CSTKTokenManagerMock")).address;
    const token = await ethers.getContractAt("CSTKTokenManagerMock", mockAddress); // as CSTKTokenManagerMock;

    console.log(
      `Minting ${amount} CSTK => ${account} on contract [${network.name}] ${mockAddress}`,
    );

    const tx = await token.mint(account, ethers.utils.parseEther(amount));
    const receipt = await tx.wait();

    console.log("\nSuccess!");
    console.log(`tx hash: ${receipt.transactionHash}`);
  });
