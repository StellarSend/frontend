import { defineConfig, loadEnv } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import viteTsConfigPaths from "vite-tsconfig-paths"
import tailwindcss from "@tailwindcss/vite"
import { nitro } from "nitro/vite"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  // 1. Check root .env for VITE_NETWORK (defaults to testnet if not found)
  const rootEnv = loadEnv(mode, path.resolve(__dirname, "../../"), "VITE_")
  const network = rootEnv.VITE_NETWORK || "testnet"

  // 2. Load the actual variables for that network from apps/web/.env.{network}
  const networkEnv = loadEnv(network, __dirname, "VITE_")

  return {
    define: {
      // Ensure the network variable itself is set
      "import.meta.env.VITE_NETWORK": JSON.stringify(network),
      // Spread in all variables from the network-specific env file
      ...Object.entries(networkEnv).reduce(
        (acc, [key, val]) => {
          acc[`import.meta.env.${key}`] = JSON.stringify(val)
          return acc
        },
        {} as Record<string, string>
      ),
    },
    plugins: [
      nitro(),
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})
