"use client";

import { useAccount, useBalance } from "wagmi";
import { useChainId } from "wagmi";
import { formatEther } from "ethers";

// USDC contract addresses for different networks
const USDC_ADDRESSES = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet
  5: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", // Goerli
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
} as const;

export function useWallet() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { data: ethBalance } = useBalance({
    address,
  });

  const { data: usdcBalance } = useBalance({
    address,
    token: chainId
      ? (USDC_ADDRESSES[
          chainId as keyof typeof USDC_ADDRESSES
        ] as `0x${string}`)
      : undefined,
  });

  return {
    address,
    isConnected,
    chainId,
    ethBalance: ethBalance ? formatEther(ethBalance.value) : "0",
    usdcBalance: usdcBalance ? formatEther(usdcBalance.value) : "0",
  };
}
