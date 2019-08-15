//const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");
const resolveAccounts = require("./resolve_accounts");

module.exports = async (deployer, network, accounts) => {
    // const minime = await MiniMeToken.deployed();
    const deployAccounts = resolveAccounts.getAccounts(accounts);
    const techController = await TechController.deployed();
    await techController.addWhitelistAdmin(deployAccounts.whitelistadmin);
};
