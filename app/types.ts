export interface Token {
  id: string;
  symbol: string;
  name: string;
  platforms: {
    [chainId: string]: string;
  };
}
