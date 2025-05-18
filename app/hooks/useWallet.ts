"use client";

import { useAccount, useBalance } from "wagmi";
import { useChainId } from "wagmi";
import { formatEther } from "ethers";
import { NATIVE_TOKENS, TOKEN_ADDRESSES } from "../constants/TokenAddresses";
import { useFetchAllTokenBalances } from "./useFetchAllTokenBalances";

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { allTokenBalances, isLoadingTokens, directUsdcBalance } =
    useFetchAllTokenBalances();

  // Fetch native token balance
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Fetch stETH balance
  // Adding this because I had some stETH and wanted to test if it fetches the correct value.
  const { data: stethBalance } = useBalance({
    address,
    token: chainId
      ? (TOKEN_ADDRESSES.STETH[
          chainId as keyof typeof TOKEN_ADDRESSES.STETH
        ] as `0x${string}`)
      : undefined,
  });

  return {
    address,
    isConnected,
    chainId,
    nativeTokenSymbol: chainId
      ? NATIVE_TOKENS[chainId as keyof typeof NATIVE_TOKENS]
      : "Unknown",
    nativeBalance: nativeBalance ? formatEther(nativeBalance.value) : "0",
    usdcBalance: directUsdcBalance ? formatEther(directUsdcBalance.value) : "0",
    stethBalance: stethBalance ? formatEther(stethBalance.value) : "0",
    allTokenBalances,
    isLoadingTokens,
  };
}
