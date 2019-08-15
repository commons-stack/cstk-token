//const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");

module.exports = async (deployer, network, accounts) => {
    const minime = await MiniMeToken.deployed();
    const techController = await TechController.deployed();
    await minime.changeController(techController.address);
};
