module.exports = {
  istanbulFolder: "./build/coverage",
  istanbulReporters: ["html"],
  silent: true,
  providerOptions: {
    mnemonic: process.env.MNEMONIC,
    total_accounts: process.env.DEVCHAIN_ACCOUNT_NUM,
  },
};
