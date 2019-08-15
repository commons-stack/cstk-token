const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");
const DAI = artifacts.require("DAI");
const resolveAccounts = require("../migrations/resolve_accounts");

contract('TechToken', function (accounts) {

    // describe('Minime', async () => {
    //     let minime, techController,deployAccounts;

    //     before(async () => {
    //         deployAccounts = resolveAccounts.getAccounts(accounts);

    //         minime = await MiniMeToken.deployed();



    // var techToken; // this is the MiniMeToken version
    // var dai;    // DAI test token
    // var miniMeTokenFactory;
    // var techController; // sample controller

    // var contributorInitialBalance = "1000000" + "000000000000000000";

    // var creator = accounts[0];
    // var contributor = accounts[1];
    // var daiReceiver = accounts[1];

    // describe('Deploy test DAI token', () => {
    //     it("should deploy test DAI contract", (done) => {
    //         DAI.new(contributor,contributorInitialBalance,{
    //             gas: 6000000
    //         }).then(function (_dai) {
    //             assert.ok(_dai.address);
    //             dai = _dai;
    //             console.log('DAI created at address', _dai.address);
    //             done();
    //         });
    //     });
    // });

    // describe('Deploy MiniMeToken TokenFactory', () => {
    //     it("should deploy MiniMeToken contract", (done) => {
    //         MiniMeTokenFactory.new({
    //             gas: 6000000
    //         }).then(function (_miniMeTokenFactory) {
    //             assert.ok(_miniMeTokenFactory.address);
    //             miniMeTokenFactory = _miniMeTokenFactory;
    //             console.log('miniMeTokenFactory created at address', _miniMeTokenFactory.address);
    //             done();
    //         });
    //     });
    // });

    // describe('Deploy MiniMeToken Token', function () {
    //     it("should deploy MiniMeToken contract", function (done) {
    //         MiniMeToken.new(
    //             miniMeTokenFactory.address,
    //             "0x0000000000000000000000000000000000000000",
    //             0,
    //             "TECH Token",
    //             18,
    //             "TT",
    //             true
    //         ).then(function (_miniMeToken) {
    //             assert.ok(_miniMeToken.address);
    //             console.log('techToken created at address', _miniMeToken.address);
    //             techToken = _miniMeToken;
    //             done();
    //         });
    //     });
    // });


    describe('Minime', async () => {

        let minime, deployAccounts;

        before(async () => {
            deployAccounts = resolveAccounts.getAccounts(accounts);
            minime = await MiniMeToken.deployed();
            techController = await TechController.deployed();
        });

        it("should not be able to change the controller again", async () => {
            try {
                await minime.changeController(deployAccounts.randomaccount)
                assert.fail(null, null, 'this function should throw', e);
            } catch (e) {
                // ok
            }
        });



    });

});