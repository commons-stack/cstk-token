
const deployAccountIndexes = {
    owner: 0,
    whitelistadmin: 1,  // who owns the token contribution whitelist
    contributor: 2,     // who contributes in DAI to receive TECH tokens
    contributor_tokendestination: 3,     // who contributes in DAI to receive TECH tokens
    daireceiver: 4,     // destination for the DAI
    randomaccount: 5,
};

module.exports = {
    getAccounts: (accounts) => {
        const deployaccounts = Object.keys(deployAccountIndexes).reduce((accum,deployaccountKey) => {
            accum[deployaccountKey] = accounts[deployAccountIndexes[deployaccountKey]];
            return accum;
        }, {});
        return deployaccounts;
    },
    printAccounts: (deployaccounts) => {
        console.log(JSON.stringify(deployaccounts,null,2));
    }
}