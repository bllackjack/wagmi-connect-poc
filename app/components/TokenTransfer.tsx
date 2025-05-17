"use client";

import { useState } from "react";
import {
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import { parseEther } from "ethers";
import { useWallet } from "../hooks/useWallet";

// ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

export function TokenTransfer() {
  const { address, chainId, nativeTokenSymbol } = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<"native" | "usdc">(
    "native"
  );
  const [error, setError] = useState("");

  // Get USDC contract address for current chain
  const USDC_ADDRESSES = {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Mainnet
    5: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", // Goerli
    11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
    100: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83", // Gnosis
  } as const;

  // Get user's balance for selected token
  const { data: balance } = useBalance({
    address,
    token:
      selectedToken === "usdc"
        ? (USDC_ADDRESSES[
            chainId as keyof typeof USDC_ADDRESSES
          ] as `0x${string}`)
        : undefined,
  });

  // Setup contract write for USDC transfers
  const {
    data: usdcHash,
    writeContract: transferUSDC,
    isPending: isUSDCTransferPending,
  } = useWriteContract();

  // Setup native token transfer
  const {
    data: nativeHash,
    sendTransaction,
    isPending: isNativeTransferPending,
  } = useSendTransaction();

  // Wait for transaction receipts
  const { isLoading: isUSDCConfirming, isSuccess: isUSDCSuccess } =
    useWaitForTransactionReceipt({
      hash: usdcHash,
    });

  const { isLoading: isNativeConfirming, isSuccess: isNativeSuccess } =
    useWaitForTransactionReceipt({
      hash: nativeHash,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!recipient || !amount) {
      setError("Please fill in all fields");
      return;
    }

    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError("Invalid recipient address");
      return;
    }

    try {
      if (selectedToken === "usdc") {
        // USDC transfer
        transferUSDC({
          address: USDC_ADDRESSES[
            chainId as keyof typeof USDC_ADDRESSES
          ] as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient as `0x${string}`, parseEther(amount)],
        });
      } else {
        // Native token transfer
        sendTransaction({
          to: recipient as `0x${string}`,
          value: parseEther(amount),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const isPending = isUSDCTransferPending || isNativeTransferPending;
  const isConfirming = isUSDCConfirming || isNativeConfirming;
  const isSuccess = isUSDCSuccess || isNativeSuccess;
  const hash = usdcHash || nativeHash;

  return (
    <div className="mt-8 p-8 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20">
      <h2 className="text-2xl font-bold mb-6 text-white">Transfer Tokens</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) =>
              setSelectedToken(e.target.value as "native" | "usdc")
            }
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="native" className="bg-gray-900">
              {nativeTokenSymbol}
            </option>
            <option value="usdc" className="bg-gray-900">
              USDC
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="any"
            min="0"
            placeholder="0.0"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {balance && (
            <p className="mt-2 text-sm text-gray-300">
              Balance: {balance.formatted} {balance.symbol}
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending
            ? "Confirming..."
            : isConfirming
            ? "Processing..."
            : "Transfer"}
        </button>

        {isSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            Transaction successful! Hash: {hash}
          </div>
        )}
      </form>
    </div>
  );
}
