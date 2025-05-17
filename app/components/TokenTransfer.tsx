"use client";

import { useState, useMemo, useEffect } from "react";
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
import { TOKEN_ADDRESSES } from "../hooks/useWallet";

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
  const {
    address,
    chainId,
    nativeTokenSymbol,
    allTokenBalances,
    isLoadingTokens,
  } = useWallet();
  const { tokens, loading: tokensLoading } = useTokens();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<"native" | "erc20">(
    "native"
  );
  const [selectedERC20, setSelectedERC20] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  // Get user's native token balance
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address,
    token: chainId
      ? (TOKEN_ADDRESSES.USDC[
          chainId as keyof typeof TOKEN_ADDRESSES.USDC
        ] as `0x${string}`)
      : undefined,
  });

  // Get stETH balance
  const { data: stethBalance } = useBalance({
    address,
    token: chainId
      ? (TOKEN_ADDRESSES.STETH[
          chainId as keyof typeof TOKEN_ADDRESSES.STETH
        ] as `0x${string}`)
      : undefined,
  });

  // Get token balances
  const tokenBalances = useTokenBalances(tokens, chainId, address);

  // Get owned tokens
  const ownedTokens = useMemo(() => {
    return tokenBalances
      .filter(({ balance }) => balance && Number(balance.value) > 0)
      .map(({ token, balance }) => ({ token, balance }));
  }, [tokenBalances]);

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
  const selectedTokenAddress = useMemo(() => {
    if (selectedToken === "native") return undefined;

    // If a specific ERC20 token is selected
    if (selectedToken === "erc20" && selectedERC20) {
      return selectedERC20;
    }

    return undefined;
  }, [selectedToken, selectedERC20]);

  // Get user's balance for selected token
  const { data: balance } = useBalance({
    address,
    token: selectedTokenAddress as `0x${string}` | undefined,
  });

  // Setup contract write for ERC20 transfers with gas estimation
  const {
    data: erc20Hash,
    writeContract: transferERC20,
    isPending: isERC20TransferPending,
    error: erc20Error,
  } = useWriteContract();

  // Setup native token transfer with gas estimation
  const {
    data: nativeHash,
    sendTransaction,
    isPending: isNativeTransferPending,
    error: nativeError,
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

  // Validate amount against balance
  const validateAmount = (amount: string, balance: bigint | undefined) => {
    if (!balance) return false;
    try {
      const amountWei = parseEther(amount);
      return amountWei <= balance;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsEstimatingGas(true);

    try {
      // Basic validation
      if (!recipient || !amount) {
        setError("Please fill in all fields");
        return;
      }

      if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        setError("Invalid recipient address");
        return;
      }

      // Check if amount is a valid number
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        setError("Please enter a valid amount greater than 0");
        return;
      }

      // Check if user has enough balance
      if (selectedToken === "erc20" && selectedTokenAddress) {
        if (!balance || !validateAmount(amount, balance.value)) {
          setError("Insufficient token balance");
          return;
        }
      } else {
        if (!nativeBalance || !validateAmount(amount, nativeBalance.value)) {
          setError("Insufficient native token balance");
          return;
        }
      }

      // Execute transfer
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
      // Handle specific error cases
      if (err instanceof Error) {
        if (err.message.includes("user rejected")) {
          setError("Transaction was rejected by user");
        } else if (err.message.includes("insufficient funds")) {
          setError("Insufficient funds for gas * price + value");
        } else if (err.message.includes("gas required exceeds allowance")) {
          setError("Transaction would exceed gas limit");
        } else {
          setError(`Transaction failed: ${err.message}`);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsEstimatingGas(false);
    }
  };

  // Handle contract errors
  useEffect(() => {
    if (erc20Error) {
      if (erc20Error.message.includes("user rejected")) {
        setError("Transaction was rejected by user");
      } else if (erc20Error.message.includes("insufficient funds")) {
        setError("Insufficient funds for gas * price + value");
      } else {
        setError(`Contract error: ${erc20Error.message}`);
      }
    }
  }, [erc20Error]);

  // Handle native transfer errors
  useEffect(() => {
    if (nativeError) {
      if (nativeError.message.includes("user rejected")) {
        setError("Transaction was rejected by user");
      } else if (nativeError.message.includes("insufficient funds")) {
        setError("Insufficient funds for gas * price + value");
      } else {
        setError(`Transfer error: ${nativeError.message}`);
      }
    }
  }, [nativeError]);

  const isPending = isERC20TransferPending || isNativeTransferPending;
  const isConfirming = isERC20Confirming || isNativeConfirming;
  const isSuccess = isERC20Success || isNativeSuccess;
  const hash = erc20Hash || nativeHash;

  return (
    <div className="mt-8 p-8 bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20">
      <h2 className="text-2xl font-bold mb-6 text-white">Transfer Tokens</h2>

      {/* Your Tokens Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Your Tokens</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Native Token */}
          {nativeBalance && Number(nativeBalance.value) > 0 && (
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="font-medium text-white">{nativeTokenSymbol}</div>
              <div className="text-sm text-gray-400">Native Token</div>
              <div className="text-green-400 mt-2">
                Balance: {nativeBalance.formatted}
              </div>
            </div>
          )}

          {/* stETH */}
          {stethBalance && Number(stethBalance.value) > 0 && (
            <div className="p-4 rounded-lg border border-white/10 bg-purple-500/10">
              <div className="font-medium text-white">stETH</div>
              <div className="text-sm text-gray-400">Staked ETH</div>
              <div className="text-green-400 mt-2">
                Balance: {stethBalance.formatted}
              </div>
            </div>
          )}

          {/* USDC */}
          {usdcBalance && Number(usdcBalance.value) > 0 && (
            <div className="p-4 rounded-lg border border-white/10 bg-blue-500/10">
              <div className="font-medium text-white">USDC</div>
              <div className="text-sm text-gray-400">USD Coin</div>
              <div className="text-green-400 mt-2">
                Balance: {usdcBalance.formatted}
              </div>
            </div>
          )}

          {/* Other ERC20 Tokens */}
          {ownedTokens.map(({ token, balance }) => (
            <div
              key={token.id}
              className="p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="font-medium text-white">{token.symbol}</div>
              <div className="text-sm text-gray-400">{token.name}</div>
              {balance && (
                <div className="text-green-400 mt-2">
                  Balance: {balance.formatted}
                </div>
              )}
            </div>
          ))}

          {/* All detected ERC20 tokens */}
          {isLoadingTokens ? (
            <div className="col-span-full text-center text-gray-400 py-4">
              Loading tokens...
            </div>
          ) : allTokenBalances.length > 0 ? (
            allTokenBalances.map((token) => (
              <div
                key={token.address}
                className="p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-sm text-gray-400">{token.name}</div>
                <div className="text-green-400 mt-2">
                  Balance: {token.balance}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400 py-4">
              No tokens found in your wallet
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => {
              const newValue = e.target.value as "native" | "erc20";
              setSelectedToken(newValue);
              // Reset selectedERC20 when switching to native token
              if (newValue === "native") {
                setSelectedERC20("");
              }
            }}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="native" className="bg-gray-900">
              {nativeTokenSymbol}{" "}
              {nativeBalance && `(${nativeBalance.formatted})`}
            </option>
            {stethBalance && Number(stethBalance.value) > 0 && (
              <option value="erc20" className="bg-gray-900">
                stETH ({stethBalance.formatted})
              </option>
            )}
            {usdcBalance && Number(usdcBalance.value) > 0 && (
              <option value="erc20" className="bg-gray-900">
                USDC ({usdcBalance.formatted})
              </option>
            )}
            <option value="erc20" className="bg-gray-900">
              Other ERC20 Token
            </option>
            {allTokenBalances.map((token) => (
              <option
                key={token.address}
                value="erc20"
                className="bg-gray-900"
                onClick={() => setSelectedERC20(token.address)}
              >
                {token.symbol} ({token.balance})
              </option>
            ))}
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
                    const tokenBalance = allTokenBalances.find(
                      (tb) =>
                        tb.address ===
                        token.platforms[chainId?.toString() || ""]
                    );
                    const hasBalance =
                      tokenBalance && Number(tokenBalance.balance) > 0;
                    const isSelected =
                      selectedERC20 ===
                      token.platforms[chainId?.toString() || ""];

                    return (
                      <button
                        key={token.id}
                        type="button"
                        onClick={() =>
                          hasBalance &&
                          setSelectedERC20(
                            token.platforms[chainId?.toString() || ""]
                          )
                        }
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
                            Balance: {tokenBalance.balance}
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
            <div className="font-medium mb-1">Error</div>
            <div>{error}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={
            isPending ||
            isConfirming ||
            isEstimatingGas ||
            (selectedToken === "erc20" && !selectedTokenAddress)
          }
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isEstimatingGas
            ? "Estimating Gas..."
            : isPending
            ? "Confirming..."
            : isConfirming
            ? "Processing..."
            : "Transfer"}
        </button>

        {isSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            <div className="font-medium mb-1">Success!</div>
            <div>Transaction successful!</div>
            <div className="mt-1 text-xs break-all">Hash: {hash}</div>
          </div>
        )}
      </form>
    </div>
  );
}
