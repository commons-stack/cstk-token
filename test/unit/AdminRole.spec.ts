import { deployments, ethers, getNamedAccounts } from "@nomiclabs/buidler";
import { expect, use } from "chai";

import { AdminRoleMock } from "../../build/types/AdminRoleMock";
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Testing AdminRole contract", function () {
  let owner: string;
  let adminFirst: string;
  let other: string;

  let adminRole: AdminRoleMock;

  beforeEach(async function () {
    await deployments.fixture();

    const accounts = await getNamedAccounts();
    owner = accounts.owner;
    adminFirst = accounts.adminFirst;
    other = accounts.other;

    const deployment = await deployments.get("TestAdminRole");
    adminRole = (await ethers.getContractAt("AdminRoleMock", deployment.address)) as AdminRoleMock;
  });

  describe("When deploying contract", function () {
    it("Should deploy to a proper address", async function () {
      expect(adminRole.address).to.be.properAddress;
    });

    it("Should deploy contract and set Owner as Admin", async function () {
      expect(await adminRole.isOwner()).to.be.true;
      expect(await adminRole.isAdmin(owner)).to.be.true;
    });

    it("Should deploy with the correct admins", async function () {
      expect(await adminRole.isAdmin(adminFirst)).to.be.true;
    });

    // TODO: test construction
    // it("Should not fail when adding msg sender redundantly in admin list", async function () {
    //   await deploy(own);
    // });
  });

  describe("With deployed contract", function () {
    describe("When adding admins", async function () {
      it("Should allow an admin to add another admin", async function () {
        await adminRole.addAdmin(other);
        expect(await adminRole.isAdmin(other)).to.be.true;
      });

      it("Should revert if a non-admin attempts to add an admin", async function () {
        const otherSigner = ethers.provider.getSigner(other);
        await expect(adminRole.connect(otherSigner).addAdmin(other)).to.be.reverted;
      });

      it("Should revert if adding an exisiting admin", async function () {
        await expect(adminRole.addAdmin(adminFirst)).to.be.reverted;
      });
    });

    describe("When renouncing an admin", function () {
      it("Should allow an exisiting admin to renounce her role", async function () {
        await adminRole.renounceAdmin(); // We are the owner!
        expect(await adminRole.isAdmin(owner)).to.be.false;
      });

      it("Should revert if not called by an exisiting admin", async function () {
        const otherSigner = ethers.provider.getSigner(other);
        await expect(adminRole.connect(otherSigner).renounceAdmin()).to.be.reverted;
      });
    });

    describe("When removing an admin", function () {
      it("Should allow the owner to remove an existing admin", async function () {
        await adminRole.removeAdmin(adminFirst);
        expect(await adminRole.isAdmin(adminFirst)).to.be.false;
      });

      it("Should revert if address is not an admin", async function () {
        await expect(adminRole.removeAdmin(other)).to.be.reverted;
      });

      it("Should revert if not called by the owner", async function () {
        const otherSigner = ethers.provider.getSigner(owner);
        await expect(adminRole.connect(otherSigner).removeAdmin(other)).to.be.reverted;
      });
    });
  });
});
