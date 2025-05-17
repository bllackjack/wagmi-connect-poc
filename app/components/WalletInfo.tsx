"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "../hooks/useWallet";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
};

export function WalletInfo() {
  const { isConnected, address, chainId, ethBalance, usdcBalance } =
    useWallet();

  return (
    <div className="p-4">
      <ConnectButton />

      {isConnected && (
        <div className="mt-4 space-y-2">
          <p>
            Connected to: {chainId ? CHAIN_NAMES[chainId] : "Unknown Network"}
          </p>
          <p>Address: {address}</p>
          <p>ETH Balance: {ethBalance} ETH</p>
          <p>USDC Balance: {usdcBalance} USDC</p>
        </div>
      )}
    </div>
  );
}
