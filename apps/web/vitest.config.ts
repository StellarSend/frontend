import { defineConfig, mergeConfig } from "vitest/config"
import viteTsConfigPaths from "vite-tsconfig-paths"
import { reactConfig } from "@repo/vitest-config/react"

export default mergeConfig(
  reactConfig,
  defineConfig({
    plugins: [
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
    ],
    define: {
      self: "globalThis",
      "import.meta.env.VITE_NETWORK": JSON.stringify("testnet"),
      "import.meta.env.VITE_RPC_URL": JSON.stringify("https://soroban-testnet.stellar.org"),
      "import.meta.env.VITE_HORIZON_URL": JSON.stringify("https://horizon-testnet.stellar.org"),
      "import.meta.env.VITE_CONTRACT_EXCHANGE_ROUTER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4",
      ),
      "import.meta.env.VITE_CONTRACT_SYNTHETICS_READER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSE2",
      ),
      "import.meta.env.VITE_CONTRACT_DATA_STORE": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSDS",
      ),
      "import.meta.env.VITE_CONTRACT_ORDER_VAULT": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSOV",
      ),
      "import.meta.env.VITE_CONTRACT_STAKING_ROUTER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSSR",
      ),
      "import.meta.env.VITE_CONTRACT_GLV_ROUTER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSGR",
      ),
      "import.meta.env.VITE_CONTRACT_VESTING_ROUTER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSVR",
      ),
      "import.meta.env.VITE_CONTRACT_REFERRAL_STORAGE": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSRS",
      ),
      "import.meta.env.VITE_CONTRACT_MARKET_FACTORY": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSMF",
      ),
      "import.meta.env.VITE_CONTRACT_DEPOSIT_HANDLER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSDH",
      ),
      "import.meta.env.VITE_CONTRACT_WITHDRAWAL_HANDLER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSWH",
      ),
      "import.meta.env.VITE_CONTRACT_ORACLE": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSO",
      ),
      "import.meta.env.VITE_CONTRACT_ORDER_HANDLER": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSOH",
      ),
      "import.meta.env.VITE_FAUCET": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSF",
      ),
      "import.meta.env.VITE_TOKEN_TUSDC": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABTUSDC",
      ),
      "import.meta.env.VITE_TOKEN_TWBTC": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABTWBTC",
      ),
      "import.meta.env.VITE_TOKEN_TETH": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABTETH",
      ),
      "import.meta.env.VITE_TOKEN_TXLM": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABTXLM",
      ),
      "import.meta.env.VITE_MARKET_TOKEN_TWBTC_TUSDC": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMT1",
      ),
      "import.meta.env.VITE_MARKET_TOKEN_TETH_TUSDC": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMT2",
      ),
      "import.meta.env.VITE_MARKET_TOKEN_TXLM_TUSDC": JSON.stringify(
        "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABMT3",
      ),
    },
    test: {
      include: ["src/**/*.{test,spec}.{ts,tsx}", "test/**/*.{test,spec}.{ts,tsx}"],
      deps: {
        inline: [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "@testing-library/react",
          "@testing-library/user-event",
          "@testing-library/jest-dom",
        ],
      },
    },
  }),
)
