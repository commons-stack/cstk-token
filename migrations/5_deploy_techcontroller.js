//const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");
const DAI = artifacts.require("DAI");
const resolveAccounts = require("./resolve_accounts");

module.exports = async (deployer, network, accounts) => {
    const deployAccounts = resolveAccounts.getAccounts(accounts);
    const dai = await DAI.deployed();
    let daiAddress = deployAccounts.daiaddress || dai.address;
    const techToken = await MiniMeToken.deployed();
    // console.log(techToken.address, daiAddress, deployAccounts.daireceiver);
    await deployer.deploy(TechController, techToken.address, daiAddress, deployAccounts.daireceiver);
    //await deployer.deploy(TechController, daiAddress, deployAccounts.daireceiver);

};
