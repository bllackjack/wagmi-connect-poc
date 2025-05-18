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
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Details from "./Details";
import TransferForm from "./TransferForm";

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
    isConnected,
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-8">
            Welcome to Token Transfer
          </h1>
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="px-12 py-6 bg-blue-900 hover:bg-blue-800 text-white text-2xl font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all transform hover:scale-105 shadow-lg"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-8 mt-5">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Section - Wallet Info & Tokens */}
        <Details
          chainId={chainId}
          address={address}
          nativeTokenSymbol={nativeTokenSymbol}
          nativeBalance={nativeBalance}
          allTokenBalances={allTokenBalances}
          isLoadingTokens={isLoadingTokens}
        />

        {/* Right Section - Transfer Form */}
        <TransferForm
          handleSubmit={handleSubmit}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          setSelectedERC20={setSelectedERC20}
          nativeTokenSymbol={nativeTokenSymbol}
          nativeBalance={nativeBalance}
          allTokenBalances={allTokenBalances}
          tokensLoading={tokensLoading}
          filteredTokens={filteredTokens}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          error={error}
          isPending={isPending}
          isConfirming={isConfirming}
          isEstimatingGas={isEstimatingGas}
          isSuccess={isSuccess}
          hash={hash}
          chainId={chainId}
          selectedTokenAddress={selectedTokenAddress}
          recipient={recipient}
          setRecipient={setRecipient}
          amount={amount}
          setAmount={setAmount}
          balance={balance}
          selectedERC20={selectedERC20}
        />
      </div>
    </div>
  );
}
