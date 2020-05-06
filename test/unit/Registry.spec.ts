import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { Signer } from "ethers";
import { AddressZero } from "ethers/constants";

import { Registry } from "../../typechain/Registry";
import { RegistryFactory } from "../../typechain/RegistryFactory";

// Use solidity matchers in chai:
use(solidity);

describe("Test whitelist registry", function () {
  let signers: Signer[];
  let ownerSigner: Signer;
  let owner: string;
  let defaultAdmins: string[];
  let defaultContributors: string[];
  let otherSigner: Signer;
  let other: string;

  let registry: Registry;

  async function deploy(
    admins: string[] = defaultAdmins,
    deployer: Signer = ownerSigner,
  ): Promise<Registry> {
    const factory = new RegistryFactory(deployer);
    return factory.deploy(admins);
  }

  beforeEach(async function () {
    signers = await ethers.getSigners();

    // Owner:
    ownerSigner = signers[0];
    owner = await ownerSigner.getAddress();

    // Set the admins:
    defaultAdmins = [
      await signers[0].getAddress(),
      await signers[1].getAddress(),
      await signers[2].getAddress(),
    ];
    defaultContributors = [
      await signers[3].getAddress(),
      await signers[4].getAddress(),
      await signers[5].getAddress(),
    ];

    // Other:
    otherSigner = signers[6];
    other = await otherSigner.getAddress();

    // Deploy registry contract:
    registry = await deploy();
  });

  describe("When deploying registry contract", function () {
    it("Should deploy the contract", async function () {
      expect(registry.address).to.be.properAddress;
    });
  });

  describe("With the deployed registry contract", function () {
    const defaultAllowances = ["10000000", "20000000", "30000000"];

    async function checkIfAllAdmins(admins: string[]) {
      for (const adm of admins) {
        expect(await registry.isAdmin(adm)).to.be.true;
      }
    }

    async function checkIfAllContributors(contributors: string[]) {}

    it("Should set the correct admins", async function () {
      await checkIfAllAdmins(defaultAdmins);
      expect(await registry.isAdmin(other)).to.be.false;
    });

    it("Should not have any registered contributors", async function () {
      for (const con of defaultContributors) {
        expect(await registry.isContributor(con)).to.be.false;
      }
    });

    describe("When adding contributors", function () {
      beforeEach(async function () {
        await registry.registerContributors(defaultContributors, defaultAllowances);
      });

      it("should emit `ContributorAdded` events", async function () {
        // Should emit the correct number of events:
        for (const con of defaultContributors) {
          await expect(registry.registerContributors(defaultContributors, defaultAllowances))
            .to.emit(registry, "ContributorAdded")
            .withArgs(con);
        }
      });

      it("should add the right contributors with the right amounts", async function () {
        for (let i = 0; i < defaultContributors.length; i++) {
          const con = defaultContributors[i];
          const amt = defaultAllowances[i];
          expect(await registry.isContributor(con)).to.be.true;
          expect(await registry.getAllowed(con)).to.be.eq(amt);
        }
      });

      it("should not add any other contributors", async function () {
        expect(await registry.isContributor(other)).to.be.false;
        expect(await registry.getAllowed(other)).to.eq("0");
      });
    });

    describe("When removing contributors", function () {
      it("should revert if not called by an Admin", async function () {
        await expect(registry.connect(otherSigner).removeContributors(defaultContributors)).to.be
          .reverted;
      });

      describe("When called by an admin", function () {
        beforeEach(async function () {
          await registry.registerContributors(defaultContributors, defaultAllowances);
        });

        it("should revert if a contributor is a zero address", async function () {
          await expect(registry.removeContributors([other, AddressZero])).to.be.revertedWith(
            "Cannot be zero address",
          );
        });

        it("should remove a list of contributors", async function () {
          await registry.removeContributors([
            defaultContributors[0], // exists
            defaultContributors[2], // exists
            other, // does not exist
          ]);

          // Removed:
          expect(await registry.isContributor(defaultContributors[0])).to.be.false;
          expect(await registry.isContributor(defaultContributors[2])).to.be.false;

          // Not removed:
          expect(await registry.isContributor(defaultContributors[1])).to.be.true;
          expect(await registry.getAllowed(defaultContributors[1])).to.be.eq(defaultAllowances[1]);
        });
      });
    });
  });
});
