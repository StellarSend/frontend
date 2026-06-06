import { createFileRoute } from "@tanstack/react-router"
import { PoolsPage } from "../features/pools/components/pools-page"

export const Route = createFileRoute("/pools")({ component: PoolsPage })
