import { TokenBalance } from "../hooks/useFetchAllTokenBalances";
import { Token } from "../types";

interface TransferFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  selectedToken: "native" | "erc20";
  setSelectedToken: (value: "native" | "erc20") => void;
  setSelectedERC20: (value: string) => void;
  nativeTokenSymbol: string;
  nativeBalance?: {
    decimals: number;
    formatted: string;
    symbol: string;
    value: bigint;
  };
  allTokenBalances: TokenBalance[];
  tokensLoading: boolean;
  filteredTokens: Token[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  error: string;
  isPending: boolean;
  isConfirming: boolean;
  isEstimatingGas: boolean;
  isSuccess: boolean;
  hash: string | undefined;
  chainId: number;
  selectedTokenAddress: string | undefined;
  recipient: string;
  setRecipient: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  balance?: {
    decimals: number;
    formatted: string;
    symbol: string;
    value: bigint;
  };
  selectedERC20: string;
}

const TransferForm = ({
  handleSubmit,
  selectedToken,
  setSelectedToken,
  setSelectedERC20,
  nativeTokenSymbol,
  nativeBalance,
  allTokenBalances,
  tokensLoading,
  filteredTokens,
  searchQuery,
  setSearchQuery,
  error,
  isPending,
  isConfirming,
  isEstimatingGas,
  isSuccess,
  hash,
  chainId,
  selectedTokenAddress,
  recipient,
  setRecipient,
  amount,
  setAmount,
  balance,
  selectedERC20,
}: TransferFormProps) => {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Transfer Tokens</h2>

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
              if (newValue === "native") {
                setSelectedERC20("");
              }
            }}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="native" className="bg-gray-800">
              {nativeTokenSymbol}{" "}
              {nativeBalance && `(${nativeBalance.formatted})`}
            </option>
            <option value="erc20" className="bg-gray-800">
              Other ERC20 Token
            </option>
            {allTokenBalances.map((token) => (
              <option
                key={token.address}
                value={token.symbol}
                className="bg-gray-800"
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
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                        className={`w-full text-left px-4 py-2 rounded-xl transition-all ${
                          isSelected
                            ? "bg-blue-900/50 text-white"
                            : hasBalance
                            ? "text-gray-300 hover:bg-gray-700/50"
                            : "text-gray-500 cursor-not-allowed opacity-50"
                        }`}
                      >
                        <div className="font-medium flex items-center justify-between">
                          <span>{token.symbol}</span>
                          {!hasBalance && (
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded">
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
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {balance && (
            <p className="mt-2 text-sm text-gray-300">
              Balance: {balance.formatted} {balance.symbol}
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-400 text-sm">
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
          className="w-full py-4 px-4 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <div className="font-medium mb-1">Success!</div>
            <div>Transaction successful!</div>
            <div className="mt-1 text-xs break-all">Hash: {hash}</div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TransferForm;
