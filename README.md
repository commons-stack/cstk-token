# :seedling: Commons Stack Contribution Token :seedling:

<<<<<<< HEAD
This repo contains the smart contracts for the CSTK token contribution.
=======
## Running tests

Run ganache in a seperate terminal

```
ganache-cli 
```

Then run the truffle suite
>>>>>>> 2f5d2b6... Update README.md

## Installation:

Clone the repo to your local machine. Run `npm install`.

<<<<<<< HEAD
If you want to run gas reports, install ganache-cli globally.
=======
create .secret with a seed phrase
>>>>>>> 2f5d2b6... Update README.md

Make sure to create the environment configuration and set env varables.
You can modify the env template:

<<<<<<< HEAD
`cp .env.example .env`
=======
truffle test --network development

>>>>>>> 2f5d2b6... Update README.md

**NOTE:** The **MNEMONIC** in the template should not be loaded with mainnet eth! Your funds **will** be stolen!

## Building the contracts:

To build, the contracts, run:

`npm run build`

This will compile the contracts with the configured version of solc, and generate the type-safe contract code with Typechain.

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
