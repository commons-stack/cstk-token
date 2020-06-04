import { BigNumber, parseEther } from "ethers/utils";
import { deployments, ethers, getNamedAccounts } from "@nomiclabs/buidler";
import { expect, use } from "chai";

import { Registry } from "../../build/types/Registry";
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Test Whitelist Registry", function () {
  interface ContributorInfo {
    address: string;
    maxTrust: BigNumber;
  }

  function getAddresses(cons: ContributorInfo[]): string[] {
    const addresses: string[] = [];
    for (const c of cons) {
      addresses.push(c.address);
    }
    return addresses;
  }

  function getMaxTrust(cons: ContributorInfo[]): BigNumber[] {
    const amts: BigNumber[] = [];
    for (const c of cons) {
      amts.push(c.maxTrust);
    }
    return amts;
  }

  let admins: string[];
  let contributors: ContributorInfo[];
  let other: string;

  let registry: Registry;

  beforeEach(async function () {
    await deployments.fixture();

    const accounts = await getNamedAccounts();
    other = accounts.other;
    admins = [accounts.adminFirst, accounts.adminSecond];

    contributors = [
      { address: accounts.adminFirst, maxTrust: parseEther("1") },
      { address: accounts.adminSecond, maxTrust: parseEther("2") },
      { address: accounts.adminThird, maxTrust: parseEther("3") },
      { address: accounts.adminFourth, maxTrust: parseEther("4") },
    ];

    const deployment = await deployments.get("Whitelist Registry");
    registry = (await ethers.getContractAt("Registry", deployment.address)) as Registry;
  });

  describe("When deploying contract", function () {
    it("Should deploy to a proper address", async function () {
      expect(registry.address).to.be.properAddress;
    });
  });

  describe("With the deployed contract", function () {
    it("Should set the correct admins", async function () {
      for (const adm of admins) {
        expect(await registry.isAdmin(adm)).to.be.true;
      }
      expect(await registry.isAdmin(other)).to.be.false;
    });

    it("Should not register any contributors", async function () {
      for (const con of contributors) {
        expect(await registry.isContributor(con.address)).to.be.false;
        expect(await registry.getAllowed(con.address)).to.be.equal(0);
      }
    });

    describe("When adding contributors", function () {
      it("Should revert if not called by an Admin role", async function () {
        const otherSigner = ethers.provider.getSigner(other);
        await expect(
          registry
            .connect(otherSigner)
            .registerContributors(getAddresses(contributors), getMaxTrust(contributors)),
        ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
      });

      it("Should revert if number of parameters is mismatched", async function () {
        await expect(
          registry.registerContributors(getAddresses(contributors), ["100000000"]),
        ).to.be.revertedWith("Number of parameters mismatched");
      });

      it("Should revert if a contributor is a zero address", async function () {
        await expect(
          registry.registerContributors(
            [ethers.constants.AddressZero, other],
            ["1000000000", "10000000000"],
          ),
        ).to.be.reverted; // TODO: fix bad revert check in test
      });

      it("Should register a contributor and emit `ContributorAdded`", async function () {
        await expect(registry.registerContributors([other], ["100000000"]))
          .to.emit(registry, "ContributorAdded")
          .withArgs(other);
      });

      describe("With registered contributors", function () {
        beforeEach(async function () {
          await registry.registerContributors(
            getAddresses(contributors),
            getMaxTrust(contributors),
          );
        });

        it("Should register all contributors and set correct allowances", async function () {
          for (const con of contributors) {
            expect(await registry.isContributor(con.address)).to.be.true;
            // TODO: figure out the right type of comparison
            expect(await registry.getAllowed(con.address)).to.be.equal(con.maxTrust);
          }
        });

        it("Should not set any other contributors", async function () {
          expect(await registry.isContributor(other)).to.be.false;
          expect(await registry.getAllowed(other)).to.be.equal(0);
        });
      });
    });

    describe("When removing contributors", function () {
      it("Should revert if not called by an admin role", async function () {
        const otherSigner = ethers.provider.getSigner(other);
        await expect(
          registry.connect(otherSigner).removeContributors(getAddresses(contributors)),
        ).to.be.revertedWith("AdminRole: caller does not have the Admin role");
      });

      it("Should revert if removing a zero address", async function () {
        await expect(
          registry.removeContributors([ethers.constants.AddressZero, other]),
        ).to.be.revertedWith("Cannot be zero address");
      });

      it("Should remove contributors", async function () {
        await registry.registerContributors(getAddresses(contributors), getMaxTrust(contributors));
        const removed = contributors[0].address;
        await expect(registry.removeContributors([removed]))
          .to.emit(registry, "ContributorRemoved")
          .withArgs(removed);
        expect(await registry.isContributor(removed)).to.be.false;
      });
    });
  });
});
