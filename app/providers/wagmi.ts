import { http } from "wagmi";
import { mainnet, sepolia, goerli, gnosis } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "Valory-Test-project",
  projectId: "72a218da6c5f5dd9c8d88817cb5b9d52", // Get this from WalletConnect Cloud
  chains: [mainnet, sepolia, goerli, gnosis],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [goerli.id]: http(),
    [gnosis.id]: http(),
  },
});
