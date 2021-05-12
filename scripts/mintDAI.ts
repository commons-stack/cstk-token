import { constants } from "ethers";
// import { DAIMock } from "../build/types/DAIMock";
import { task, types } from "hardhat/config";

task("mint-dai", "Mint test DAI tokens to an account")
  .addPositionalParam("account", "Beneficiary address", undefined, types.string)
  .addPositionalParam("amount", "Amount of DAI to mint", undefined, types.string)
  .setAction(async ({ account, amount }, hre) => {
    if (account === constants.AddressZero) {
      console.error("Cannot mint to zero address");
      return;
    }
    if (amount === "0") {
      console.error("Cannot mint 0 tokens");
      return;
    }

    const { ethers, deployments, network } = hre;
    const mockAddress = (await deployments.get("DAIMock")).address;
    const token = await ethers.getContractAt("DAIMock", mockAddress); // as DAIMock;

    console.log(`Minting ${amount} DAI => ${account} on contract [${network.name}] ${mockAddress}`);

    const tx = await token.mint(account, ethers.utils.parseEther(amount));
    const receipt = await tx.wait();

    console.log("\nSuccess!");
    console.log(`TX hash: ${receipt.transactionHash}`);
  });
