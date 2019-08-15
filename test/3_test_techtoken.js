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

        it("should set a first phase", async () => {
            try {
                await techController.startContributionPhase(250,"984000" + "000000000000000000");
            } catch (e) {
                assert.fail(null, null, 'this function should not throw', e);
            }
        });

        it("should have the first phase parameters set (multiplier/cap)", async () => {
            const currentMultiplier = await techController.currentMultiplier();
            const currentHardCap = await techController.currentHardCap();
            assert.equal(currentMultiplier.toNumber(),250);
            assert.equal(currentHardCap.toString(10),"984000" + "000000000000000000");
        });


    });

    // describe('TechController', async () => {

    //     let techController,deployAccounts;

    //     before(async () => {
    //         deployAccounts = resolveAccounts.getAccounts(accounts);
    //         techController = await TechController.deployed();
    //     });

    //     // it("should be able to change the tokens' controller", async () => {
    //     //     console.log(`${techController.address} => ${deployAccounts.whitelistadmin}`)
    //     //     techController.passController(deployAccounts.whitelistadmin).then(() => {
    //     //         console.log("NOK");
    //     //     }).catch((e) => {
    //     //         assert.fail(null, null, 'this function should not throw', e);
    //     //     });
    //     // });


    // });

    // describe('Minting and burning tokens should not be possible by someone else than the controller', function () {

    //     it("should be impossible to call generateTokens", function (done) {
    //         techToken.generateTokens(creator, 1, {
    //             gas: 400000
    //         }).then(function () {
    //             assert.fail(null, null, 'This function should throw', e);
    //             done();
    //         }).catch(function (e) {
    //             done();
    //         });
    //     });

    //     it("should be impossible to call destroyTokens", function (done) {
    //         techToken.destroyTokens(creator, 1, {
    //             gas: 400000
    //         }).then(function () {
    //             assert.fail(null, null, 'This function should throw', e);
    //             done();
    //         }).catch(function (e) {
    //             done();
    //         });
    //     });
    // });



    // describe('Convert DAI to Tech with allowance', function() {

    //     it("should have correct balance on dai token contract", function(done) {
    //       var balance = dai.balanceOf.call(contributor).then(function(balance) {
    //         assert.equal(balance.valueOf(), contributorInitialBalance, "account not correct amount");
    //         done();
    //       });
    //     });

    //     it("should have zero balance on TechToken contract", function(done) {
    //       var balance = techToken.balanceOf.call(contributor).then(function(balance) {
    //         assert.equal(balance.valueOf(), 0, `account not correct amount ${balance.valueOf().toString()}`);
    //         done();
    //       });
    //     });

    //     // it("should give allowance to convert", function(done) {
    //     //   var balance = dai.balanceOf.call(contributor).then(function(balance) {
    //     //     assert.equal(balance.valueOf(), contributorInitialBalance, "account not correct amount");
    //     //     dai.approve(techController.address, contributorInitialBalance).then(function() {
    //     //       done();
    //     //     });
    //     //   });
    //     // });

    //     // it("allowance should be visible in Dai token contract", function(done) {
    //     //   var balance = dai.allowance.call(contributor, techController.address).then(function(allowanceamount) {
    //     //     assert.equal(allowanceamount.valueOf(), contributorInitialBalance, "allowanceamount not correct");
    //     //     done();
    //     //   });
    //     // });

    //     // it("should convert half of the Dai of this owner", function(done) {
    //     //   var balance = dai.balanceOf.call(contributor).then(function(balance) {
    //     //     techController.contribute(contributorInitialBalance, {
    //     //       gas: 400000
    //     //     }).then(function() {
    //     //       done();
    //     //     }).catch(function(e) {
    //     //       assert.fail(null, null, 'This function should not throw', e);
    //     //       done();
    //     //     });
    //     //   });
    //     // });

    //     // it("should have the correct balance on TechToken contract", function(done) {
    //     //   var balance = techToken.balanceOf.call(contributor).then(function(balance) {
    //     //     assert.equal(balance.valueOf(), contributorInitialBalance, "account not correct amount");
    //     //     done();
    //     //   });
    //     // });

    //     // it("there should be an DAI balance on the deposit wallet", function(done) {
    //     //   var balance = dai.balanceOf.call(daiReceiver).then(function(balance) {
    //     //     assert.equal(balance.valueOf(), contributorInitialBalance, "account not correct amount");
    //     //     done();
    //     //   });
    //     // });
    // });


});