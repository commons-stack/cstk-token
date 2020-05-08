# :seedling: Commons Stack Contribution Token :seedling:

This repo contains the smart contracts for the CSTK token contribution.

## Installation:

Clone the repo to your local machine. Run `npm install`.

If you want to run gas reports, install ganache-cli globally.

Make sure to create the environment configuration and set env varables.
You can modify the env template:

`cp .env.example .env`

**NOTE:** The **MNEMONIC** in the template should not be loaded with mainnet eth! Your funds **will** be stolen!

## Building the contracts:

To build, the contracts, run:

`npm run build`

This will compile the contracts with the configured version of solc, and generate the type-safe contract code with Typechain.

## Running the linter:

To run the Typescripts linter on the tests, run:

`npm run lint-tests` or `npm run lint-tests:fix` to fix auto-fixable errors.

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
