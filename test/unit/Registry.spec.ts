import { deployments, ethers, getNamedAccounts } from "@nomiclabs/buidler";
import { expect, use } from "chai";

import { AddressZero } from "ethers/constants";
import { Registry } from "../../build/types/Registry";
import { parseEther as eth } from "ethers/utils";
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Test Registry", function () {
  let admins: string[];
  let contributors: string[];
  let other: string;

  let registry: Registry;

  beforeEach(async function () {
    await deployments.fixture();

    const accounts = await getNamedAccounts();
    other = accounts.other;
    admins = [accounts.adminFirst, accounts.adminSecond];

    contributors = [
      accounts.adminFirst,
      accounts.adminSecond,
      accounts.adminThird,
      accounts.adminFourth,
    ];

    const deployment = await deployments.get("Registry");
    registry = (await ethers.getContractAt("Registry", deployment.address)) as Registry;
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
        registry.connect(otherSigner).registerContributor(other, "10000"),
      ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
    });

    it("Should revert if address is zero address", async function () {
      await expect(registry.registerContributor(AddressZero, "10000")).to.be.revertedWith(
        "Cannot register zero address",
      );
    });

    it("Should revert if max trust is zero", async function () {
      await expect(registry.registerContributor(other, "0")).to.be.revertedWith(
        "Cannot set a max trust of 0",
      );
    });

    it("Should register a valid address and max trust", async function () {
      await expect(registry.registerContributor(other, eth("1")))
        .to.emit(registry, "ContributorAdded")
        .withArgs(other);

      expect(await registry.getMaxTrust(other)).to.eq(eth("1"));
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
        await registry.registerContributor(other, eth("1"));
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
        registry.connect(signer).registerContributors(1, [other], [eth("1")]),
      ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
    });

    it("Should revert if invald number of addresses", async function () {
      await expect(registry.registerContributors(2, [other], [eth("1")])).to.be.revertedWith(
        "Invalid number of addresses",
      );
    });

    it("Should revert if invald number of max trust values", async function () {
      await expect(registry.registerContributors(2, [other, other], [eth("1")])).to.be.revertedWith(
        "Invalid number of trust values",
      );
    });

    it("Should revert if contributors are duplicated", async function () {
      await expect(
        registry.registerContributors(2, [other, other], [eth("1"), eth("1")]),
      ).to.be.revertedWith("Contributor already registered");
    });

    it("Should register a list of valid contributors", async function () {
      const maxTrusts = [eth("1"), eth("2"), eth("3"), eth("4")];
      await registry.registerContributors(4, contributors, maxTrusts);

      expect(await registry.getContributors()).to.be.deep.eq(contributors);
    });
  });

  describe("When getting contributor info", function () {
    const trusts = [eth("1"), eth("2"), eth("3"), eth("4")];

    beforeEach(async function () {
      await registry.registerContributors(4, contributors, trusts);
    });

    it("Should return the right contributor info", async function () {
      const got = await registry.getContributorInfo();
      expect(got.contributors).to.deep.eq(contributors);
      expect(got.trusts).to.deep.eq(trusts);
    });
  });
});
