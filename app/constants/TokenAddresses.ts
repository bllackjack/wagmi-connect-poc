// Common token contract addresses for different networks
export const TOKEN_ADDRESSES = {
  USDC: {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet
    5: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", // Goerli
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
    100: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", // Gnosis
  },
  STETH: {
    1: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // Mainnet
    5: "0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F", // Goerli
    11155111: "0x3F1c547b21f65e10480dA3B332E7d801E61deB35", // Sepolia
  },
} as const;

// Native token symbols for each chain
export const NATIVE_TOKENS = {
  1: "ETH",
  5: "ETH",
  11155111: "ETH",
  100: "xDAI",
} as const;
