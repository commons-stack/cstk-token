import { ethers } from "@nomiclabs/buidler";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { Signer } from "ethers";
import { AddressZero } from "ethers/constants";

import { Registry } from "../../typechain/Registry";
import { RegistryFactory } from "../../typechain/RegistryFactory";

import { RCSTKToken } from "../../typechain/RCSTKToken";
import { RCSTKTokenFactory } from "../../typechain/RCSTKTokenFactory";

import { TokenBank } from "../../typechain/TokenBank";
import { TokenBankFactory } from "../../typechain/TokenBankFactory";

import { ERC20 } from "../../typechain/ERC20";
import { ERC20Factory } from "../../typechain/ERC20Factory";

// Use solidity matchers in chai:
use(solidity);

describe("Test rCSTK Token", function () {
  let signers: Signer[];
  let ownerSigner: Signer;
  let owner: string;
  let defaultAdmins: string[];
  let defaultContributors: string[];
  let defaultAllowances: number[];
  let otherSigner: Signer;
  let other: string;

  let defaultDaiTokenAddress: string;
  let defaultCstkTokenAddress: string;
  let defaultCstkTokenManagerAddress: string;
  let escapeHatchCaller: string;
  let escapeHatchDestination: string;

  let defaultRegistryAddress: string;

  let rCSTKToken: RCSTKToken;

  async function deploy(
    numerators: number[] = [1, 1, 1, 1, 1],
    denominators: number[] = [1, 1, 1, 1, 1],
    softCaps: number[] = [900, 900, 900, 900, 900],
    hardCaps: number[] = [1000, 1000, 1000, 1000, 1000],
    daiTokenAddress: string = defaultDaiTokenAddress,
    cstkTokenAddress: string = defaultCstkTokenAddress,
    cstkTokenManagerAddress: string = defaultCstkTokenAddress,
    registryAddress: string = defaultRegistryAddress,
    admins: string[] = defaultAdmins,
    _escapeHatchCaller: string = escapeHatchCaller,
    _escapeHatchDestination: string = escapeHatchDestination,
    deployer: Signer = ownerSigner,
  ): Promise<RCSTKToken> {
    const factory = new RCSTKTokenFactory(deployer);
    const rcstk = await factory.deploy(
      numerators,
      denominators,
      softCaps,
      hardCaps,
      daiTokenAddress,
      cstkTokenAddress,
      cstkTokenManagerAddress,
      registryAddress,
      admins,
      _escapeHatchCaller,
      _escapeHatchDestination,
    );
    await rcstk.deployed;
    return rcstk;
  }

  let registry: Registry;

  async function deployRegistry(
    admins: string[] = defaultAdmins,
    deployer: Signer = ownerSigner,
  ): Promise<Registry> {
    const factory = new RegistryFactory(deployer);
    const registry = await factory.deploy(admins);
    await registry.deployed;
    return registry;
  }

  let daiToken: ERC20;
  let cstkToken: ERC20;

  async function deployERC20(deployer: Signer = ownerSigner): Promise<ERC20> {
    const factory = new ERC20Factory(deployer);
    const erc20 = await factory.deploy();
    await erc20.deployed;
    return erc20;
  }

  beforeEach(async function () {
    signers = await ethers.getSigners();

    // Owner:
    ownerSigner = signers[0];
    owner = await ownerSigner.getAddress();

    // Set the admins:
    defaultAdmins = [await signers[1].getAddress()];
    defaultContributors = [
      await signers[2].getAddress(),
      await signers[3].getAddress(),
      await signers[4].getAddress(),
      await signers[5].getAddress(),
      await signers[6].getAddress(),
      await signers[7].getAddress(),
      await signers[8].getAddress(),
      await signers[9].getAddress(),
      await signers[10].getAddress(),
      await signers[11].getAddress(),
    ];

    defaultAllowances = [500, 500, 500, 500, 500, 500, 500, 500, 500, 500];

    // Other:
    otherSigner = signers[12];
    other = await otherSigner.getAddress();

    // Deploy registry contract:
    registry = await deployRegistry();
    defaultRegistryAddress = registry.address;

    // Deploy Dai contract:
    daiToken = await deployERC20();
    defaultDaiTokenAddress = daiToken.address;

    // Deploy Dai contract:
    cstkToken = await deployERC20();
    defaultCstkTokenAddress = cstkToken.address;

    escapeHatchCaller = owner;
    escapeHatchDestination = other;

    // Deploy rCSTK contract:
    rCSTKToken = await deploy();
    await registry.registerContributors(defaultContributors, defaultAllowances);
  });

  describe("When deploying registry contract", function () {
    it("Should deploy the registry contract", async function () {
      expect(registry.address).to.be.properAddress;
    });
  });

  describe("When deploying rCSTK Token contract", function () {
    it("Should deploy the rCSTK contract", async function () {
      expect(rCSTKToken.address).to.be.properAddress;
    });
  });

  describe("When start first iteration of rCSTK Token contract", function () {
    it("Should be paused before starting", async function () {
      expect(await rCSTKToken.paused()).to.be.true;
    });

    it("Should not be paused after started", async function () {
      await rCSTKToken.startFirstIteration();
      expect(await rCSTKToken.paused()).to.be.false;
    });
  });

  describe("Testing good path flow", function () {
    it("Should be paused before starting", async function () {
      expect(await rCSTKToken.paused()).to.be.true;
    });

    it("Should not be paused after started", async function () {
      await rCSTKToken.startFirstIteration();
      expect(await rCSTKToken.paused()).to.be.false;
    });

    it("Should go smoothly", async function () {
      await rCSTKToken.startFirstIteration();
      expect(await rCSTKToken.paused()).to.be.false;
    });
  });
});
