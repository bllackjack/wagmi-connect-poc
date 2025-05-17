"use client";

import { useState, useMemo } from "react";
import {
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import { parseEther } from "ethers";
import { useWallet } from "../hooks/useWallet";
import { useTokens } from "../hooks/useTokens";
import { useTokenBalances } from "../hooks/useTokenBalances";

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
  const { tokens, loading: tokensLoading } = useTokens();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<"native" | "erc20">(
    "native"
  );
  const [selectedERC20, setSelectedERC20] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Get user's native token balance
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Get token balances
  const tokenBalances = useTokenBalances(tokens, chainId, address);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesSearch =
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tokens, searchQuery]);

  // Get selected token's contract address
  const selectedTokenAddress =
    selectedToken === "erc20" && selectedERC20
      ? tokens.find((t) => t.id === selectedERC20)?.platforms[
          chainId?.toString() || ""
        ]
      : undefined;

  // Get user's balance for selected token
  const { data: balance } = useBalance({
    address,
    token: selectedTokenAddress as `0x${string}` | undefined,
  });

  // Setup contract write for ERC20 transfers
  const {
    data: erc20Hash,
    writeContract: transferERC20,
    isPending: isERC20TransferPending,
  } = useWriteContract();

  // Setup native token transfer
  const {
    data: nativeHash,
    sendTransaction,
    isPending: isNativeTransferPending,
  } = useSendTransaction();

  // Wait for transaction receipts
  const { isLoading: isERC20Confirming, isSuccess: isERC20Success } =
    useWaitForTransactionReceipt({
      hash: erc20Hash,
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
      if (selectedToken === "erc20" && selectedTokenAddress) {
        // ERC20 transfer
        transferERC20({
          address: selectedTokenAddress as `0x${string}`,
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

  const isPending = isERC20TransferPending || isNativeTransferPending;
  const isConfirming = isERC20Confirming || isNativeConfirming;
  const isSuccess = isERC20Success || isNativeSuccess;
  const hash = erc20Hash || nativeHash;

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
              setSelectedToken(e.target.value as "native" | "erc20")
            }
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="native" className="bg-gray-900">
              {nativeTokenSymbol}{" "}
              {nativeBalance && `(${nativeBalance.formatted})`}
            </option>
            <option value="erc20" className="bg-gray-900">
              ERC20 Token
            </option>
          </select>

          {selectedToken === "erc20" && (
            <div className="mt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              {tokensLoading ? (
                <div className="mt-2 text-gray-400">Loading tokens...</div>
              ) : filteredTokens.length === 0 ? (
                <div className="mt-2 text-gray-400">
                  No tokens found matching your search.
                </div>
              ) : (
                <div className="mt-2 max-h-48 overflow-y-auto">
                  {filteredTokens.map((token) => {
                    const tokenBalance = tokenBalances.find(
                      (tb) => tb.token.id === token.id
                    )?.balance;
                    const hasBalance =
                      tokenBalance && Number(tokenBalance.value) > 0;
                    const isSelected = selectedERC20 === token.id;

                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() => hasBalance && setSelectedERC20(token.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                          isSelected
                            ? "bg-blue-500/20 text-white"
                            : hasBalance
                            ? "text-gray-300 hover:bg-white/5"
                            : "text-gray-500 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <div className="font-medium flex items-center justify-between">
                          <span>{token.symbol}</span>
                          {!hasBalance && (
                            <span className="text-xs bg-gray-700/50 px-2 py-1 rounded">
                              Not owned
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {token.name}
                        </div>
                        {tokenBalance && (
                          <div
                            className={`text-sm ${
                              hasBalance ? "text-green-400" : "text-gray-500"
                            }`}
                          >
                            Balance: {tokenBalance.formatted}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
          disabled={
            isPending ||
            isConfirming ||
            (selectedToken === "erc20" && !selectedERC20)
          }
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
