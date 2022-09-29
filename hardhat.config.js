require("@nomiclabs/hardhat-waffle");
require("solidity-coverage");

// https://hardhat.org/config/

module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200000,
      },
      outputSelection: {
        "*": {
          "*": ["devdoc", "userdoc", "storageLayout"],
        },
      },
    },
  },
};
