import { useMemo } from "react";
import { useBalance } from "wagmi";
import { Token } from "../types";

export function useTokenBalances(
  tokens: Token[],
  chainId: number | undefined,
  address: `0x${string}` | undefined
) {
  // Get all contract addresses for tokens on the current chain
  const contractAddresses = useMemo(() => {
    return tokens
      .map((token) => token.platforms[chainId?.toString() || ""])
      .filter((addr): addr is string => !!addr)
      .map((addr) => addr as `0x${string}`);
  }, [tokens, chainId]);

  // Get balances for all contract addresses
  const balances = useBalance({
    address,
    token: contractAddresses[0], // We'll only get the first token's balance for now
  });

  // Return tokens with their balances
  return useMemo(() => {
    return tokens.map((token) => {
      const contractAddress = token.platforms[chainId?.toString() || ""];
      if (!contractAddress) return { token, balance: null };

      // For now, we'll only show balance for the first token
      // This is a limitation we can improve later if needed
      const balance =
        contractAddress === contractAddresses[0] ? balances.data : null;
      return { token, balance };
    });
  }, [tokens, chainId, contractAddresses, balances.data]);
}
