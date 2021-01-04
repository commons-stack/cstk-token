import { ContractTransaction, utils } from "ethers";
import { deployments, ethers, getNamedAccounts } from "@nomiclabs/buidler";
import { expect, use } from "chai";

import { AddressZero } from "ethers/constants";
import { DAIMock } from "../../build/types/DAIMock";
import { TokenBank } from "../../build/types/TokenBank";
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Testing TokenBank contract", function () {
  const VAULT_ADDRESS = "0x000000000000000000000000000000000000dead";
  const TOTAL_ADDRESS = "0x000000000000000000000000000000000000babe";

  let owner: string;
  //   let admins: string[];
  let other: string;

  let dai: DAIMock;
  let bank: TokenBank;

  beforeEach(async function () {
    await deployments.fixture();

    const accounts = await getNamedAccounts();
    owner = accounts.owner;
    // admins = [accounts.adminFirst, accounts.adminSecond];
    other = accounts.other;

    const daiDeployment = await deployments.get("DAIMock");
    dai = (await ethers.getContractAt("DAIMock", daiDeployment.address)) as DAIMock;

    const bankDeployment = await deployments.get("TokenBank");
    bank = (await ethers.getContractAt("TokenBank", bankDeployment.address)) as TokenBank;
  });

  describe("When deploying TokenBank", function () {
    it("Should deploy to a proper address", async function () {
      expect(bank.address).to.be.properAddress;
    });

    // TODO: test deployment parameters.
  });

  describe("With token deployed", function () {
    async function increaseDAIAllowance(
      account: string,
      amount: string,
    ): Promise<ContractTransaction> {
      const signer = ethers.provider.getSigner(account);
      return dai.connect(signer).increaseAllowance(bank.address, utils.parseEther(amount));
    }

    describe("When making a deposit", function () {
      it("Should revert if not called by an Admin role", async function () {
        const signer = ethers.provider.getSigner(other);
        await expect(
          bank.connect(signer).deposit(other, utils.parseEther("1000")),
        ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
      });

      it("Should not allow deposits from the zero address", async function () {
        await expect(bank.deposit(AddressZero, utils.parseEther("1000"))).to.be.revertedWith(
          "Cannot deposit from zero address",
        );
      });

      it("Should not allow deposits from VAULT reserved address", async function () {
        await expect(bank.deposit(VAULT_ADDRESS, utils.parseEther("1000"))).to.be.revertedWith(
          "Cannot deposit from reserved address",
        );
      });

      it("Should not allow deposits from TOTAL reserved address", async function () {
        await expect(bank.deposit(TOTAL_ADDRESS, utils.parseEther("1000"))).to.be.revertedWith(
          "Cannot deposit from reserved address",
        );
      });

      it("Should allow a deposit from a valid DAI holder", async function () {
        await increaseDAIAllowance(other, "1");
        await bank.deposit(other, utils.parseEther("1"));
        expect(await bank.getTokenBalance(other)).to.be.eq(utils.parseEther("1"));
        expect(await bank.isAccount(other)).to.be.true;
      });
    });

    describe("whitdraw", function () {
      beforeEach(async function () {
        await increaseDAIAllowance(owner, "10");
        await bank.deposit(owner, utils.parseEther("10"));
      });

      it("Should revert if not called by an Admin", async function () {
        await increaseDAIAllowance(other, "100000");
        const signer = ethers.provider.getSigner(other);
        await expect(
          bank.connect(signer).withdraw(other, utils.parseEther("100000")),
        ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
      });

      it("Should revert if account has insufficient balance in TokenBank", async function () {
        await expect(bank.withdraw(other, utils.parseEther("9999999999999999"))).to.be.revertedWith(
          "Address has insufficieant token balance to withdraw",
        );
      });

      it("Should allow a withdrawal from a TokenBank account", async function () {
        await bank.withdraw(owner, utils.parseEther("10"));
        expect(await bank.getTokenBalance(owner)).to.be.eq("0");
      });
    });
  });
});
