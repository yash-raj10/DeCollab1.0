require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296,
      gasPrice: 100000000, // 0.1 gwei (Hedera uses tinybar, 1 HBAR = 100,000,000 tinybar)
    },
    hederaMainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 295,
      gasPrice: 100000000, // 0.1 gwei
    },
  },
  etherscan: {
    apiKey: {
      hederaTestnet: process.env.HASHSCAN_API_KEY || "",
      hederaMainnet: process.env.HASHSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "hederaTestnet",
        chainId: 296,
        urls: {
          apiURL: "https://hashscan.io/testnet/api",
          browserURL: "https://hashscan.io/testnet",
        },
      },
      {
        network: "hederaMainnet",
        chainId: 295,
        urls: {
          apiURL: "https://hashscan.io/mainnet/api",
          browserURL: "https://hashscan.io/mainnet",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
