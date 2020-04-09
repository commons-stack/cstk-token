const Registry = artifacts.require("Registry");
const resolveAccounts = require("./resolve_accounts");

module.exports = async (deployer, network, accounts) => {
    const deployAccounts = resolveAccounts.getAccounts(accounts);
    resolveAccounts.printAccounts(deployAccounts);

    deployer.deploy(Registry, [deployAccounts.whitelistadmin, 
        deployAccounts.contributor, deployAccounts.contributor_tokendestination,
         deployAccounts.daireceiver, deployAccounts.randomaccount]);
};
