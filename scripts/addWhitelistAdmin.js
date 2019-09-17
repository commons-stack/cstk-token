const TechController = artifacts.require("TechController");

module.exports = async () => {

    const addressToAdd = process.argv[process.argv.length - 2];
    const confirm = process.argv[process.argv.length - 1];

    if (confirm !== "y") {
        console.log(`Adding ${process.argv[process.argv.length - 1]} to whitelistAdmin role`);
        console.log(`Please add 'y' to this command to execute it`);
        process.exit();
    }

    const techController = await TechController.deployed();
    const res = await techController.addWhitelistAdmin(addressToAdd);

    console.log(`Done`,res);

}

