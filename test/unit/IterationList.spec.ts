import { deployments, ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";

import { IterationMock } from "../../build/types/IterationMock";
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Testing Iteration Library", function () {
  const BLOCK_NUM = "10000000";
  const TIMESTAMP = "12345";

  let iteration: IterationMock;

  beforeEach(async function () {
    await deployments.fixture();

    const deployment = await deployments.get("IterationMock");
    iteration = (await ethers.getContractAt("IterationMock", deployment.address)) as IterationMock;
  });

  async function expectCurrent(ok: boolean, num: number): Promise<void> {
    const cur = await iteration.currentIteration();
    expect(cur.ok).to.eq(ok);
    expect(cur.num).to.eq(num);
  }

  async function expectConversionRatio(numerator: string, denominator: string): Promise<void> {
    const cR = await iteration.conversionRatio();
    expect(cR.numerator).to.eq(numerator);
    expect(cR.denominator).to.eq(denominator);
  }

  it("Should revert if starting with no added iterations", async function () {
    await expect(iteration.startFirst("100000000")).to.be.revertedWith("No iterations added");
  });

  it("Should revert if adding iteration where numerator is 0", async function () {
    await expect(iteration.add("0", "1", "1000", "100000")).to.be.revertedWith(
      "Numerator cannot be 0",
    );
  });

  it("Should revert if adding iteration where denominator is 0", async function () {
    await expect(iteration.add("1", "0", "1000", "100000")).to.be.revertedWith(
      "Denominator cannot be 0",
    );
  });

  it("Should revert if adding iteration where soft cap is greater than hard cap", async function () {
    await expect(iteration.add("1", "1", "10000000", "10000")).to.be.revertedWith(
      "Hard cap cannot be less than soft cap",
    );
  });

  it("Should revert if contrbuting with no iterations added", async function () {
    await expect(iteration.contribute("1111", "22222")).to.be.revertedWith(
      "Current iteration not active",
    );
  });

  it("Should revert if redeeming with no iterations added", async function () {
    await expect(iteration.redeem("12345")).to.be.revertedWith("Current iteration not active");
  });

  it("Should return the conversion ratio", async function () {
    await iteration.add("1", "2", "1000", "100000");
    await expectConversionRatio("1", "2");
  });

  describe("When testing contributions and redemptions", function () {
    const SOFTCAP = "10000";
    const HADRCAP = "100000";

    beforeEach(async function () {
      await iteration.add("1", "1", SOFTCAP, HADRCAP);
      await iteration.startFirst(BLOCK_NUM);
    });

    it("Should contribute/redeem funds", async function () {
      await iteration.contribute("1000", TIMESTAMP);
      expect(await iteration.totalReceived()).to.eq("1000");

      await iteration.redeem("1000");
      expect(await iteration.totalReceived()).to.eq(0);
    });

    it("Should set the soft cap timestamp", async function () {
      expect(await iteration.softCapTimestamp()).to.eq("0");

      await iteration.contribute("20000", TIMESTAMP);
      expect(await iteration.softCapTimestamp()).to.eq(TIMESTAMP);
    });

    it("Should forbid redemption if iteration reached hard cap", async function () {
      await iteration.contribute("20000", TIMESTAMP);
      await expect(iteration.redeem("1000")).to.be.revertedWith("Iteration reached soft cap");
    });

    it("Should return the diff if a contribution goes over the iteration hard cap", async function () {
      await expect(iteration.contribute("100001", TIMESTAMP))
        .to.emit(iteration, "OperationResult")
        .withArgs("1");
    });

    it("Should revert if the iteration reached hard cap", async function () {
      await iteration.contribute("100001", TIMESTAMP);
      await expect(iteration.contribute("100", TIMESTAMP)).to.be.revertedWith("Hard cap reached");
    });
  });

  it("Should cycle through iterations", async function () {
    // Add test iterations (1-4):
    await iteration.add("1", "10", "10000", "100000");
    await iteration.add("2", "20", "20000", "200000");
    await iteration.add("3", "30", "30000", "300000");
    await iteration.add("4", "40", "50000", "400000");

    // At start: count = 4, no current active:
    expect(await iteration.cnt()).to.eq(4);
    await expectCurrent(false, 0);

    // Start the first iteration:
    await iteration.startFirst(BLOCK_NUM);

    // Current iteration = 0, MF = 1/1
    await expectCurrent(true, 0);
    await expectConversionRatio("1", "10");

    // Go to the next iteration:
    await iteration.next(BLOCK_NUM);

    // Current iteration = 1, MF = 2/2
    await expectCurrent(true, 1);
    await expectConversionRatio("2", "20");

    // Go to the next iteration:
    await iteration.next(BLOCK_NUM);

    // Current iteration = 2, MF = 3/3
    await expectCurrent(true, 2);
    await expectConversionRatio("3", "30");

    // Go to the next iteration:
    await iteration.next(BLOCK_NUM);

    // Current iteration = 3, MF = 3/3
    await expectCurrent(true, 3);
    await expectConversionRatio("4", "40");

    // Should revert if going past the last iteration:
    await expect(iteration.next(BLOCK_NUM)).to.be.revertedWith("No next iteration");

    // Final state:
    expect(await iteration.isActive("3")).to.be.true;
  });
});
