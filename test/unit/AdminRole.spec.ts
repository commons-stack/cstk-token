import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { loadFixture, solidity } from "ethereum-waffle";
import { Signer } from "ethers";

import { AdminRoleMock } from "../../typechain/AdminRoleMock";
import { AdminRoleMockFactory } from "../../typechain/AdminRoleMockFactory";

use(solidity);

describe("Testing AdminRole contract", function () {
  let signers: Signer[];
  let ownerSigner: Signer;
  let owner: string;
  let defaultAdmins: string[];
  let otherSigner: Signer;
  let other: string;

  async function deploy(
    accounts: string[],
    deployer: Signer = ownerSigner,
  ): Promise<AdminRoleMock> {
    const factory = new AdminRoleMockFactory(deployer);
    return factory.deploy(accounts);
  }

  beforeEach(async function () {
    signers = await ethers.getSigners();

    ownerSigner = signers[0];
    owner = await ownerSigner.getAddress();

    defaultAdmins = [
      await signers[1].getAddress(),
      await signers[2].getAddress(),
      await signers[3].getAddress(),
    ];

    otherSigner = signers[4];
    other = await otherSigner.getAddress();
  });

  describe("When deploying contract", function () {
    it("Should deploy contract and set Owner as Admin", async function () {
      const adminRole = await deploy([]);

      expect(await adminRole.isOwner()).to.be.true;
      expect(await adminRole.isAdmin(owner)).to.be.true;
    });

    it("Should deploy with multiple admins", async function () {
      const adminRole = await deploy(defaultAdmins);

      expect(await adminRole.isAdmin(owner)).to.be.true;
      for (const adr of defaultAdmins) {
        expect(await adminRole.isAdmin(adr)).to.be.true;
      }
    });

    it("Should not fail when adding msg sender redundantly in admin list", async function () {
      const adminRole = await deploy([owner, defaultAdmins[1], owner, defaultAdmins[2]]);

      expect(await adminRole.isAdmin(owner)).to.be.true;
      expect(await adminRole.isAdmin(defaultAdmins[1])).to.be.true;
      expect(await adminRole.isAdmin(defaultAdmins[2])).to.be.true;
    });
  });

  describe("With deployed contract", function () {
    let adminRole: AdminRoleMock;

    beforeEach(async function () {
      adminRole = await deploy(defaultAdmins);
    });

    it("Should fetch existing admins", async function () {
      expect(await adminRole.isAdmin(defaultAdmins[0])).to.be.true;
    });

    describe("When adding admins", async function () {
      it("Should allow an admin to add another admin", async function () {
        await adminRole.addAdmin(other);
        expect(await adminRole.isAdmin(other)).to.be.true;
      });

      it("Should revert if a non-admin attempts to add an admin", async function () {
        await expect(adminRole.connect(otherSigner).addAdmin(other)).to.be.reverted;
      });

      it("Should revert if adding an exisiting admin", async function () {
        await expect(adminRole.addAdmin(owner)).to.be.reverted;
      });
    });

    describe("When renouncing an admin", function () {
      it("Should allow an exisiting admin to renounce her role", async function () {
        await adminRole.connect(ownerSigner).renounceAdmin(); // We are the owner!
        expect(await adminRole.isAdmin(owner)).to.be.false;
      });

      it("Should revert if not called by an exisiting admin", async function () {
        await expect(adminRole.connect(otherSigner).renounceAdmin()).to.be.reverted;
      });
    });

    describe("When removing an admin", function () {
      it("Should allow the owner to remove an existing admin", async function () {
        await adminRole.connect(ownerSigner).removeAdmin(defaultAdmins[0]);
        expect(await adminRole.isAdmin(defaultAdmins[0])).to.be.false;
      });

      it("Should revert if address is not an admin", async function () {
        await expect(adminRole.removeAdmin(other)).to.be.reverted;
      });

      it("Should revert if not called by the owner", async function () {
        await expect(adminRole.connect(otherSigner).removeAdmin(defaultAdmins[0])).to.be.reverted;
      });
    });
  });
});
