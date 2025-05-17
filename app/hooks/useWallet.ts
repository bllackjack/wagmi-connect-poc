"use client";

import { useAccount, useBalance } from "wagmi";
import { useChainId } from "wagmi";
import { formatEther } from "ethers";
import { useState, useEffect } from "react";

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
const NATIVE_TOKENS = {
  1: "ETH",
  5: "ETH",
  11155111: "ETH",
  100: "xDAI",
} as const;

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface TokenBalance extends TokenInfo {
  balance: string;
}

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [allTokenBalances, setAllTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Fetch native token balance
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Fetch USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: chainId
      ? (TOKEN_ADDRESSES.USDC[
          chainId as keyof typeof TOKEN_ADDRESSES.USDC
        ] as `0x${string}`)
      : undefined,
  });

  // Fetch stETH balance
  const { data: stethBalance } = useBalance({
    address,
    token: chainId
      ? (TOKEN_ADDRESSES.STETH[
          chainId as keyof typeof TOKEN_ADDRESSES.STETH
        ] as `0x${string}`)
      : undefined,
  });

  // Fetch all token balances
  useEffect(() => {
    const fetchAllTokenBalances = async () => {
      if (!address || !chainId) return;

      setIsLoadingTokens(true);
      try {
        // Fetch token list for the current chain
        const response = await fetch(
          `https://tokens.1inch.io/v1.2/${chainId}/tokens.json`
        );
        const data = await response.json();
        const tokens: TokenInfo[] = Object.values(data.tokens);

        // Fetch balances for all tokens
        const balances = await Promise.all(
          tokens.map(async (token) => {
            try {
              const response = await fetch(
                `https://api.1inch.io/v5.0/${chainId}/balance?tokenAddress=${token.address}&walletAddress=${address}`
              );
              const data = await response.json();
              const balance = BigInt(data.balance);

              if (balance > BigInt(0)) {
                return {
                  ...token,
                  balance: formatEther(balance),
                };
              }
              return null;
            } catch (error) {
              console.error(
                `Error fetching balance for ${token.symbol}:`,
                error
              );
              return null;
            }
          })
        );

        // Filter out null balances and update state
        setAllTokenBalances(
          balances.filter((b): b is TokenBalance => b !== null)
        );
      } catch (error) {
        console.error("Error fetching token balances:", error);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    if (isConnected) {
      fetchAllTokenBalances();
    }
  }, [address, chainId, isConnected]);

  return {
    address,
    isConnected,
    chainId,
    nativeTokenSymbol: chainId
      ? NATIVE_TOKENS[chainId as keyof typeof NATIVE_TOKENS]
      : "Unknown",
    nativeBalance: nativeBalance ? formatEther(nativeBalance.value) : "0",
    usdcBalance: usdcBalance ? formatEther(usdcBalance.value) : "0",
    stethBalance: stethBalance ? formatEther(stethBalance.value) : "0",
    allTokenBalances,
    isLoadingTokens,
  };
}
