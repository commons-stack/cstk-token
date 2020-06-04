import "./util/fixProvider";

import { deployments, ethers } from "@nomiclabs/buidler";

import { AddressZero } from "ethers/constants";
import { Deployment } from "@nomiclabs/buidler/types";
import { Greeter } from "../build/types/Greeter";
import { expect } from "chai";

describe("Testing Greeter contract:", function () {
  let deployment: Deployment;
  let greeter: Greeter;

  beforeEach(async function () {
    await deployments.fixture();
    deployment = await deployments.get("Greeter");
    greeter = (await ethers.getContractAt("Greeter", deployment.address || "")) as Greeter;
  });

  it("Should deploy the contract", async function () {
    expect(greeter.address).to.not.eq(AddressZero);
  });

  describe("greeting()", function () {
    it("Should return the right value", async function () {
      expect(await greeter.greeting()).to.be.eq("Hello World!");
    });
  });

  describe("setGreeting()", function () {
    beforeEach(async function () {
      await greeter.setGreeting("OK COMPUTER");
    });
    it("Should set the right value", async function () {
      expect(await greeter.greeting()).to.be.eq("OK COMPUTER");
    });
  });
});
