"use client";

import { useState, useEffect } from "react";

interface Token {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    [key: string]: string; // chainId: contractAddress
  };
}

export function useTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top 100 tokens by market cap
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false"
      );
      const data = await response.json();

      // Transform the data to match our Token interface
      const transformedTokens = data.map((token: Token) => ({
        id: token.id,
        symbol: token.symbol.toUpperCase(),
        name: token.name,
        platforms: token.platforms || {},
      }));

      setTokens(transformedTokens);
    } catch (err) {
      setError("Failed to fetch tokens");
      console.error("Error fetching tokens:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  return { tokens, loading, error, refetch: fetchTokens };
}
