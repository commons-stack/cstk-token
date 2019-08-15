const DAI = artifacts.require("DAI");
const resolveAccounts = require("./resolve_accounts");

module.exports = function (deployer, network, accounts) {
    const deployAccounts = resolveAccounts.getAccounts(accounts);
    resolveAccounts.printAccounts(deployAccounts);

    if (!deployAccounts.daiaddress) {
        // initial balance in DAI for contributor
        var contributorInitialBalance = "10000000" + "000000000000000000";
        deployer.deploy(DAI, deployAccounts.contributor, contributorInitialBalance);
    } else {
        console.log(`Not deploying test DAI - using ${deployAccounts.daiaddress}`);
    }


};
