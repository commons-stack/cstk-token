const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const MiniMeToken = artifacts.require("MiniMeToken");
const TechController = artifacts.require("TechController");
const DAI = artifacts.require("DAI");
const resolveAccounts = require("../migrations/resolve_accounts");

contract('TechToken::Contribute', function (accounts) {


    describe('DAI', async () => {

        let minime, dai, techController, deployAccounts;

        before(async () => {
            deployAccounts = resolveAccounts.getAccounts(accounts);
            minime = await MiniMeToken.deployed();
            dai = await DAI.deployed();
            techController = await TechController.deployed();
        });

        it("should have no allowance DAI->techtokencontroller", async () => {
            const allowance = await dai.allowance(deployAccounts.contributor, techController.address);
            assert.equal(allowance, 0);
        });


        it("should create allowance DAI->techtokencontroller", async () => {
            await dai.approve(techController.address, 100, { from: deployAccounts.contributor });
        });

        it("should now have allowance DAI->techtokencontroller", async () => {
            const allowance = await dai.allowance(deployAccounts.contributor, techController.address);
            assert.equal(allowance, 100);
        });
    });

    describe('TechController::contribute', async () => {

        let techController, deployAccounts, dai, techToken;

        before(async () => {
            deployAccounts = resolveAccounts.getAccounts(accounts);
            techController = await TechController.deployed();
            techToken = await MiniMeToken.deployed();
            dai = await DAI.deployed();
        });

        it("should set a first phase", async () => {
            try {
                await techController.startContributionPhase(250, "984000" + "000000000000000000");
            } catch (e) {
                assert.fail(null, null, 'this function should not throw', e);
            }
        });

        it("should have the first phase parameters set (multiplier/cap)", async () => {
            const currentMultiplier = await techController.currentMultiplier();
            const currentHardCap = await techController.currentHardCap();
            assert.equal(currentMultiplier.toNumber(), 250);
            assert.equal(currentHardCap.toString(10), "984000" + "000000000000000000");
        });


        it("should not yet be able to buy 100 tokens when not whitelisted", async () => {
            try {
                await techController.contribute(100, deployAccounts.contributor_tokendestination, { from: deployAccounts.contributor })
                assert.fail(null, null, 'this function should throw', e);
            } catch (e) {
                // ok
            }
        });

        it("should add contributor to whitelist", async () => {
            try {
                await techController.whitelist(deployAccounts.contributor, 100, { from: deployAccounts.whitelistadmin })
            } catch (e) {
                assert.fail(null, null, 'this function should not throw', e);
            }
        });

        it("should now be able to buy 100 tokens when whitelisted", async () => {
            try {
                await techController.contribute(100, deployAccounts.contributor_tokendestination, { from: deployAccounts.contributor })
            } catch (e) {
                assert.fail(null, null, 'this function should not throw', e);
            }
        });

        it("contributor_tokendestination should now have a balance in tech tokens", async () => {
            const techBalance = await techToken.balanceOf(deployAccounts.contributor_tokendestination);
            assert.equal(techBalance.toNumber(), 100 * 2.5);
        });

        it("daireceiver should now have a balance in DAI ", async () => {
            const daireceiverBalance = await dai.balanceOf(deployAccounts.daireceiver);
            assert.equal(daireceiverBalance.toNumber(), 100);
        });

        it("should not be able more than personal cap", async () => {
            try {
                await techController.contribute(1, deployAccounts.contributor_tokendestination, { from: deployAccounts.contributor })
                assert.fail(null, null, 'this function should throw', e);
            } catch (e) {
                // ok
            }
        });


    });

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