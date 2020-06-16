import { deployments, ethers, getNamedAccounts } from "@nomiclabs/buidler";
import { expect, use } from "chai";

import { AddressZero } from "ethers/constants";
import { RCSTKFactory } from "../../build/types/RCSTKFactory";
import { RCSTKMock } from "../../build/types/RCSTKMock";
import { bigNumberify } from "ethers/utils";
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Test RCSTK", function () {
  const STATE_CREATED = 0;

  let owner: string;
  let admins: string[];
  let escapeHatchCaller: string;
  let escapeHatchDestination: string;
  let rcstk: RCSTKMock;

  beforeEach(async function () {
    await deployments.fixture();

    const accounts = await getNamedAccounts();
    owner = accounts.owner;
    admins = [accounts.adminFirst, accounts.adminSecond];
    escapeHatchCaller = accounts.escapeHatchCaller;
    escapeHatchDestination = accounts.escapeHatchDestination;

    const rcstkAdr = await deployments.get("RCSTKMock");
    rcstk = (await ethers.getContractAt("RCSTKMock", rcstkAdr.address)) as RCSTKMock;
  });

  describe("When deploying contract", function () {
    const testCnt = 4;
    const testNumerators = ["1", "2", "3", "4"];
    const testDenominators = ["10", "20", "30", "40"];
    const testSoftCaps = ["1000", "2000", "3000", "4000"];
    const testHardCaps = ["10000", "20000", "30000", "40000"];

    let factory: RCSTKFactory;
    let tokenBankAddress: string;
    let cstkTokenAddress: string;
    let cstkTokenManagerAddress: string;
    let registryAddress: string;

    beforeEach(async function () {
      factory = new RCSTKFactory(ethers.provider.getSigner(owner));

      tokenBankAddress = (await deployments.get("TokenBank")).address;
      cstkTokenAddress = (await deployments.get("CSTKTokenManagerMock")).address;
      cstkTokenManagerAddress = cstkTokenAddress;
      registryAddress = (await deployments.get("Registry")).address;
    });

    it("Should revert if no iterations provided", async function () {
      await expect(
        factory.deploy(
          "0",
          [],
          [],
          [],
          [],
          tokenBankAddress,
          cstkTokenAddress,
          cstkTokenManagerAddress,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("Must have at least one iteration");
    });

    it("Should revert if invalid number of numerators", async function () {
      await expect(
        factory.deploy(
          "1",
          testNumerators,
          testDenominators,
          testSoftCaps,
          testHardCaps,
          tokenBankAddress,
          cstkTokenAddress,
          cstkTokenManagerAddress,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("Invalid number of numerators");
    });

    it("Should revert if invalid number of denominators", async function () {
      await expect(
        factory.deploy(
          testCnt,
          testNumerators,
          [],
          testSoftCaps,
          testHardCaps,
          tokenBankAddress,
          cstkTokenAddress,
          cstkTokenManagerAddress,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("Invalid number of denominators");
    });

    it("Should revert if invalid number of soft cap values", async function () {
      await expect(
        factory.deploy(
          testCnt,
          testNumerators,
          testDenominators,
          [],
          testHardCaps,
          tokenBankAddress,
          cstkTokenAddress,
          cstkTokenManagerAddress,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("Invalid number of soft cap values");
    });

    it("Should revert if invalid number of hard cap values", async function () {
      await expect(
        factory.deploy(
          testCnt,
          testNumerators,
          testDenominators,
          testSoftCaps,
          [],
          tokenBankAddress,
          cstkTokenAddress,
          cstkTokenManagerAddress,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("Invalid number of hard cap values");
    });

    it("Should revert if TokenBank contract address is zero", async function () {
      await expect(
        factory.deploy(
          testCnt,
          testNumerators,
          testDenominators,
          testSoftCaps,
          testHardCaps,
          AddressZero,
          cstkTokenAddress,
          cstkTokenManagerAddress,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("TokenBank must not be zero address");
    });

    it("Should revert if CSTK Token contract address is zero", async function () {
      await expect(
        factory.deploy(
          testCnt,
          testNumerators,
          testDenominators,
          testSoftCaps,
          testHardCaps,
          tokenBankAddress,
          AddressZero,
          cstkTokenManagerAddress,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("CSTK Token must not be zero address");
    });

    it("Should revert if CSTK Token Manager contract address is zero", async function () {
      await expect(
        factory.deploy(
          testCnt,
          testNumerators,
          testDenominators,
          testSoftCaps,
          testHardCaps,
          tokenBankAddress,
          cstkTokenAddress,
          AddressZero,
          registryAddress,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("CSTK Token Manager must not be zero address");
    });

    it("Should revert if Registry contract address is zero", async function () {
      await expect(
        factory.deploy(
          testCnt,
          testNumerators,
          testDenominators,
          testSoftCaps,
          testHardCaps,
          tokenBankAddress,
          cstkTokenAddress,
          cstkTokenManagerAddress,
          AddressZero,
          admins,
          escapeHatchCaller,
          escapeHatchDestination,
        ),
      ).to.be.revertedWith("Registry must not be zero address");
    });
  });

  describe("With deployed contract", function () {
    it("Should have proper starting state", async function () {
      expect(await rcstk.getFundraiseState()).to.eq(STATE_CREATED);
    });

    it("Should not be started after deployment", async function () {
      const got = await rcstk.getActiveIteration();
      expect(got.started).to.be.false;
      expect(got.no).to.eq(0);
    });

    it("Should be deployed with the correct number of iterations", async function () {
      expect(await rcstk.getIterationCnt()).to.eq(5);
    });

    it("Should be deployed with correct iterations", async function () {
      const numerators = [5, 2, 3, 5, 1].map(bigNumberify);
      const denominators = [2, 1, 2, 4, 1].map(bigNumberify);
      const softCaps = [984000, 796000, 1170000, 820000, 2950000].map(bigNumberify);
      const hardCaps = [1250000, 1000000, 1500000, 1000000, 3750000].map(bigNumberify);

      const got = await rcstk.getIterations();
      expect(got.numerators).to.deep.eq(numerators);
      expect(got.denominators).to.deep.eq(denominators);
      expect(got.softCaps).to.deep.eq(softCaps);
      expect(got.hardCaps).to.deep.eq(hardCaps);
    });

    describe("When cycling through the iterations", function () {
      beforeEach(async function () {
        await rcstk.startFundraise();
      });

      it("Should revert if already started", async function () {
        await expect(rcstk.startFundraise()).to.be.revertedWith("Fundraise already started");
      });

      it("Should revert if not all rCSTK tokens have been redeemed (from active iteration)", async function () {
        await rcstk.mint(owner, "1000000");
        await expect(rcstk.switchIteration()).to.be.revertedWith(
          "Not all rCSTK tokens from active iteration redeemed",
        );
      });

      it("Should revert if soft cap not reached", async function () {});
    });
  });
});
