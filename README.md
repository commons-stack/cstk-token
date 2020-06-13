# :seedling: Commons Stack Contribution Token :seedling:

This repo contains the smart contracts for the CSTK token contribution.

## Installation:

Clone the repo to your local machine.

For optimal build, Node version 10 is recommended. If you use nvm, a .nvmrc file is present.

Run `npm install`.

If you want to run gas reports, install ganache-cli globally.

Make sure to create the environment configuration and set env varables.
You can modify the env template:

`cp .env.example .env`

**NOTE:** The **MNEMONIC** in the env.example should not be loaded with mainnet eth! Your funds **will** be stolen!

## Building the contracts:

To build, the contracts, run:

`npm run build`

This will compile the contracts with the configured version of solc, and generate the type-safe contract code with Typechain.

## Running the linter:

To run the Typescripts linter on the tests, run:

`npm run lint-test` or `npm run lint-test:fix` to fix auto-fixable errors.

## Running tests:

To run local tests (on Buidler EVM), run:

`npm run test`

If you want to create a gas measurement report first run an istance of ganache-cli on the default configuration (localhost, port 8545). Then, run:

`npm run test:gasreport`

If you want to generate a coverage report, run:

`npm run coverage`

Coverage runs its own instance of ganache-cli, and requires port 8555 to be open.

## Cleaning the environment:

To clean up build artefacts, typechain generated code and coverage reports, run:

`npm run clean`

## Deploying contracts:

To deploy the contracts to the Ropsten testnet, run:

`npm run deploy:ropsten`

The deployment will mint 1MM Mock DAI tokens and distribute them to a set number of ordered accounts generated from the mnemonic.

## Admin functions:

All admin functions assume the contracts are deployed on Ropsten.

To read all contributors from the trust registry, run:

`npm run admin:trusted-accounts`

To add a trusted account to the list and set the max trust, run:

`npm run admin:add-trusted <ADDRESS> <AMOUNT_TOKENS>`

To remove an existing account from the list, run:

`npm run admin:remove-trusted <ADDRESS>`

To mint mock DAI tokens to an address, run:

`npm run admin:mint-dai <ADDRESS> <AMOUNT>`

To mint CTSK tokens to an address, run:

`npm run admin:mint-cstk <ADDRESS> <AMOUNT>`
