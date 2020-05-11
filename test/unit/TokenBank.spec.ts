import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { Signer, utils, Wallet } from "ethers";
import { AddressZero } from "ethers/constants";
import { solidity } from "ethereum-waffle";

import { TokenBank } from "../../typechain/TokenBank";
import { TokenBankFactory } from "../../typechain/TokenBankFactory";
import { setupDAIToken } from "../fixtures/DAI-fixture";
import { DAIMock } from "../../typechain/DAIMock";
import { BigNumberish } from "ethers/utils";

use(solidity);

describe("Testing TokenBank contract", function () {
  const VAULT_ADDRESS = "0x000000000000000000000000000000000000dead";
  const TOTAL_ADDRESS = "0x000000000000000000000000000000000000babe";

  let signers: Signer[];

  let ownerSigner: Signer;
  let owner: string;

  let admins: string[];

  let otherSigner: Signer;
  let other: string;

  let daiAddress: string;
  let daiToken: DAIMock;

  // TODO: refactor factory pattern for TokenBank:

  interface TokenBankDeployParameters {
    deployer?: Signer;
    token?: string;
    admins?: string[];
    drainVaultReceiver?: string;
    escapeHatchCaller?: string;
    escapeHatchDestination?: string;
  }

  async function deployTokenBank(p: TokenBankDeployParameters): Promise<TokenBank> {
    return new TokenBankFactory(p.deployer || ownerSigner).deploy(
      p.token || daiAddress,
      p.admins || admins,
      p.drainVaultReceiver || owner,
      p.escapeHatchCaller || owner,
      p.escapeHatchDestination || owner,
    );
  }

  before(async function () {
    signers = await ethers.getSigners();

    ownerSigner = signers[0];
    owner = await ownerSigner.getAddress();

    admins = [await signers[1].getAddress(), await signers[2].getAddress()];

    otherSigner = signers[4];
    other = await otherSigner.getAddress();

    // Set up DAI token and initiall balances for accounts 1, 2 and 3:
    const fixture = await setupDAIToken(
      ownerSigner as Wallet,
      [await signers[1].getAddress(), await signers[2].getAddress(), await signers[3].getAddress()],
      utils.parseEther("1000000"),
    );
    daiToken = fixture.token;
    daiAddress = fixture.address;
  });

  describe("When deploying contract", function () {
    it("Should revert if the token address is zero", async function () {
      await expect(
        deployTokenBank({
          token: AddressZero,
        }),
      ).to.be.revertedWith("Deposit token cannot be zero adress");
    });

    it("Should revert if the drainVault receiver address is zero", async function () {
      await expect(
        deployTokenBank({
          drainVaultReceiver: AddressZero,
        }),
      ).to.be.revertedWith("Vault cannot be drained to zero address");
    });

    // TODO: as per Escapable, these checks are redundant. We can implement the constraints if we need to.

    // it("Should revert if the escape hatch caller address is zero", async function () {
    //   await expect(
    //     deployTokenBank({
    //       escapeHatchCaller: AddressZero,
    //     }),
    //   ).to.be.reverted;
    // });

    // it("Should revert if the escape hatch destination address is zero", async function () {
    //   await expect(
    //     deployTokenBank({
    //       escapeHatchDestination: AddressZero,
    //     }),
    //   ).to.be.reverted;
    // });
  });

  describe("With token deployed", function () {
    let tokenBank: TokenBank;

    async function increaseDAIAllowance(signer: Signer, amount: string) {
      return daiToken
        .connect(signer)
        .increaseAllowance(tokenBank.address, utils.parseEther(amount));
    }

    beforeEach(async function () {
      tokenBank = await deployTokenBank({ token: daiAddress });
      // Increase allowance for account 1 and 2:
      await increaseDAIAllowance(signers[1], "100");
      await increaseDAIAllowance(signers[2], "100");
    });

    describe("deposit", function () {
      it("Should revert if not called by an Admin", async function () {
        await expect(tokenBank.connect(otherSigner).deposit(other, "100000")).to.be.revertedWith(
          "AdminRole: caller does not have the Admin role",
        );
      });

      it("Should not allow deposits from the zero address", async function () {
        await expect(tokenBank.deposit(AddressZero, "10000")).to.be.revertedWith(
          "Cannot deposit from zero address",
        );
      });

      it("Should not allow deposits from VAULT reserved address", async function () {
        await expect(tokenBank.deposit(VAULT_ADDRESS, "10000")).to.be.revertedWith(
          "Cannot deposit from reserved address",
        );
      });

      it("Should not allow deposits from TOTAL reserved address", async function () {
        await expect(tokenBank.deposit(TOTAL_ADDRESS, "10000")).to.be.revertedWith(
          "Cannot deposit from reserved address",
        );
      });

      it("Should allow a deposit from a dai holder", async function () {
        const acc = signers[1];
        const adr = await acc.getAddress();

        await tokenBank.deposit(adr, utils.parseEther("1"));
        expect(await tokenBank.getTokenBalance(adr)).to.be.eq(utils.parseEther("1"));
        expect(await tokenBank.isAccount(adr)).to.be.true;
      });
    });

    describe("whitdraw", function () {
      beforeEach(async function () {
        // Deposit 10 DAI to signer 1:
        const acc = signers[1];
        const adr = await acc.getAddress();

        await tokenBank.deposit(adr, utils.parseEther("10"));
      });

      it("Should revert if not called by an Admin", async function () {
        await expect(tokenBank.connect(otherSigner).withdraw(other, "100000")).to.be.revertedWith(
          "AdminRole: caller does not have the Admin role",
        );
      });

      it("Should revert if account has insufficient balance in TokenBank", async function () {
        const acc = signers[2];
        const adr = await acc.getAddress();

        await expect(tokenBank.withdraw(adr, utils.parseEther("1000"))).to.be.revertedWith(
          "Address has insufficieant token balance to withdraw",
        );
      });

      it("Should allow a withdrawal from a TokenBank account", async function () {
        const acc = signers[1];
        const adr = await acc.getAddress();

        await tokenBank.withdraw(adr, utils.parseEther("10"));
        expect(await tokenBank.getTokenBalance(adr)).to.be.eq("0");
      });
    });
  });
});
