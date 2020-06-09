import { deployments, ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";

import { IterationMock } from "../../build/types/IterationMock";
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Testing Iteration Library", function () {
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

  async function expectMF(num: string, numerator: string, denominator: string): Promise<void> {
    const mf = await iteration.mf(num);
    expect(mf.numerator).to.eq(numerator);
    expect(mf.denominator).to.eq(denominator);
  }

  it("Should cycle through a set of iterations", async function () {
    // Revert if no iterations:
    await expect(iteration.startFirst("100000000")).to.be.revertedWith("No iterations added");

    // Add test iterations:
    await iteration.add("1", "1", "10000", "100000");
    await iteration.add("2", "2", "20000", "200000");
    await iteration.add("3", "3", "30000", "300000");
    await iteration.add("4", "4", "50000", "400000");

    // Total number = 4:
    expect(await iteration.cnt()).to.eq(4);

    // No current iteration:
    await expectCurrent(false, 0);

    // Start the fist iteration:
    await iteration.startFirst("1000000000");

    // Current iteration = 0, MF = 1/1
    await expectCurrent(true, 0);
    await expectMF("0", "1", "1");

    // Add/remove some DAI to/from the current iteration:
    // Total to remain: 10
    await iteration.addDAI("0", "20");
    expect(await iteration.totalReceived("0")).to.eq("20");
    await iteration.subDAI("0", "10");
    expect(await iteration.totalReceived("0")).to.eq("10");

    // Revert setting the soft cap if not the active iteration:
    await expect(iteration.setSoftCapReached("1", "123123")).to.be.revertedWith(
      "Iteration is not active",
    );

    // Set the soft cap timestamp:
    await iteration.setSoftCapReached("0", "123123");

    await expect(iteration.setSoftCapReached("0", "9999999")).to.be.revertedWith(
      "Soft cap already reached",
    );

    // Go to the next iteration:
    await iteration.next("2000000000");

    // Current iteration = 1, MF = 2/2
    await expectCurrent(true, 1);
    await expectMF("1", "2", "2");

    // Add/remove some DAI to/from the current iteration:
    // Total to remain: 20
    await iteration.addDAI("1", "30");
    expect(await iteration.totalReceived("1")).to.eq("30");
    await iteration.subDAI("1", "10");
    expect(await iteration.totalReceived("1")).to.eq("20");

    // Set the soft cap timestamp:
    await iteration.setSoftCapReached("1", "123123");

    // Go to the next iteration:
    await iteration.next("3000000000");

    // Current iteration = 2, MF = 3/3
    await expectCurrent(true, 2);
    await expectMF("2", "3", "3");

    // Add/remove some DAI to/from the current iteration:
    // Total to remain: 30
    await iteration.addDAI("2", "40");
    expect(await iteration.totalReceived("2")).to.eq("40");
    await iteration.subDAI("2", "10");
    expect(await iteration.totalReceived("2")).to.eq("30");

    // Set the soft cap timestamp:
    await iteration.setSoftCapReached("2", "123123");

    // Go to the next iteration:
    await iteration.next("4000000000");

    // Current iteration = 3, MF = 3/3
    await expectCurrent(true, 3);
    await expectMF("3", "4", "4");

    // Add/remove some DAI to/from the current iteration:
    // Total to remain: 40
    await iteration.addDAI("3", "50");
    expect(await iteration.totalReceived("3")).to.eq("50");
    await iteration.subDAI("3", "10");
    expect(await iteration.totalReceived("3")).to.eq("40");

    // Set the soft cap timestamp:
    await iteration.setSoftCapReached("3", "123123");

    // Should revert if going past the last iteration:
    await expect(iteration.next("500000000")).to.be.revertedWith("No next iteration");

    // Final state:
    expect(await iteration.isActive("3")).to.eq(true);
  });
});
