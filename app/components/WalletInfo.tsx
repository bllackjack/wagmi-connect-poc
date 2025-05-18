"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "../hooks/useWallet";
import { TokenTransfer } from "./TokenTransfer";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  11155111: "Sepolia Testnet",
  100: "Gnosis Chain",
};

export function WalletInfo() {
  const {
    isConnected,
    address,
    chainId,
    nativeTokenSymbol,
    nativeBalance,
    usdcBalance,
  } = useWallet();

  return (
    <div className="p-4 flex flex-col items-center">
      <ConnectButton
        label="Connect Wallet"
        accountStatus="full"
        chainStatus={{
          largeScreen: "full",
          smallScreen: "icon",
        }}
        showBalance={{
          largeScreen: true,
          smallScreen: false,
        }}
      />
      <div className="mt-4 space-y-2">
        {isConnected && (
          <>
            <p>
              Connected to: {chainId ? CHAIN_NAMES[chainId] : "Unknown Network"}
            </p>
            <p>Address: {address}</p>
            <p>
              Native Token Balance: {nativeBalance} {nativeTokenSymbol}
            </p>
            <p>USDC Balance: {usdcBalance} USDC</p>
          </>
        )}
      </div>
      <TokenTransfer />
    </div>
  );
}
