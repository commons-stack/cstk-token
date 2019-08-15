const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");
const DAI = artifacts.require("DAI");
const resolveAccounts = require("../migrations/resolve_accounts");

contract('Setup', function (accounts) {

    describe('Minime', async () => {
        let minime, dai, techController, deployAccounts;

        before(async () => {
            deployAccounts = resolveAccounts.getAccounts(accounts);
            dai = await DAI.deployed();
            minime = await MiniMeToken.deployed();
            techController = await TechController.deployed();
        });

        it("should be deployed", async () => {
            // const minime = await MiniMeToken.deployed();
            assert.ok(minime.address);
        });

        it("should have a tokencontroller", async () => {
            const controllerAddress = await minime.controller();
            console.log(`techtoken controller=${controllerAddress}`);
            assert.ok(techController.address, `TechController at ${controllerAddress.address}`);
            assert.equal(techController.address, controllerAddress, "controller of the Tech token is not the Techcontroller");
        });

        it("should show addresses", async () => {
            console.log(`DAI at ${dai.address}`);
            console.log(`minime at ${minime.address}`);
            console.log(`techController at ${techController.address}`);
        });

    });
});