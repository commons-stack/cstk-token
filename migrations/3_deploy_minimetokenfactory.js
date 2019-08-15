const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");
const DAI = artifacts.require("DAI");
// const resolveAccounts = require("./resolve_accounts");

module.exports = function (deployer, network, accounts) {
    // const deployAccounts = resolveAccounts.getAccounts(deployer, accounts);
    deployer.deploy(MiniMeTokenFactory)
};
