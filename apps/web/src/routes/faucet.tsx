import { createFileRoute } from "@tanstack/react-router"
import { FaucetPage } from "../features/faucet/components/faucet-page"

export const Route = createFileRoute("/faucet")({ component: FaucetPage })
