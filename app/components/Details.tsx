import { TokenBalance } from "../hooks/useFetchAllTokenBalances";

interface DetailsProps {
  chainId: number;
  address: `0x${string}` | undefined;
  nativeTokenSymbol: string;
  nativeBalance:
    | {
        decimals: number;
        formatted: string;
        symbol: string;
        value: bigint;
      }
    | undefined;
  allTokenBalances: TokenBalance[];
  isLoadingTokens: boolean;
}

const Details = ({
  chainId,
  address,
  nativeTokenSymbol,
  nativeBalance,
  allTokenBalances,
  isLoadingTokens,
}: DetailsProps) => {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Your Wallet</h2>

      {/* Connection Status */}
      <div className="mb-8 p-4 bg-gray-700/50 rounded-xl">
        <div className="text-sm text-gray-400 mb-2">Connected Account</div>
        <div className="font-mono text-white break-all">{address}</div>
        <div className="mt-2 text-sm text-gray-400">
          Network: {chainId} ({nativeTokenSymbol})
        </div>
      </div>

      {/* Tokens Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Your Tokens</h3>
        <div className="space-y-4">
          {/* Native Token */}
          {nativeBalance && Number(nativeBalance.value) > 0 && (
            <div className="p-4 bg-gray-700/50 rounded-xl border border-gray-600">
              <div className="font-medium text-white">{nativeTokenSymbol}</div>
              <div className="text-sm text-gray-400">Native Token</div>
              <div className="text-green-400 mt-2">
                Balance: {nativeBalance.formatted}
              </div>
            </div>
          )}

          {/* stETH */}
          {/* {stethBalance && Number(stethBalance.value) > 0 && (
            <div className="p-4 rounded-lg border border-white/10 bg-purple-500/10">
              <div className="font-medium text-white">stETH</div>
              <div className="text-sm text-gray-400">Staked ETH</div>
              <div className="text-green-400 mt-2">
                Balance: {stethBalance.formatted}
              </div>
            </div>
          )} */}

          {/* USDC */}
          {/* {usdcBalance && Number(usdcBalance.value) > 0 && (
            <div className="p-4 rounded-lg border border-white/10 bg-blue-500/10">
              <div className="font-medium text-white">USDC</div>
              <div className="text-sm text-gray-400">USD Coin</div>
              <div className="text-green-400 mt-2">
                Balance: {usdcBalance.formatted}
              </div>
            </div>
          )} */}

          {/* Other ERC20 Tokens
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
          ))} */}

          {/* All detected ERC20 tokens */}
          {isLoadingTokens ? (
            <div className="text-center text-gray-400 py-4">
              Loading tokens...
            </div>
          ) : allTokenBalances.length > 0 ? (
            allTokenBalances.map((token) => (
              <div
                key={token.address}
                className="p-4 bg-gray-700/50 rounded-xl border border-gray-600"
              >
                <div className="font-medium text-white">{token.symbol}</div>
                <div className="text-sm text-gray-400">{token.name}</div>
                <div className="text-green-400 mt-2">
                  Balance: {token.balance}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-4">
              No other tokens found in your wallet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Details;
