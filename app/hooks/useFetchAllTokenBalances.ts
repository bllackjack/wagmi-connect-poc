import { useAccount, useBalance } from "wagmi";
import { useChainId } from "wagmi";
import { formatEther } from "ethers";
import { useState, useEffect } from "react";
import { TOKEN_ADDRESSES } from "../constants/TokenAddresses";

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface TokenBalance extends TokenInfo {
  balance: string;
}

export const useFetchAllTokenBalances = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [allTokenBalances, setAllTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  // Fetch USDC balance directly using wagmi
  const { data: directUsdcBalance } = useBalance({
    address,
    token: chainId
      ? (TOKEN_ADDRESSES.USDC[
          chainId as keyof typeof TOKEN_ADDRESSES.USDC
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
        const baseTokens: TokenInfo[] = data.tokens
          ? Object.values(data.tokens)
          : [];

        // Ensure USDC is in the list
        const usdcAddress =
          TOKEN_ADDRESSES.USDC[chainId as keyof typeof TOKEN_ADDRESSES.USDC];

        const tokens =
          usdcAddress &&
          !baseTokens.some(
            (t) => t.address.toLowerCase() === usdcAddress.toLowerCase()
          )
            ? [
                ...baseTokens,
                {
                  address: usdcAddress,
                  symbol: "USDC",
                  name: "USD Coin",
                  decimals: 6,
                },
              ]
            : baseTokens;

        // Fetch balances for all tokens
        const balances = await Promise.all(
          tokens.map(async (token) => {
            try {
              // For USDC, use the direct balance if available
              if (token.symbol === "USDC" && directUsdcBalance) {
                return {
                  ...token,
                  balance: formatEther(directUsdcBalance.value),
                };
              }

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
        const validBalances = balances.filter(
          (b): b is TokenBalance => b !== null
        );
        setAllTokenBalances(validBalances);
      } catch (error) {
        console.error("Error fetching token balances:", error);
      } finally {
        setIsLoadingTokens(false);
      }
    };

    if (isConnected) {
      fetchAllTokenBalances();
    }
  }, [address, chainId, isConnected, directUsdcBalance]);

  return {
    allTokenBalances,
    isLoadingTokens,
    directUsdcBalance,
  };
};
