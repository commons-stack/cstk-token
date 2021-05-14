import { deployments, ethers, getNamedAccounts } from "hardhat";
import { expect, use } from "chai";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";

import { constants } from "ethers";
// import { Registry } from "../../build/types/Registry";
import { parseEther as eth } from "ethers/lib/utils";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers/lib/ethers";

const { AddressZero } = constants;

use(solidity);

describe("Test Registry", function () {
  let admins: string[];
  let contributors: string[];
  let other: string;
  let otherSecond: string;

  let registry: Contract;
  let cstkToken: Contract;

  beforeEach(async function () {
    await deployments.fixture();

    const accounts = await getNamedAccounts();
    other = accounts.other;
    otherSecond = accounts.otherSecond;
    admins = [accounts.adminFirst, accounts.adminSecond];

    contributors = [
      accounts.adminFirst,
      accounts.adminSecond,
      accounts.adminThird,
      accounts.adminFourth,
    ];

    const registryDeployment = await deployments.get("Registry");
    registry = await ethers.getContractAt("Registry", registryDeployment.address); // as Registry;

    const cstkTokenDeployment = await deployments.get("CSTKTokenManagerMock");
    cstkToken = await ethers.getContractAt("CSTKTokenManagerMock", cstkTokenDeployment.address); // as Registry;
  });

  it("Should set the correct admins", async function () {
    for (const adm of admins) {
      expect(await registry.isAdmin(adm)).to.be.true;
    }
    expect(await registry.isAdmin(other)).to.be.false;
  });

  describe("When registering a contributor", function () {
    it("Should revert if not called by an Admin role", async function () {
      const otherSigner = ethers.provider.getSigner(other);
      await expect(
        registry.connect(otherSigner).registerContributor(other, "10000", "20000"),
      ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
    });

    it("Should revert if address is zero address", async function () {
      await expect(registry.registerContributor(AddressZero, "10000", "20000")).to.be.revertedWith(
        "Cannot register zero address",
      );
    });

    it("Should revert if max trust is zero", async function () {
      await expect(registry.registerContributor(other, "0", "2000")).to.be.revertedWith(
        "Cannot set a max trust of 0",
      );
    });

    it("Should register a valid address and max trust", async function () {
      await expect(registry.registerContributor(other, eth("1"), eth("2")))
        .to.emit(registry, "ContributorAdded")
        .withArgs(other);

      expect(await registry.getMaxTrust(other)).to.eq(eth("1"));
      expect(await registry.getPendingBalance(other)).to.eq(eth("2"));
    });
  });

  describe("When removing a contributor", function () {
    it("Should revert if not called by an Admin role", async function () {
      const otherSigner = ethers.provider.getSigner(other);
      await expect(registry.connect(otherSigner).removeContributor(other)).to.be.revertedWith(
        "AdminRole: caller does not have the Admin role",
      );
    });

    it("Should revert if address is zero address", async function () {
      await expect(registry.removeContributor(AddressZero)).to.be.revertedWith(
        "Cannot remove zero address",
      );
    });

    it("Should revert if the address is not a contributor", async function () {
      await expect(registry.removeContributor(other)).to.be.revertedWith(
        "Address is not a contributor",
      );
    });

    describe("With a registered contributor", function () {
      beforeEach(async function () {
        await registry.registerContributor(other, eth("1"), eth("2"));
      });

      it("Should remove an existing contributor", async function () {
        await expect(registry.removeContributor(other))
          .to.emit(registry, "ContributorRemoved")
          .withArgs(other);
      });
    });
  });

  describe("When registering multiple contributors", function () {
    it("Should revert if not called by an admin address", async function () {
      const signer = ethers.provider.getSigner(other);
      await expect(
        registry.connect(signer).registerContributors(1, [other], [eth("1")], [eth("2")]),
      ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
    });

    it("Should revert if invald number of addresses", async function () {
      await expect(
        registry.registerContributors(2, [other], [eth("1")], [eth("2")]),
      ).to.be.revertedWith("Invalid number of addresses");
    });

    it("Should revert if invalid number of max trust values", async function () {
      await expect(
        registry.registerContributors(2, [other, other], [eth("1")], [eth("2")]),
      ).to.be.revertedWith("Invalid number of trust values");
    });

    it("Should revert if contributors are duplicated", async function () {
      await expect(
        registry.registerContributors(
          2,
          [other, other],
          [eth("1"), eth("1")],
          [eth("1"), eth("1")],
        ),
      ).to.be.revertedWith("Contributor already registered");
    });

    it("Should register a list of valid contributors", async function () {
      const maxTrusts = [eth("1"), eth("2"), eth("3"), eth("4")];
      const pendingBalances = [eth("5"), eth("6"), eth("7"), eth("8")];
      await registry.registerContributors(4, contributors, maxTrusts, pendingBalances);

      expect(await registry.getContributors()).to.be.deep.eq(contributors);
    });
  });

  describe("When getting contributor info", function () {
    const trusts = [eth("1"), eth("2"), eth("3"), eth("4")];
    const pendingBalances = [eth("5"), eth("6"), eth("7"), "0"];

    beforeEach(async function () {
      await registry.registerContributors(4, contributors, trusts, pendingBalances);
    });

    it("Should return the right contributor info", async function () {
      const got = await registry.getContributorInfo();
      expect(got.contributors).to.deep.eq(contributors);
      expect(got.trusts.map((t) => t.toString())).to.deep.eq(trusts.map((t) => t.toString()));
      expect(got.pendingBalances.map((t) => t.toString())).to.deep.eq(
        pendingBalances.map((t) => t.toString()),
      );
    });
  });

  describe("When setting pendingBalance of a contributor", async function () {
    it("Should return zero for initial contributor", async function () {
      await registry.registerContributor(other, eth("1"), eth("2"));
      expect(await registry.getPendingBalance(other)).to.eq(eth("2"));
    });

    it("Should revert if is not called by an Admin role", async function () {
      await registry.registerContributor(other, eth("1"), "0");
      await registry.registerContributor(otherSecond, eth("1"), "0");

      const otherSecondSigner = ethers.provider.getSigner(otherSecond);
      await expect(
        registry.connect(otherSecondSigner).setPendingBalance(other, eth("1")),
      ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
      await expect(
        registry.connect(otherSecondSigner).setPendingBalances(1, [otherSecond], [eth("2")]),
      ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
    });

    it("Should set a valid pending balance", async function () {
      await registry.registerContributor(other, eth("1"), "0");
      await expect(registry.setPendingBalance(other, eth("3")), "Pending balance is not set")
        .to.emit(registry, "PendingBalanceSet")
        .withArgs(other, eth("3"));
      expect(await registry.getPendingBalance(other)).to.eq(eth("3"));
    });

    it("Should rise a valid pending balance", async function () {
      await registry.registerContributor(other, eth("1"), eth("2"));
      expect(await registry.getPendingBalance(other)).to.eq(eth("2"));
      await expect(registry.addPendingBalance(other, eth("3")), "Pending balance is not risen")
        .to.emit(registry, "PendingBalanceRise")
        .withArgs(other, eth("3"));
      expect(await registry.getPendingBalance(other)).to.eq(eth("5"));
    });

    it("Should set a multiple valid pending balance", async function () {
      const maxTrusts = [eth("1"), eth("2"), eth("3"), eth("4")];
      await registry.registerContributors(4, contributors, maxTrusts, [0, 0, 0, 0]);

      const pendingBalances = [eth("1"), eth("2"), eth("3"), eth("4")];
      await expect(
        registry.setPendingBalances(4, contributors, pendingBalances),
        "Pending balance is not set",
      ).to.be.ok;

      for (let i = 0; i < contributors.length; i++) {
        const contributor = contributors[i];
        const pendingBalance = pendingBalances[i];
        expect(await registry.getPendingBalance(contributor)).to.eq(pendingBalance);
      }
    });

    it("Should rise a multiple valid pending balance", async function () {
      const values = [eth("1"), eth("2"), eth("3"), eth("4")];
      await registry.registerContributors(4, contributors, values, values);

      await expect(
        registry.addPendingBalances(4, contributors, values),
        "Pending balance is not set",
      ).to.be.ok;

      for (let i = 0; i < contributors.length; i++) {
        const contributor = contributors[i];
        const pendingBalance = values[i].mul(2);
        expect(await registry.getPendingBalance(contributor)).to.eq(pendingBalance);
      }
    });

    it("Should revert if address is zero", async function () {
      await expect(registry.setPendingBalance(AddressZero, eth("1"))).to.be.revertedWith(
        "Cannot set pending balance for zero balance",
      );
    });

    it("Should revert if address is not a contributor", async function () {
      await expect(registry.setPendingBalance(other, eth("1"))).to.be.revertedWith(
        "Address is not a contributor",
      );
    });

    it("Should revert if cstk balance is not zero", async function () {
      await registry.registerContributor(other, eth("1"), "0");
      await cstkToken.mint(other, eth("2"));
      await expect(registry.setPendingBalance(other, eth("1"))).to.be.revertedWith(
        "User has activated his membership",
      );
    });

    it("Should set minter contract address", async function () {
      const minterAccount = otherSecond;

      // Set minterAccount
      await expect(registry.setMinterContract(minterAccount))
        .to.emit(registry, "MinterContractSet")
        .withArgs(minterAccount);

      const otherSigner = ethers.provider.getSigner(other);
      await expect(registry.connect(otherSigner).setMinterContract(other)).to.be.revertedWith(
        "AdminRole: caller does not have the Admin role",
      );
    });

    it("Should clear an account pending balance", async function () {
      await registry.registerContributor(other, eth("1"), "0");
      await registry.setPendingBalance(other, eth("2"));
      expect(await registry.getPendingBalance(other)).to.eq(eth("2"));

      const minter = otherSecond;

      // Set minterAccount
      await registry.setMinterContract(minter);

      const minterSigner = ethers.provider.getSigner(minter);
      await expect(
        registry.connect(minterSigner).clearPendingBalance(other),
        "clearPendingBalance by minter",
      )
        .to.emit(registry, "PendingBalanceCleared")
        .withArgs(other, eth("2"));
      expect(await registry.getPendingBalance(other)).to.eq(eth("0"));
    });
  });

  it("Should revert if caller is not minter", async function () {
    await registry.registerContributor(other, eth("1"), "0");
    await registry.setPendingBalance(other, eth("2"));
    expect(await registry.getPendingBalance(other)).to.eq(eth("2"));

    // Clear by one of admins
    await expect(registry.clearPendingBalance(other)).to.revertedWith(
      "Caller is not Minter Contract",
    );
    expect(await registry.getPendingBalance(other)).to.eq(eth("2"));

    const otherSecondSigner = ethers.provider.getSigner(otherSecond);
    await expect(registry.connect(otherSecondSigner).clearPendingBalance(other)).to.revertedWith(
      "Caller is not Minter Contract",
    );
    expect(await registry.getPendingBalance(other)).to.eq(eth("2"));
  });
});
