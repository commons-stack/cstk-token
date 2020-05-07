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
    return factory.deploy(daiTokenAddress, cstkTokenAddress, cstkTokenManagerAddress,
      registryAddress, admins, _escapeHatchCaller, _escapeHatchDestination);
  }

  let registry: Registry;

  async function deployRegistry(
    admins: string[] = defaultAdmins,
    deployer: Signer = ownerSigner,
  ): Promise<Registry> {
    const factory = new RegistryFactory(deployer);
    return factory.deploy(admins);
  }

  let daiToken: ERC20;
  let cstkToken: ERC20;

  async function deployERC20(deployer: Signer = ownerSigner): Promise<ERC20> {
    const factory = new ERC20Factory(deployer);
    return factory.deploy();
  }

  beforeEach(async function () {
    signers = await ethers.getSigners();

    // Owner:
    ownerSigner = signers[0];
    owner = await ownerSigner.getAddress();

    // Set the admins:
    defaultAdmins = [
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
});
