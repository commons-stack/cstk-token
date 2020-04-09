const DAI = artifacts.require("DAI");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");
const Registry = artifacts.require("Registry");
const resolveAccounts = require("./resolve_accounts");

module.exports = async (deployer, network, accounts) => {
    const deployAccounts = resolveAccounts.getAccounts(accounts);
    resolveAccounts.printAccounts(deployAccounts);
    const dai = await DAI.deployed();
    console.log(`DAI at ${dai.address}`);
    const minime = await MiniMeToken.deployed();
    console.log(`MiniMeToken at ${minime.address}`);
    const tc = await TechController.deployed();
    console.log(`TechController at ${tc.address}`);
    const registry = await Registry.deployed();
    console.log(`Registry at ${registry.address}`);
};
